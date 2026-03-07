"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/auth/auth-guard"
import { PostForm } from "@/components/admin/post-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

type PostFormSubmitData = {
  title: string
  author: string
  summary: string
  type: "news" | "blog"
  locale: "en" | "es" | "fr" | "it" | "pt"
  targetLocales: ("en" | "es" | "fr" | "it" | "pt")[]
  translationMode: "translate-only"
  coverImage?: string
  heroVideo?: string
  featured: boolean
  published: boolean
  sendNewsletter?: boolean
  newsletterSubject?: string
  newsletterPreviewText?: string
  newsletterScheduleAt?: string
  tags: string[]
  content: string
}

export default function NewPostPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: PostFormSubmitData) => {
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

      const payload = await response.json()
      const generatedLocales = Array.isArray(payload.generatedLocales) ? payload.generatedLocales : []
      const failedLocales = Array.isArray(payload.failedLocales) ? payload.failedLocales : []
      const newsletterCampaign = payload.newsletterCampaign as
        | {
            attempted?: boolean
            success?: boolean
            status?: "scheduled" | "sent"
            error?: string
          }
        | undefined

      if (generatedLocales.length > 0) {
        toast.success(`Post created. Draft locales generated: ${generatedLocales.join(", ").toUpperCase()}`)
      } else {
        toast.success("Post created successfully!")
      }

      if (failedLocales.length > 0) {
        toast.warning(`Some locales failed: ${failedLocales.map((item: { locale: string }) => item.locale).join(", ").toUpperCase()}`)
      }

      if (newsletterCampaign?.attempted) {
        if (newsletterCampaign.success) {
          toast.success(
            newsletterCampaign.status === "scheduled"
              ? "Newsletter campaign scheduled"
              : "Newsletter campaign sent",
          )
        } else {
          toast.warning(`Post published but campaign failed: ${newsletterCampaign.error || "Unknown error"}`)
        }
      }

      router.push("/admin/posts")
    } catch (error: unknown) {
      console.error("Error creating post:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create post")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = async (data: PostFormSubmitData) => {
    setIsSubmitting(true)
    try {
      // Ensure it's saved as a draft
      const draftData = { ...data, published: false }
      
      const response = await fetch("/api/admin/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draftData),
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
    { label: "New Post" }
  ]

  return (
    <AuthGuard>
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
              <h1 className="text-3xl font-bold text-foreground">Create New Post</h1>
              <p className="text-muted-foreground mt-2">
                Add a new news article or blog post
              </p>
            </div>
          </div>

          {/* Post Form */}
          <PostForm 
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
            isSubmitting={isSubmitting}
            submitButtonText="Create Post"
          />
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
