"use client"

import { useState, useEffect, use, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { PostForm } from "@/components/admin/post-form"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface EditPostPageProps {
  params: Promise<{
    locale: string
    type: string
    slug: string
  }>
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [post, setPost] = useState<{
    id: string
    slug: string
    title: string
    author: string
    type: "news" | "blog"
    locale: "en" | "es" | "fr" | "it" | "pt"
    summary: string
    date: string
    published: boolean
    tags: string[]
    coverImage?: string
    heroVideo?: string
    content: string
    translation_key?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/posts/${resolvedParams.locale}/${resolvedParams.type}/${resolvedParams.slug}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Post not found")
          router.push("/admin/posts")
          return
        }
        throw new Error("Failed to fetch post")
      }

      const data = await response.json()
      setPost(data)
    } catch (error: unknown) {
      console.error("Error fetching post:", error)
      toast.error(error instanceof Error ? error.message : "Failed to fetch post")
      router.push("/admin/posts")
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.locale, resolvedParams.type, resolvedParams.slug, router])

  useEffect(() => {
    fetchPost()
  }, [fetchPost])

  const handleSubmit = async (data: {
    title: string
    author: string
    summary: string
    type: "news" | "blog"
    locale: "en" | "es" | "fr" | "it" | "pt"
    coverImage?: string
    heroVideo?: string
    featured: boolean
    published: boolean
    tags: string[]
    content: string
  }) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/posts/${resolvedParams.locale}/${resolvedParams.type}/${resolvedParams.slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update post")
      }

      toast.success("Post updated successfully!")
      router.push("/admin/posts")
    } catch (error: unknown) {
      console.error("Error updating post:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update post")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = async (data: {
    title: string
    author: string
    summary: string
    type: "news" | "blog"
    locale: "en" | "es" | "fr" | "it" | "pt"
    coverImage?: string
    heroVideo?: string
    featured: boolean
    published: boolean
    tags: string[]
    content: string
  }) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/posts/${resolvedParams.locale}/${resolvedParams.type}/${resolvedParams.slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save draft")
      }

      toast.success("Draft saved successfully!")
      router.push("/admin/posts")
    } catch (error: unknown) {
      console.error("Error saving draft:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save draft")
    } finally {
      setIsSubmitting(false)
    }
  }

  const breadcrumbs = [
    { label: "Posts", href: "/admin/posts" },
    { label: `${resolvedParams.type}`, href: `/admin/posts?type=${resolvedParams.type}` },
    { label: resolvedParams.slug }
  ]

  if (loading) {
    return (
      <AdminLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/posts">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Posts
              </Link>
            </Button>
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48 mt-2" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!post) {
    return (
      <AdminLayout breadcrumbs={breadcrumbs}>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h2>
          <p className="text-gray-600 mb-6">The post you are looking for does not exist.</p>
          <Button asChild>
            <Link href="/admin/posts">Back to Posts</Link>
          </Button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/posts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Posts
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Post</h1>
            <p className="text-gray-600 mt-2">
              Update your {resolvedParams.type} post
            </p>
          </div>
        </div>

        {/* Post Form */}
        <PostForm 
          initialData={post}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          isSubmitting={isSubmitting}
          submitButtonText="Create Post"
        />
      </div>
    </AdminLayout>
  )
}
