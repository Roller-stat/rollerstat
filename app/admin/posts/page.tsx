"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { PostList } from "@/components/admin/post-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Filter } from "lucide-react"
import Link from "next/link"

interface Post {
  id: string
  title: string
  author: string
  type: "news" | "blog"
  locale: string
  summary: string
  date: string
  updated?: string
  featured: boolean
  published: boolean
  tags: string[]
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "news" | "blog">("all")
  const [localeFilter, setLocaleFilter] = useState<"all" | "en" | "es" | "fr" | "de" | "it">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all")

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/posts")
      if (!response.ok) {
        throw new Error("Failed to fetch posts")
      }
      const data = await response.json()
      // Ensure we have an array of posts
      setPosts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.summary.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === "all" || post.type === typeFilter
    const matchesLocale = localeFilter === "all" || post.locale === localeFilter
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "published" && post.published) ||
                         (statusFilter === "draft" && !post.published)
    
    return matchesSearch && matchesType && matchesLocale && matchesStatus
  })

  const breadcrumbs = [
    { label: "Posts" }
  ]

  return (
    <AdminLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Posts</h1>
            <p className="text-gray-600 mt-2">
              Manage your news and blog posts
            </p>
          </div>
          <Button asChild className="mt-4 sm:mt-0">
            <Link href="/admin/posts/new">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="blog">Blog</SelectItem>
                </SelectContent>
              </Select>

              <Select value={localeFilter} onValueChange={(value: any) => setLocaleFilter(value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Posts Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({filteredPosts.length})</TabsTrigger>
            <TabsTrigger value="news">
              News ({filteredPosts.filter(p => p.type === "news").length})
            </TabsTrigger>
            <TabsTrigger value="blog">
              Blog ({filteredPosts.filter(p => p.type === "blog").length})
            </TabsTrigger>
            <TabsTrigger value="featured">
              Featured ({filteredPosts.filter(p => p.featured).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <PostList 
              posts={filteredPosts} 
              loading={loading}
              onPostUpdate={fetchPosts}
            />
          </TabsContent>

          <TabsContent value="news" className="mt-6">
            <PostList 
              posts={filteredPosts.filter(p => p.type === "news")} 
              loading={loading}
              onPostUpdate={fetchPosts}
            />
          </TabsContent>

          <TabsContent value="blog" className="mt-6">
            <PostList 
              posts={filteredPosts.filter(p => p.type === "blog")} 
              loading={loading}
              onPostUpdate={fetchPosts}
            />
          </TabsContent>

          <TabsContent value="featured" className="mt-6">
            <PostList 
              posts={filteredPosts.filter(p => p.featured)} 
              loading={loading}
              onPostUpdate={fetchPosts}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
