"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { PostForm } from "@/components/admin/post-form"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface EditPostPageProps {
  params: {
    locale: string
    type: string
    slug: string
  }
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const router = useRouter()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchPost()
  }, [params.locale, params.type, params.slug])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/posts/${params.locale}/${params.type}/${params.slug}`)
      
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
    } catch (error: any) {
      console.error("Error fetching post:", error)
      toast.error(error.message || "Failed to fetch post")
      router.push("/admin/posts")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/posts/${params.locale}/${params.type}/${params.slug}`, {
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
    } catch (error: any) {
      console.error("Error updating post:", error)
      toast.error(error.message || "Failed to update post")
    } finally {
      setIsSubmitting(false)
    }
  }

  const breadcrumbs = [
    { label: "Posts", href: "/admin/posts" },
    { label: `${params.type}`, href: `/admin/posts?type=${params.type}` },
    { label: params.slug }
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
          <p className="text-gray-600 mb-6">The post you're looking for doesn't exist.</p>
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
              Update your {params.type} post
            </p>
          </div>
        </div>

        {/* Post Form */}
        <PostForm 
          initialData={post}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Update Post"
        />
      </div>
    </AdminLayout>
  )
}
