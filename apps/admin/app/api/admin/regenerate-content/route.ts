import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "node:fs"
import path from "node:path"
import { isDatabaseConfigured } from "@/lib/db/client"

const execAsync = promisify(exec)

function resolveWebAppDir(): string {
  const candidates = [
    path.join(process.cwd(), "apps", "web"),
    path.join(process.cwd(), "..", "web"),
    path.join(process.cwd(), "..", "..", "apps", "web"),
  ]

  const existing = candidates.find(candidate =>
    fs.existsSync(path.join(candidate, "contentlayer.config.ts"))
  )

  return existing ?? candidates[0]
}

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

    if (isDatabaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: "Database mode active. Contentlayer regeneration is not required.",
      })
    }

    // Regenerate contentlayer data
    try {
      const { stdout, stderr } = await execAsync("npx contentlayer2 build", {
        cwd: resolveWebAppDir(),
      })
      
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
