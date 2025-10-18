"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { PostForm } from "@/components/admin/post-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function NewPostPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create post")
      }

      const result = await response.json()
      toast.success("Post created successfully!")
      router.push("/admin/posts")
    } catch (error: any) {
      console.error("Error creating post:", error)
      toast.error(error.message || "Failed to create post")
    } finally {
      setIsSubmitting(false)
    }
  }

  const breadcrumbs = [
    { label: "Posts", href: "/admin/posts" },
    { label: "New Post" }
  ]

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
            <h1 className="text-3xl font-bold text-gray-900">Create New Post</h1>
            <p className="text-gray-600 mt-2">
              Add a new news article or blog post
            </p>
          </div>
        </div>

        {/* Post Form */}
        <PostForm 
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Create Post"
        />
      </div>
    </AdminLayout>
  )
}
