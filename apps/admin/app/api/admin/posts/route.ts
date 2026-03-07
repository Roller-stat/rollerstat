import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createPost, listPosts, PostData } from "@/lib/file-operations"
import * as dbOps from "@/lib/db-operations"
import { isDatabaseConfigured } from "@/lib/db/client"
import { z } from "zod"
import fs from "node:fs"
import path from "node:path"
import { SUPPORTED_LOCALES } from "@/lib/gemini-translate"

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
    const locale = searchParams.get("locale")
    const type = searchParams.get("type") as "news" | "blog" | null

    const ops = isDatabaseConfigured() ? dbOps : { listPosts, createPost }

    // List posts
    const posts = await ops.listPosts(
      locale || undefined,
      type || undefined
    )

    return NextResponse.json(posts.map(post => ({
      id: post.id,
      postId: post.postId || null,
      slug: post.slug,
      title: post.data.title,
      author: post.data.author,
      type: post.data.type,
      locale: post.data.locale,
      summary: post.data.summary,
      date: post.data.date || new Date().toISOString().split("T")[0],
      published: post.data.published,
      tags: post.data.tags,
      coverImage: post.data.coverImage,
      heroVideo: post.data.heroVideo,
      translation_key: post.data.translation_key,
    })))
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
    const result = isDatabaseConfigured()
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

    // Regenerate contentlayer only when filesystem mode is active
    if (!isDatabaseConfigured()) {
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
