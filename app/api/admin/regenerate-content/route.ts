import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

// POST /api/admin/regenerate-content - Regenerate contentlayer data
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Regenerate contentlayer data
    try {
      const { stdout, stderr } = await execAsync("npx contentlayer2 build")
      
      if (stderr) {
        console.warn("Contentlayer build warnings:", stderr)
      }
      
      console.log("Contentlayer build output:", stdout)
      
      return NextResponse.json({
        success: true,
        message: "Content regenerated successfully",
        output: stdout
      })
    } catch (error) {
      console.error("Error regenerating content:", error)
      return NextResponse.json(
        { error: "Failed to regenerate content", details: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error in regenerate-content endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
