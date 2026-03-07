import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getNewsletterStats } from "@/lib/newsletter"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stats = await getNewsletterStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error loading newsletter stats:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load newsletter stats" },
      { status: 500 },
    )
  }
}
