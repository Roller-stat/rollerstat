import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { isDatabaseConfigured } from "@/lib/db/client"
import * as dbOps from "@/lib/db-operations"

const generateLocalesSchema = z.object({
  targetLocales: z.array(z.enum(["en", "es", "fr", "it", "pt"])).min(1, "Select at least one locale"),
  translationMode: z.enum(["translate-only"]).optional().default("translate-only"),
  sourceOverride: z
    .object({
      title: z.string().optional(),
      summary: z.string().optional(),
      content: z.string().optional(),
      author: z.string().optional(),
      coverImage: z.string().optional(),
      heroVideo: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string; type: string; slug: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "Locale generation requires database mode." },
        { status: 400 },
      )
    }

    const { locale, type, slug } = await params
    if (!["en", "es", "fr", "it", "pt"].includes(locale)) {
      return NextResponse.json({ error: "Invalid locale" }, { status: 400 })
    }
    if (!["news", "blog"].includes(type)) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = generateLocalesSchema.parse(body)

    const result = await dbOps.generateLocaleDraftsForExistingPost({
      locale,
      type: type as "news" | "blog",
      slug,
      targetLocales: validatedData.targetLocales,
      translationMode: validatedData.translationMode,
      sourceOverride: validatedData.sourceOverride,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to generate locale drafts" },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      createdLocales: result.createdLocales || [],
      skippedLocales: result.skippedLocales || [],
      failedLocales: result.failedLocales || [],
    })
  } catch (error) {
    console.error("Error generating locale drafts:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
