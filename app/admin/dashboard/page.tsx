"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  FileText,
  Plus,
  TrendingUp, 
  Eye,
  Calendar,
  Globe
} from "lucide-react"
import Link from "next/link"

interface PostStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  newsPosts: number
  blogPosts: number
  postsByLocale: Record<string, number>
}


interface PostData {
  id: string
  title: string
  type: "news" | "blog"
  locale: string
  published: boolean
  featured: boolean
  date: string
  author: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<PostStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch posts data
      const response = await fetch("/api/admin/posts")
      if (!response.ok) {
        throw new Error("Failed to fetch posts")
      }
      
      const data = await response.json()
      
      // Ensure we have an array of posts
      const posts = Array.isArray(data) ? data : []
      
      // Calculate statistics
      const totalPosts = posts.length
      const publishedPosts = posts.filter((post: PostData) => post.published).length
      const draftPosts = totalPosts - publishedPosts
      const newsPosts = posts.filter((post: PostData) => post.type === "news").length
      const blogPosts = posts.filter((post: PostData) => post.type === "blog").length
      
      // Calculate posts by locale
      const postsByLocale = posts.reduce((acc: Record<string, number>, post: PostData) => {
        acc[post.locale] = (acc[post.locale] || 0) + 1
        return acc
      }, {})
      
      setStats({
        totalPosts,
        publishedPosts,
        draftPosts,
        newsPosts,
        blogPosts,
        postsByLocale
      })
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    trend 
  }: {
    title: string
    value: number | string
    description: string
    icon: React.ComponentType<{ className?: string }>
    trend?: string
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
        {trend && (
          <div className="flex items-center pt-1">
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            <span className="text-xs text-green-500">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const StatSkeleton = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Welcome to your Rollerstat admin panel
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button asChild>
              <Link href="/admin/posts/new">
                <Plus className="h-4 w-4 mr-2" />
                New Post
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/posts">
                <FileText className="h-4 w-4 mr-2" />
                View All Posts
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {loading ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : stats ? (
            <>
              <StatCard
                title="Total Posts"
                value={stats.totalPosts}
                description="All content created"
                icon={FileText}
              />
              <StatCard
                title="Published"
                value={stats.publishedPosts}
                description="Live on website"
                icon={Eye}
              />
              <StatCard
                title="Drafts"
                value={stats.draftPosts}
                description="Work in progress"
                icon={Calendar}
              />
              <StatCard
                title="News Posts"
                value={stats.newsPosts}
                description="Current events"
                icon={TrendingUp}
              />
            </>
          ) : null}
        </div>

        {/* Content Type Breakdown */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Types</CardTitle>
                <CardDescription>
                  Distribution of news vs blog posts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium">News Posts</span>
                    </div>
                    <span className="text-sm text-gray-600">{stats.newsPosts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Blog Posts</span>
                    </div>
                    <span className="text-sm text-gray-600">{stats.blogPosts}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Posts by Language</CardTitle>
                <CardDescription>
                  Content distribution across locales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.postsByLocale).map(([locale, count]) => (
                    <div key={locale} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium uppercase">{locale}</span>
                      </div>
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </AdminLayout>
  )
}
