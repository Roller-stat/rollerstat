import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createPost, listPosts, PostData } from "@/lib/file-operations"
import * as dbOps from "@/lib/db-operations"
import { isDatabaseConfigured } from "@/lib/db/client"
import { z } from "zod"
import fs from "node:fs"
import path from "node:path"
import { SUPPORTED_LOCALES } from "@/lib/gemini-translate"
import { createCampaignFromPublishedPost } from "@/lib/newsletter"
import type { PostFile } from "@/lib/file-operations"

function resolveWebAppDir(): string {
  const candidates = [
    path.join(process.cwd(), "apps", "web"),
    path.join(process.cwd(), "..", "web"),
    path.join(process.cwd(), "..", "..", "apps", "web"),
  ]

  const existing = candidates.find(candidate =>
    fs.existsSync(path.join(candidate, "contentlayer.config.ts"))
  )

  return existing ?? candidates[0]
}

function isFileFallbackEnabled(): boolean {
  return process.env.NODE_ENV !== "production"
}

type PostStatus = "draft" | "published" | "archived"
type DateField = "publishedAt" | "createdAt" | "updatedAt"
type DatePreset = "all" | "today" | "7d" | "30d" | "custom"

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) {
    return fallback
  }
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return parsed
}

function normalizeStatus(post: PostFile): PostStatus {
  if (post.data.status === "archived" || post.data.status === "draft" || post.data.status === "published") {
    return post.data.status
  }
  return post.data.published ? "published" : "draft"
}

function parseCustomDate(value: string, endOfDay = false): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }
  const suffix = endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z"
  const parsed = new Date(`${value}${suffix}`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function resolveDateWindow(
  preset: DatePreset,
  startDate: string | null,
  endDate: string | null,
): { start: Date | null; end: Date | null } {
  if (preset === "all") {
    return { start: null, end: null }
  }

  if (preset === "custom") {
    return {
      start: startDate ? parseCustomDate(startDate) : null,
      end: endDate ? parseCustomDate(endDate, true) : null,
    }
  }

  const now = new Date()
  const start = new Date(now)
  start.setUTCHours(0, 0, 0, 0)

  if (preset === "7d") {
    start.setUTCDate(start.getUTCDate() - 6)
  } else if (preset === "30d") {
    start.setUTCDate(start.getUTCDate() - 29)
  }

  return { start, end: now }
}

function resolveDateValue(post: {
  publishedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}, field: DateField): Date | null {
  const raw =
    field === "publishedAt"
      ? post.publishedAt
      : field === "createdAt"
        ? post.createdAt
        : post.updatedAt

  if (!raw) {
    return null
  }

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function resolvePrimarySortTimestamp(post: { publishedAt: string | null; createdAt: string | null }): number {
  const publishedAt = post.publishedAt ? new Date(post.publishedAt).getTime() : Number.NaN
  if (Number.isFinite(publishedAt)) {
    return publishedAt
  }

  const createdAt = post.createdAt ? new Date(post.createdAt).getTime() : Number.NaN
  if (Number.isFinite(createdAt)) {
    return createdAt
  }

  return 0
}

// Validation schema for post creation
const createPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  summary: z.string().min(1, "Summary is required"),
  type: z.enum(["news", "blog"]),
  locale: z.enum(["en", "es", "fr", "it", "pt"]),
  targetLocales: z.array(z.enum(["en", "es", "fr", "it", "pt"])).optional().default([]),
  translationMode: z.enum(["translate-only"]).optional().default("translate-only"),
  coverImage: z.string().optional(),
  heroVideo: z.string().optional(),
  published: z.boolean(),
  tags: z.array(z.string()).default([]),
  content: z.string().min(1, "Content is required"),
  translation_key: z.string().optional(),
  sendNewsletter: z.boolean().optional(),
  newsletterSubject: z.string().max(180).optional(),
  newsletterPreviewText: z.string().max(200).optional(),
  newsletterScheduleAt: z.string().optional(),
})

// GET /api/admin/posts - List all posts
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const localeParam = searchParams.get("locale")
    const typeParam = searchParams.get("type")
    const statusParam = searchParams.get("status")
    const q = (searchParams.get("q") || "").trim().toLowerCase()
    const dateFieldParam = searchParams.get("dateField")
    const datePresetParam = searchParams.get("datePreset")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const locale =
      localeParam && ["en", "es", "fr", "it", "pt"].includes(localeParam)
        ? (localeParam as "en" | "es" | "fr" | "it" | "pt")
        : undefined
    const type =
      typeParam === "news" || typeParam === "blog"
        ? (typeParam as "news" | "blog")
        : undefined
    const statusFilter =
      statusParam === "draft" || statusParam === "published" || statusParam === "archived"
        ? (statusParam as PostStatus)
        : undefined
    const dateField: DateField =
      dateFieldParam === "createdAt" || dateFieldParam === "updatedAt" || dateFieldParam === "publishedAt"
        ? dateFieldParam
        : "publishedAt"
    const datePreset: DatePreset =
      datePresetParam === "today" || datePresetParam === "7d" || datePresetParam === "30d" || datePresetParam === "custom"
        ? datePresetParam
        : "all"

    const page = parsePositiveInt(searchParams.get("page"), 1)
    const pageSize = Math.min(100, Math.max(1, parsePositiveInt(searchParams.get("pageSize"), 20)))

    const databaseConfigured = isDatabaseConfigured()
    if (!databaseConfigured && !isFileFallbackEnabled()) {
      return NextResponse.json(
        { error: "Database is required in production" },
        { status: 503 }
      )
    }

    const ops = databaseConfigured ? dbOps : { listPosts, createPost }

    const posts = await ops.listPosts(locale, type)

    const mapped = posts.map((post) => {
      const createdAt = post.data.createdAt || post.data.date || null
      const publishedAt =
        post.data.publishedAt !== undefined
          ? post.data.publishedAt
          : (normalizeStatus(post) === "published" ? (post.data.date || null) : null)

      return {
        id: post.id,
        postId: post.postId || null,
        slug: post.slug,
        title: post.data.title,
        author: post.data.author,
        type: post.data.type,
        locale: post.data.locale,
        summary: post.data.summary,
        date: post.data.date || new Date().toISOString(),
        createdAt,
        updatedAt: post.data.updated || null,
        publishedAt,
        status: normalizeStatus(post),
        published: normalizeStatus(post) === "published",
        tags: post.data.tags || [],
        coverImage: post.data.coverImage,
        heroVideo: post.data.heroVideo,
        translation_key: post.data.translation_key,
      }
    })

    const groupCounts = new Map<string, { total: number; drafts: number }>()
    for (const post of mapped) {
      const key = post.postId || `${post.type}:${post.translation_key || post.slug}`
      const current = groupCounts.get(key) || { total: 0, drafts: 0 }
      current.total += 1
      if (post.status === "draft") {
        current.drafts += 1
      }
      groupCounts.set(key, current)
    }

    let filtered = mapped.map((post) => {
      const key = post.postId || `${post.type}:${post.translation_key || post.slug}`
      const counts = groupCounts.get(key) || { total: 1, drafts: post.status === "draft" ? 1 : 0 }
      return {
        ...post,
        localeCount: counts.total,
        draftLocaleCount: counts.drafts,
      }
    })

    if (statusFilter) {
      filtered = filtered.filter((post) => post.status === statusFilter)
    }

    if (q) {
      filtered = filtered.filter((post) => {
        const title = post.title.toLowerCase()
        const slug = post.slug.toLowerCase()
        return title.includes(q) || slug.includes(q)
      })
    }

    const window = resolveDateWindow(datePreset, startDate, endDate)
    if (window.start || window.end) {
      filtered = filtered.filter((post) => {
        const dateValue = resolveDateValue(post, dateField)
        if (!dateValue) {
          return false
        }
        if (window.start && dateValue < window.start) {
          return false
        }
        if (window.end && dateValue > window.end) {
          return false
        }
        return true
      })
    }

    filtered.sort((a, b) => resolvePrimarySortTimestamp(b) - resolvePrimarySortTimestamp(a))

    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const normalizedPage = Math.min(Math.max(page, 1), totalPages)
    const startIndex = (normalizedPage - 1) * pageSize
    const items = filtered.slice(startIndex, startIndex + pageSize)

    return NextResponse.json({
      items,
      total,
      page: normalizedPage,
      pageSize,
      totalPages,
      filters: {
        locale: locale || "all",
        type: type || "all",
        status: statusFilter || "all",
        dateField,
        datePreset,
        startDate: startDate || null,
        endDate: endDate || null,
        q,
      },
      sort: "publishedAt_desc_createdAt_desc",
    })
  } catch (error) {
    console.error("Error listing posts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/admin/posts - Create new post
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    
    // Validate data
    const validatedData = createPostSchema.parse(body)
    const sourceLocale = validatedData.locale
    const filteredTargetLocales = (validatedData.targetLocales || [])
      .filter((locale) => locale !== sourceLocale)
      .filter((locale, index, array) => array.indexOf(locale) === index)

    const normalizedPayload: PostData = {
      ...validatedData,
      targetLocales: filteredTargetLocales,
      translationMode: "translate-only",
    }

    // Create post
    const databaseConfigured = isDatabaseConfigured()
    if (!databaseConfigured && !isFileFallbackEnabled()) {
      return NextResponse.json(
        { error: "Database is required in production" },
        { status: 503 }
      )
    }

    const result = databaseConfigured
      ? await dbOps.createPost(normalizedPayload)
      : await createPost({
          ...normalizedPayload,
          targetLocales: [],
          translationMode: undefined,
        } as PostData)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create post" },
        { status: 400 }
      )
    }

    let newsletterCampaign: {
      attempted: boolean
      success: boolean
      campaignId?: number
      status?: "scheduled" | "sent"
      error?: string
    } = {
      attempted: false,
      success: false,
    }

    if (validatedData.published && validatedData.sendNewsletter) {
      newsletterCampaign.attempted = true
      const campaignResult = await createCampaignFromPublishedPost({
        title: validatedData.title,
        summary: validatedData.summary,
        locale: validatedData.locale,
        type: validatedData.type,
        slug: result.slug,
        author: validatedData.author,
        coverImage: validatedData.coverImage,
        subject: validatedData.newsletterSubject,
        previewText: validatedData.newsletterPreviewText,
        scheduleAt: validatedData.newsletterScheduleAt,
      })

      newsletterCampaign = {
        attempted: true,
        success: campaignResult.success,
        campaignId: campaignResult.campaignId,
        status: campaignResult.status,
        error: campaignResult.error,
      }

      if (!campaignResult.success) {
        console.error("Failed creating newsletter campaign from post publish:", campaignResult.error)
      }
    }

    // Regenerate contentlayer only when filesystem mode is active
    if (!databaseConfigured) {
      try {
        const { exec } = await import("child_process")
        const { promisify } = await import("util")
        const execAsync = promisify(exec)

        await execAsync("npx contentlayer2 build", { cwd: resolveWebAppDir() })
        console.log("Contentlayer regenerated after post creation")
      } catch (regenerateError) {
        console.warn("Failed to regenerate contentlayer:", regenerateError)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Post created successfully",
      slug: result.slug,
      filePath: result.filePath,
      generatedLocales: result.generatedLocales || [],
      skippedLocales: result.skippedLocales || [],
      failedLocales: result.failedLocales || [],
      supportedLocales: SUPPORTED_LOCALES,
      newsletterCampaign,
    })
  } catch (error) {
    console.error("Error creating post:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
