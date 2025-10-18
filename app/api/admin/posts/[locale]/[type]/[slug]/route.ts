import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { updatePost, deletePost, PostData } from "@/lib/file-operations"
import { z } from "zod"

// Validation schema for post updates
const updatePostSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  author: z.string().min(1, "Author is required").optional(),
  summary: z.string().min(1, "Summary is required").optional(),
  type: z.enum(["news", "blog"]).optional(),
  locale: z.enum(["en", "es", "fr", "de", "it"]).optional(),
  coverImage: z.string().optional(),
  heroVideo: z.string().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  content: z.string().min(1, "Content is required").optional(),
  translation_key: z.string().optional(),
})

// PUT /api/admin/posts/[locale]/[type]/[slug] - Update post
export async function PUT(
  request: NextRequest,
  { params }: { params: { locale: string; type: string; slug: string } }
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
    const { locale, type, slug } = params
    
    if (!["en", "es", "fr", "de", "it"].includes(locale)) {
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
  { params }: { params: { locale: string; type: string; slug: string } }
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
    const { locale, type, slug } = params
    
    if (!["en", "es", "fr", "de", "it"].includes(locale)) {
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
