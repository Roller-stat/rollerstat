import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { updatePost, deletePost, PostData, listPosts } from "@/lib/file-operations"
import * as dbOps from "@/lib/db-operations"
import { getSupabaseServerClient, isDatabaseConfigured } from "@/lib/db/client"
import { SUPPORTED_LOCALES } from "@/lib/gemini-translate"
import { z } from "zod"
import fs from "node:fs"
import path from "node:path"

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

// Validation schema for post updates
const updatePostSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  author: z.string().min(1, "Author is required").optional(),
  summary: z.string().min(1, "Summary is required").optional(),
  type: z.enum(["news", "blog"]).optional(),
  locale: z.enum(["en", "es", "fr", "it", "pt"]).optional(),
  targetLocales: z.array(z.enum(["en", "es", "fr", "it", "pt"])).optional(),
  translationMode: z.enum(["translate-only"]).optional(),
  coverImage: z.string().optional(),
  heroVideo: z.string().optional(),
  published: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  content: z.string().min(1, "Content is required").optional(),
  translation_key: z.string().optional(),
})

// GET /api/admin/posts/[locale]/[type]/[slug] - Get single post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string; type: string; slug: string }> }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Validate route parameters
    const { locale, type, slug } = await params
    console.log("API GET request params:", { locale, type, slug })
    
    if (!["en", "es", "fr", "it", "pt"].includes(locale)) {
      return NextResponse.json(
        { error: "Invalid locale" },
        { status: 400 }
      )
    }
    
    if (!["news", "blog"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      )
    }

    const ops = isDatabaseConfigured() ? dbOps : { updatePost, deletePost, listPosts }

    // Get posts for the specific locale and type
    const posts = await ops.listPosts(locale, type as "news" | "blog")
    console.log("Found posts:", posts.map(p => ({ slug: p.slug, id: p.id })))
    
    // Find the specific post by slug
    const post = posts.find(p => p.slug === slug)
    console.log("Looking for slug:", slug, "Found post:", post ? "YES" : "NO")
    
    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

    const responsePayload: {
      id: string
      postId?: string | null
      slug: string
      title: string
      author: string
      type: string
      locale: string
      summary: string
      date: string
      published: boolean
      tags: string[] | undefined
      coverImage: string | undefined
      heroVideo: string | undefined
      content: string | undefined
      translation_key: string | undefined
      existingLocales?: string[]
      missingLocales?: string[]
      supportedLocales?: readonly string[]
    } = {
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
      content: post.data.content,
      translation_key: post.data.translation_key,
    }

    if (isDatabaseConfigured() && post.postId) {
      const client = getSupabaseServerClient()
      if (client) {
        const { data: localesRows } = await client
          .from("post_localizations")
          .select("locale")
          .eq("post_id", post.postId)

        const existingLocales = [...new Set((localesRows || []).map((row) => row.locale))]
        const missingLocales = SUPPORTED_LOCALES.filter(
          (supportedLocale) => !existingLocales.includes(supportedLocale)
        )

        responsePayload.existingLocales = existingLocales
        responsePayload.missingLocales = missingLocales
        responsePayload.supportedLocales = SUPPORTED_LOCALES
      }
    }

    return NextResponse.json(responsePayload)
  } catch (error) {
    console.error("Error fetching post:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/posts/[locale]/[type]/[slug] - Update post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string; type: string; slug: string }> }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Validate route parameters
    const { locale, type, slug } = await params
    
    if (!["en", "es", "fr", "it", "pt"].includes(locale)) {
      return NextResponse.json(
        { error: "Invalid locale" },
        { status: 400 }
      )
    }
    
    if (!["news", "blog"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    
    // Validate data
    const validatedData = updatePostSchema.parse(body)
    
    const ops = isDatabaseConfigured() ? dbOps : { updatePost, deletePost, listPosts }

    // Update post
    const result = await ops.updatePost(locale, type as "news" | "blog", slug, validatedData as Partial<PostData>)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update post" },
        { status: 400 }
      )
    }

    if (!isDatabaseConfigured()) {
      try {
        const { exec } = await import("child_process")
        const { promisify } = await import("util")
        const execAsync = promisify(exec)

        await execAsync("npx contentlayer2 build", { cwd: resolveWebAppDir() })
        console.log("Contentlayer regenerated after post update")
      } catch (regenerateError) {
        console.warn("Failed to regenerate contentlayer:", regenerateError)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Post updated successfully",
    })
  } catch (error) {
    console.error("Error updating post:", error)
    
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

// DELETE /api/admin/posts/[locale]/[type]/[slug] - Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string; type: string; slug: string }> }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Validate route parameters
    const { locale, type, slug } = await params
    
    if (!["en", "es", "fr", "it", "pt"].includes(locale)) {
      return NextResponse.json(
        { error: "Invalid locale" },
        { status: 400 }
      )
    }
    
    if (!["news", "blog"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      )
    }

    const ops = isDatabaseConfigured() ? dbOps : { updatePost, deletePost, listPosts }

    // Delete post
    const result = await ops.deletePost(locale, type as "news" | "blog", slug)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete post" },
        { status: 400 }
      )
    }

    if (!isDatabaseConfigured()) {
      try {
        const { exec } = await import("child_process")
        const { promisify } = await import("util")
        const execAsync = promisify(exec)

        await execAsync("npx contentlayer2 build", { cwd: resolveWebAppDir() })
        console.log("Contentlayer regenerated after post deletion")
      } catch (regenerateError) {
        console.warn("Failed to regenerate contentlayer:", regenerateError)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting post:", error)
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
