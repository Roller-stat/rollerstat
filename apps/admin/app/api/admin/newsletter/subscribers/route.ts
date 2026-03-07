import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { listNewsletterSubscribers } from "@/lib/newsletter"

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return parsed
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parsePositiveInt(searchParams.get("page"), 1)
    const pageSize = Math.min(100, Math.max(1, parsePositiveInt(searchParams.get("pageSize"), 20)))
    const query = (searchParams.get("q") || "").trim()

    const result = await listNewsletterSubscribers({
      page,
      pageSize,
      query,
    })

    return NextResponse.json({
      items: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    })
  } catch (error) {
    console.error("Error loading newsletter subscribers:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load subscribers" },
      { status: 500 },
    )
  }
}
