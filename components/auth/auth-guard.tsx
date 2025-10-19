"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Alert className="max-w-md">
            <AlertDescription className="text-center">
              <div className="space-y-4">
                <p>You need to be logged in to access this page.</p>
                <Button 
                  onClick={() => router.push("/admin/login")}
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )
    )
  }

  if (session?.user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert className="max-w-md">
          <AlertDescription className="text-center">
            <div className="space-y-4">
                <p>You don&apos;t have permission to access this page.</p>
              <Button 
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full"
              >
                Go Home
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return <>{children}</>
}
