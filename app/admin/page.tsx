"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthGuard } from "@/components/auth/auth-guard"
import { LogOut, User } from "lucide-react"

export default function AdminDashboard() {
  const { data: session } = useSession()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Welcome to the Rollerstat admin panel</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm text-gray-600">{session?.user?.email}</span>
                </div>
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Posts Management</CardTitle>
                  <CardDescription>
                    Create, edit, and manage news posts and blog articles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => router.push("/admin/posts")}
                    className="w-full"
                  >
                    Manage Posts
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>
                    View user analytics and engagement metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => router.push("/admin/analytics")}
                    variant="outline"
                    className="w-full"
                    disabled
                  >
                    View Analytics
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>
                    Configure site settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => router.push("/admin/settings")}
                    variant="outline"
                    className="w-full"
                    disabled
                  >
                    Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
