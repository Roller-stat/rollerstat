"use client"

import { useCallback, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/auth/auth-guard"
import { PostList } from "@/components/admin/post-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search } from "lucide-react"

type PostType = "news" | "blog"
type PostStatus = "draft" | "published" | "archived"
type Locale = "en" | "es" | "fr" | "it" | "pt"
type DateField = "publishedAt" | "createdAt" | "updatedAt"
type DatePreset = "all" | "today" | "7d" | "30d" | "custom"

type TypeFilter = "all" | PostType
type LocaleFilter = "all" | Locale
type StatusFilter = "all" | PostStatus

interface Post {
  id: string
  postId?: string | null
  slug: string
  title: string
  author: string
  type: PostType
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

interface PostsResponse {
  items: Post[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return parsed
}

function parseTypeFilter(value: string | null): TypeFilter {
  return value === "news" || value === "blog" ? value : "all"
}

function parseLocaleFilter(value: string | null): LocaleFilter {
  return value === "en" || value === "es" || value === "fr" || value === "it" || value === "pt" ? value : "all"
}

function parseStatusFilter(value: string | null): StatusFilter {
  return value === "draft" || value === "published" || value === "archived" ? value : "all"
}

function parseDateField(value: string | null): DateField {
  return value === "createdAt" || value === "updatedAt" || value === "publishedAt" ? value : "publishedAt"
}

function parseDatePreset(value: string | null): DatePreset {
  return value === "today" || value === "7d" || value === "30d" || value === "custom" ? value : "all"
}

export default function PostsPage() {
  const { status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [localeFilter, setLocaleFilter] = useState<LocaleFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [dateField, setDateField] = useState<DateField>("publishedAt")
  const [datePreset, setDatePreset] = useState<DatePreset>("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sort, setSort] = useState("newest")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [initializedFromUrl, setInitializedFromUrl] = useState(false)

  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setSearchTerm(params.get("q") || "")
    setTypeFilter(parseTypeFilter(params.get("type")))
    setLocaleFilter(parseLocaleFilter(params.get("locale")))
    setStatusFilter(parseStatusFilter(params.get("status")))
    setDateField(parseDateField(params.get("dateField")))
    setDatePreset(parseDatePreset(params.get("datePreset")))
    setStartDate(params.get("startDate") || "")
    setEndDate(params.get("endDate") || "")
    setSort(params.get("sort") || "newest")
    setPage(parsePositiveInt(params.get("page"), 1))

    const initialPageSize = parsePositiveInt(params.get("pageSize"), 20)
    setPageSize([10, 20, 50].includes(initialPageSize) ? initialPageSize : 20)
    setInitializedFromUrl(true)
  }, [])

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (searchTerm.trim()) params.set("q", searchTerm.trim())
      if (typeFilter !== "all") params.set("type", typeFilter)
      if (localeFilter !== "all") params.set("locale", localeFilter)
      if (statusFilter !== "all") params.set("status", statusFilter)
      params.set("dateField", dateField)
      params.set("datePreset", datePreset)
      if (datePreset === "custom") {
        if (startDate) params.set("startDate", startDate)
        if (endDate) params.set("endDate", endDate)
      }
      params.set("sort", sort)
      params.set("page", String(page))
      params.set("pageSize", String(pageSize))

      const response = await fetch(`/api/admin/posts?${params.toString()}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch posts")
      }

      const data = (await response.json()) as PostsResponse
      setPosts(Array.isArray(data.items) ? data.items : [])
      setTotal(typeof data.total === "number" ? data.total : 0)
      setTotalPages(typeof data.totalPages === "number" && data.totalPages > 0 ? data.totalPages : 1)

      if (typeof data.page === "number" && data.page > 0 && data.page !== page) {
        setPage(data.page)
      }
      if (typeof data.pageSize === "number" && data.pageSize > 0 && data.pageSize !== pageSize) {
        setPageSize(data.pageSize)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      setPosts([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, typeFilter, localeFilter, statusFilter, dateField, datePreset, startDate, endDate, sort, page, pageSize])

  useEffect(() => {
    if (!initializedFromUrl) {
      return
    }

    if (status === "authenticated") {
      void fetchPosts()
      return
    }

    if (status === "unauthenticated") {
      setLoading(false)
    }
  }, [status, fetchPosts, initializedFromUrl])

  useEffect(() => {
    if (status !== "authenticated" || !initializedFromUrl) {
      return
    }

    const params = new URLSearchParams()
    if (searchTerm.trim()) params.set("q", searchTerm.trim())
    if (typeFilter !== "all") params.set("type", typeFilter)
    if (localeFilter !== "all") params.set("locale", localeFilter)
    if (statusFilter !== "all") params.set("status", statusFilter)
    params.set("dateField", dateField)
    params.set("datePreset", datePreset)
    if (datePreset === "custom") {
      if (startDate) params.set("startDate", startDate)
      if (endDate) params.set("endDate", endDate)
    }
    params.set("sort", sort)
    params.set("page", String(page))
    params.set("pageSize", String(pageSize))

    const nextQuery = params.toString()
    const currentQuery = window.location.search.replace(/^\?/, "")

    if (nextQuery !== currentQuery) {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false })
    }
  }, [
    status,
    searchTerm,
    typeFilter,
    localeFilter,
    statusFilter,
    dateField,
    datePreset,
    startDate,
    endDate,
    sort,
    page,
    pageSize,
    initializedFromUrl,
    router,
    pathname,
  ])

  const handleEditPost = (post: Post) => {
    router.push(`/admin/posts/${post.locale}/${post.type}/${post.slug}`)
  }

  const handlePostUpdated = async () => {
    await fetchPosts()
  }

  const breadcrumbs = [{ label: "Posts" }]

  return (
    <AuthGuard>
      <AdminLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Posts</h1>
              <p className="mt-2 text-muted-foreground">Manage your news and blog posts</p>
            </div>
            <Button asChild className="mt-4 sm:mt-0">
              <Link href="/admin/posts/new">
                <Plus className="mr-2 h-4 w-4" />
                New Post
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Filter by date range, date field, type, status, locale, and search.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <div className="relative md:col-span-2 xl:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search title or slug"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10"
                />
              </div>

              <Select
                value={datePreset}
                onValueChange={(value: DatePreset) => {
                  setDatePreset(value)
                  if (value !== "custom") {
                    setStartDate("")
                    setEndDate("")
                  }
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={dateField}
                onValueChange={(value: DateField) => {
                  setDateField(value)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Date field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="publishedAt">Published date</SelectItem>
                  <SelectItem value="createdAt">Created date</SelectItem>
                  <SelectItem value="updatedAt">Updated date</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={typeFilter}
                onValueChange={(value: TypeFilter) => {
                  setTypeFilter(value)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="blog">Blog</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value: StatusFilter) => {
                  setStatusFilter(value)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={localeFilter}
                onValueChange={(value: LocaleFilter) => {
                  setLocaleFilter(value)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Locale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locales</SelectItem>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="es">ES</SelectItem>
                  <SelectItem value="fr">FR</SelectItem>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="pt">PT</SelectItem>
                </SelectContent>
              </Select>

              {datePreset === "custom" ? (
                <>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      setPage(1)
                    }}
                    className="w-full"
                    aria-label="Start date"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value)
                      setPage(1)
                    }}
                    className="w-full"
                    aria-label="End date"
                  />
                </>
              ) : null}
            </CardContent>
          </Card>

          <PostList
            posts={posts}
            loading={loading}
            total={total}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            onPageChange={(nextPage) => setPage(nextPage)}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize)
              setPage(1)
            }}
            onPostUpdate={handlePostUpdated}
            onEdit={handleEditPost}
          />
        </div>
      </AdminLayout>
    </AuthGuard>
  )
}
