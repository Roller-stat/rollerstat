import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { createNewsletterCampaign, listNewsletterCampaigns } from "@/lib/newsletter"

const campaignStatusSchema = z.enum(["suspended", "archive", "sent", "queued", "draft", "inProcess"])

const createCampaignSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  subject: z.string().trim().min(3).max(180),
  previewText: z.string().trim().max(200).optional(),
  htmlContent: z.string().trim().min(20),
  listId: z.number().int().positive().optional(),
  scheduleAt: z.string().trim().optional(),
  sendNow: z.boolean().optional(),
})

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
    const pageSize = Math.min(100, Math.max(1, parsePositiveInt(searchParams.get("pageSize"), 10)))
    const statusParam = searchParams.get("status")
    const status = statusParam ? campaignStatusSchema.safeParse(statusParam).data : undefined

    const result = await listNewsletterCampaigns({
      page,
      pageSize,
      status,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error loading newsletter campaigns:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load newsletter campaigns" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createCampaignSchema.parse(body)

    const scheduleAt = parsed.scheduleAt?.trim() ? parsed.scheduleAt : undefined
    const result = await createNewsletterCampaign({
      name: parsed.name,
      subject: parsed.subject,
      previewText: parsed.previewText,
      htmlContent: parsed.htmlContent,
      listId: parsed.listId,
      scheduleAt,
      sendNow: scheduleAt ? false : parsed.sendNow,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create campaign" },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      campaignId: result.campaignId,
      status: result.status,
      message: result.status === "scheduled" ? "Campaign scheduled" : "Campaign sent",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      )
    }

    console.error("Error creating newsletter campaign:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create campaign" },
      { status: 500 },
    )
  }
}
