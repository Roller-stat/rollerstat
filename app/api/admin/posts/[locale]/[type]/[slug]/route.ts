import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { updatePost, deletePost, PostData, listPosts } from "@/lib/file-operations"
import { z } from "zod"

// Validation schema for post updates
const updatePostSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  author: z.string().min(1, "Author is required").optional(),
  summary: z.string().min(1, "Summary is required").optional(),
  type: z.enum(["news", "blog"]).optional(),
  locale: z.enum(["en", "es", "fr", "it", "pt"]).optional(),
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

    // Get posts for the specific locale and type
    const posts = await listPosts(locale, type as "news" | "blog")
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

    return NextResponse.json({
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
      content: post.data.content,
      translation_key: post.data.translation_key,
    })
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
    
    // Update post
    const result = await updatePost(locale, type as "news" | "blog", slug, validatedData as Partial<PostData>)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update post" },
        { status: 400 }
      )
    }

    // Regenerate contentlayer data to reflect the changes
    try {
      const { exec } = await import("child_process")
      const { promisify } = await import("util")
      const execAsync = promisify(exec)
      
      await execAsync("npx contentlayer2 build")
      console.log("Contentlayer regenerated after post update")
    } catch (regenerateError) {
      console.warn("Failed to regenerate contentlayer:", regenerateError)
      // Don't fail the request if regeneration fails
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

    // Delete post
    const result = await deletePost(locale, type as "news" | "blog", slug)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete post" },
        { status: 400 }
      )
    }

    // Regenerate contentlayer data to reflect the deletion
    try {
      const { exec } = await import("child_process")
      const { promisify } = await import("util")
      const execAsync = promisify(exec)
      
      await execAsync("npx contentlayer2 build")
      console.log("Contentlayer regenerated after post deletion")
    } catch (regenerateError) {
      console.warn("Failed to regenerate contentlayer:", regenerateError)
      // Don't fail the request if regeneration fails
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
