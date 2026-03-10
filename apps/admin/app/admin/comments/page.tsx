"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

type CommentStatus = "visible" | "hidden" | "deleted";
type PostType = "news" | "blog";
type Locale = "en" | "es" | "fr" | "it" | "pt";

interface AdminComment {
  id: string;
  body: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userName: string;
  userEmail: string | null;
  postLocalizationId: string;
  locale: string | null;
  slug: string | null;
  postTitle: string | null;
  type: PostType | null;
}

interface PostFilterOption {
  id: string;
  locale: Locale;
  slug: string;
  title: string;
  type: PostType;
}

interface AdminCommentsResponse {
  items: AdminComment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters?: {
    posts?: PostFilterOption[];
  };
}

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  it: "Italian",
  pt: "Portuguese",
};

function getWebBaseUrl(): string {
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${protocol}//${hostname}:3000`;
    }

    if (hostname.startsWith("admin.")) {
      return `${protocol}//${hostname.slice("admin.".length)}`;
    }
  }

  const configured =
    process.env.NEXT_PUBLIC_WEB_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return "https://rollerstat.com";
}

export default function AdminCommentsPage() {
  const { status } = useSession();
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [postOptions, setPostOptions] = useState<PostFilterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | CommentStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | PostType>("all");
  const [localeFilter, setLocaleFilter] = useState<"all" | Locale>("all");
  const [postFilter, setPostFilter] = useState<"all" | string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [webBaseUrl, setWebBaseUrl] = useState("http://localhost:3000");

  useEffect(() => {
    setWebBaseUrl(getWebBaseUrl());
  }, []);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (typeFilter !== "all") {
        params.set("type", typeFilter);
      }
      if (localeFilter !== "all") {
        params.set("locale", localeFilter);
      }
      if (postFilter !== "all") {
        params.set("postLocalizationId", postFilter);
      }
      if (search.trim()) {
        params.set("q", search.trim());
      }
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const query = params.toString() ? `?${params.toString()}` : "";
      const response = await fetch(`/api/admin/comments${query}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      const data = (await response.json()) as AdminCommentsResponse | AdminComment[];

      // Fallback for legacy array responses.
      if (Array.isArray(data)) {
        setComments(data);
        setPostOptions([]);
        setTotal(data.length);
        setTotalPages(1);
        return;
      }

      const nextItems = Array.isArray(data.items) ? data.items : [];
      const nextPostOptions = Array.isArray(data.filters?.posts) ? data.filters?.posts : [];
      const nextTotal = typeof data.total === "number" ? data.total : nextItems.length;
      const nextTotalPages =
        typeof data.totalPages === "number" && data.totalPages > 0 ? data.totalPages : 1;
      const nextPage = typeof data.page === "number" && data.page > 0 ? data.page : 1;

      setComments(nextItems);
      setPostOptions(nextPostOptions || []);
      setTotal(nextTotal);
      setTotalPages(nextTotalPages);

      if (nextPage !== page) {
        setPage(nextPage);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
      setComments([]);
      setTotal(0);
      setTotalPages(1);
      setPostOptions([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, localeFilter, postFilter, search, page, pageSize]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchComments().catch(() => {
        setLoading(false);
      });
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchComments]);

  useEffect(() => {
    if (postFilter === "all") {
      return;
    }

    if (!postOptions.some((post) => post.id === postFilter)) {
      setPostFilter("all");
      setPage(1);
    }
  }, [postOptions, postFilter]);

  async function updateCommentStatus(id: string, nextStatus: CommentStatus) {
    try {
      setPendingId(id);
      const response = await fetch(`/api/admin/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to update comment");
      }

      toast.success("Comment updated");
      await fetchComments();
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update comment");
    } finally {
      setPendingId(null);
    }
  }

  function statusVariant(statusValue: CommentStatus): "default" | "outline" | "destructive" | "secondary" {
    if (statusValue === "visible") {
      return "default";
    }
    if (statusValue === "hidden") {
      return "secondary";
    }
    return "outline";
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const breadcrumbs = [{ label: "Comments" }];

  return (
    <AuthGuard>
      <AdminLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Comments</h1>
              <p className="mt-2 text-muted-foreground">Moderate public discussion across posts</p>
            </div>

            <Button variant="outline" onClick={() => fetchComments()} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter comments by post type, locale, post, status, and search text</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search comment, user, post"
                className="md:col-span-2 xl:col-span-2"
              />

              <Select
                value={typeFilter}
                onValueChange={(value: "all" | PostType) => {
                  setTypeFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="blog">Blogs</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={localeFilter}
                onValueChange={(value: "all" | Locale) => {
                  setLocaleFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Locale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locales</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value: "all" | CommentStatus) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="visible">Visible</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={postFilter}
                onValueChange={(value) => {
                  setPostFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full md:col-span-2 xl:col-span-2">
                  <SelectValue placeholder="Post" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All posts</SelectItem>
                  {postOptions.map((post) => {
                    const localeLabel = LOCALE_LABELS[post.locale] || post.locale.toUpperCase();
                    const typeLabel = post.type === "news" ? "News" : "Blog";
                    return (
                      <SelectItem key={post.id} value={post.id}>
                        {`${post.title} (${typeLabel} • ${localeLabel})`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comments ({total})</CardTitle>
              <CardDescription>Newest comments first</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Post</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!loading && comments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                          No comments found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      comments.map((comment) => {
                        const postPath =
                          comment.locale && comment.slug && comment.type
                            ? `/${comment.locale}/${comment.type === "news" ? "news" : "blogs"}/${comment.slug}`
                            : null;
                        const postUrl = postPath ? `${webBaseUrl}${postPath}` : null;

                        const busy = pendingId === comment.id;

                        return (
                          <TableRow key={comment.id}>
                            <TableCell>
                              <div className="font-medium">{comment.userName}</div>
                              <div className="text-xs text-muted-foreground">{comment.userEmail || "No email"}</div>
                            </TableCell>
                            <TableCell>
                              {postUrl ? (
                                <a
                                  href={postUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline"
                                >
                                  {comment.postTitle || "Open post"}
                                </a>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  {comment.postTitle || "Unknown post"}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-md">
                              <p className="line-clamp-2 text-sm">{comment.body}</p>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusVariant(comment.status)}>{comment.status}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={busy || comment.status === "visible"}
                                  onClick={() => updateCommentStatus(comment.id, "visible")}
                                >
                                  Show
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={busy || comment.status === "hidden"}
                                  onClick={() => updateCommentStatus(comment.id, "hidden")}
                                >
                                  Hide
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={busy || comment.status === "deleted"}
                                  onClick={() => updateCommentStatus(comment.id, "deleted")}
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {rangeStart}-{rangeEnd} of {total} comments
                </p>

                <div className="flex items-center gap-2">
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Page size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 / page</SelectItem>
                      <SelectItem value="25">25 / page</SelectItem>
                      <SelectItem value="50">50 / page</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loading || page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
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
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
