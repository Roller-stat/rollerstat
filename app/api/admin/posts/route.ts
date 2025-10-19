import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createPost, listPosts, PostData } from "@/lib/file-operations"
import { z } from "zod"

// Validation schema for post creation
const createPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  summary: z.string().min(1, "Summary is required"),
  type: z.enum(["news", "blog"]),
  locale: z.enum(["en", "es", "fr", "it", "pt"]),
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

    // List posts
    const posts = await listPosts(
      locale || undefined,
      type || undefined
    )

    return NextResponse.json(posts.map(post => ({
      id: post.id,
      slug: post.slug,
      title: post.data.title,
      author: post.data.author,
      type: post.data.type,
      locale: post.data.locale,
      summary: post.data.summary,
      date: new Date().toISOString().split("T")[0], // This would come from frontmatter in real implementation
      published: post.data.published,
      tags: post.data.tags,
      coverImage: post.data.coverImage,
      heroVideo: post.data.heroVideo,
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
    
    // Create post
    const result = await createPost(validatedData as PostData)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create post" },
        { status: 400 }
      )
    }

    // Regenerate contentlayer data to make the new post visible
    try {
      const { exec } = await import("child_process")
      const { promisify } = await import("util")
      const execAsync = promisify(exec)
      
      await execAsync("npx contentlayer2 build")
      console.log("Contentlayer regenerated after post creation")
    } catch (regenerateError) {
      console.warn("Failed to regenerate contentlayer:", regenerateError)
      // Don't fail the request if regeneration fails
    }

    return NextResponse.json({
      success: true,
      message: "Post created successfully",
      slug: result.slug,
      filePath: result.filePath,
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
