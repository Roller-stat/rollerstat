"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Edit, Eye, Calendar, User, Globe, FileText, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

type PostStatus = "draft" | "published" | "archived"
type DeleteScope = "locale" | "all-draft-locales"

interface Post {
  id: string
  postId?: string | null
  slug: string
  title: string
  author: string
  type: "news" | "blog"
  locale: string
  summary: string
  date: string
  createdAt?: string | null
  updatedAt?: string | null
  publishedAt?: string | null
  status: PostStatus
  published: boolean
  tags: string[]
  localeCount: number
  draftLocaleCount: number
}

interface PostListProps {
  posts: Post[]
  loading?: boolean
  total: number
  page: number
  pageSize: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onPostUpdate?: () => Promise<void> | void
  onEdit?: (post: Post) => void
  onView?: (post: Post) => void
}

export function PostList({
  posts,
  loading = false,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onPostUpdate,
  onEdit,
  onView,
}: PostListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<Post | null>(null)
  const [deletingScope, setDeletingScope] = useState<DeleteScope | null>(null)

  const handleDeleteClick = (post: Post) => {
    if (post.status !== "draft") {
      return
    }
    setPostToDelete(post)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async (scope: DeleteScope) => {
    if (!postToDelete || postToDelete.status !== "draft") {
      return
    }

    try {
      setDeletingScope(scope)

      const query = scope === "all-draft-locales" ? "?scope=all-draft-locales" : ""
      const response = await fetch(
        `/api/admin/posts/${postToDelete.locale}/${postToDelete.type}/${postToDelete.slug}${query}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || "Failed to delete post")
      }

      toast.success(
        scope === "all-draft-locales"
          ? "All draft locales deleted successfully"
          : "Draft deleted successfully"
      )

      if (onPostUpdate) {
        await onPostUpdate()
      }

      setDeleteDialogOpen(false)
      setPostToDelete(null)
    } catch (error: unknown) {
      console.error("Error deleting post:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete post")
    } finally {
      setDeletingScope(null)
    }
  }

  const getTypeBadgeVariant = (type: string) => {
    return type === "news" ? "default" : "secondary"
  }

  const getStatusBadgeVariant = (status: PostStatus): "default" | "secondary" | "outline" => {
    if (status === "published") {
      return "default"
    }
    if (status === "archived") {
      return "outline"
    }
    return "secondary"
  }

  const getLocaleFlag = (locale: string) => {
    const flags: Record<string, string> = {
      en: "🇺🇸",
      es: "🇪🇸",
      fr: "🇫🇷",
      it: "🇮🇹",
      pt: "🇵🇹",
    }
    return flags[locale] || "🌐"
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, total)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Posts</CardTitle>
          <CardDescription>Loading posts...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Posts ({total})</CardTitle>
          <CardDescription>No posts found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">No posts found</h3>
            <p className="mb-6 text-muted-foreground">Try adjusting filters or create a new post.</p>
            <Button asChild>
              <Link href="/admin/posts/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Post
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Posts ({total})</CardTitle>
          <CardDescription>Default sort: newest published date (fallback created date)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => {
                  const effectiveDate = post.publishedAt || post.createdAt || post.date

                  return (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {post.author}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadgeVariant(post.type)}>{post.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {getLocaleFlag(post.locale)} {post.locale.toUpperCase()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(post.status)}>
                          {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(effectiveDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {onView ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onView(post)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {onEdit ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEdit(post)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {post.status === "draft" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(post)}
                              aria-label="Delete draft"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {rangeStart}-{rangeEnd} of {total} posts
            </p>

            <div className="flex items-center gap-2">
              <Select
                value={String(pageSize)}
                onValueChange={(value) => onPageSizeChange(Number(value))}
              >
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="20">20 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="sm"
                variant="outline"
                disabled={loading || page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                Previous
              </Button>
              <span className="min-w-24 text-center text-sm text-muted-foreground">
                Page {page} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={loading || page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete draft permanently?</DialogTitle>
            <DialogDescription>
              {postToDelete
                ? `You are deleting \"${postToDelete.title}\" (${postToDelete.locale.toUpperCase()}). This action cannot be undone.`
                : "This action cannot be undone."}
            </DialogDescription>
            {postToDelete && postToDelete.draftLocaleCount > 1 ? (
              <p className="text-sm text-muted-foreground">
                This post has {postToDelete.draftLocaleCount} draft locale version(s). You can delete only this locale draft or all draft locales.
              </p>
            ) : null}
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={Boolean(deletingScope)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteConfirm("locale")}
              disabled={Boolean(deletingScope)}
            >
              Delete This Draft
            </Button>
            {postToDelete && postToDelete.draftLocaleCount > 1 ? (
              <Button
                variant="destructive"
                onClick={() => handleDeleteConfirm("all-draft-locales")}
                disabled={Boolean(deletingScope)}
              >
                Delete All Draft Locales
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
