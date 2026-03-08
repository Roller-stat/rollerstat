import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import crypto from "node:crypto"

const IMAGE_MAX_BYTES = 4 * 1024 * 1024
const VIDEO_MAX_BYTES = 20 * 1024 * 1024

type MediaType = "image" | "video"
type PostType = "news" | "blog"

function getCloudinaryConfig() {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return null
  }

  return { cloudName, apiKey, apiSecret }
}

function createCloudinarySignature(params: Record<string, string>, apiSecret: string) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&")

  return crypto
    .createHash("sha1")
    .update(`${toSign}${apiSecret}`)
    .digest("hex")
}

function resolveFolder(postType: PostType, mediaType: MediaType) {
  const postFolder = postType === "blog" ? "Blogs" : "news"
  const mediaFolder = mediaType === "image" ? "images" : "videos"
  return `${postFolder}/${mediaFolder}`
}

function validateFile(file: File, mediaType: MediaType): string | null {
  if (mediaType === "image") {
    if (!file.type.startsWith("image/")) {
      return "Only image files are allowed for image upload."
    }
    if (file.size > IMAGE_MAX_BYTES) {
      return "Image size exceeds 4 MB limit."
    }
    return null
  }

  if (!file.type.startsWith("video/")) {
    return "Only video files are allowed for video upload."
  }
  if (file.size > VIDEO_MAX_BYTES) {
    return "Video size exceeds 20 MB limit."
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cloudinary = getCloudinaryConfig()
    if (!cloudinary) {
      return NextResponse.json(
        { error: "Cloudinary is not configured on the server." },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const mediaTypeValue = formData.get("mediaType")
    const postTypeValue = formData.get("postType")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 })
    }

    const mediaType: MediaType | null =
      mediaTypeValue === "image" || mediaTypeValue === "video"
        ? (mediaTypeValue as MediaType)
        : null
    const postType: PostType | null =
      postTypeValue === "news" || postTypeValue === "blog"
        ? (postTypeValue as PostType)
        : null

    if (!mediaType || !postType) {
      return NextResponse.json(
        { error: "Invalid postType or mediaType." },
        { status: 400 }
      )
    }

    const fileValidationError = validateFile(file, mediaType)
    if (fileValidationError) {
      return NextResponse.json({ error: fileValidationError }, { status: 400 })
    }

    const folder = resolveFolder(postType, mediaType)
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signature = createCloudinarySignature(
      {
        folder,
        timestamp,
      },
      cloudinary.apiSecret
    )

    const cloudinaryPayload = new FormData()
    cloudinaryPayload.append("file", file)
    cloudinaryPayload.append("api_key", cloudinary.apiKey)
    cloudinaryPayload.append("timestamp", timestamp)
    cloudinaryPayload.append("signature", signature)
    cloudinaryPayload.append("folder", folder)

    const uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/${mediaType}/upload`
    const cloudinaryResponse = await fetch(uploadEndpoint, {
      method: "POST",
      body: cloudinaryPayload,
    })

    const cloudinaryBody = await cloudinaryResponse.json().catch(() => null)
    if (!cloudinaryResponse.ok || !cloudinaryBody?.secure_url) {
      return NextResponse.json(
        {
          error: cloudinaryBody?.error?.message || "Cloudinary upload failed.",
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      url: cloudinaryBody.secure_url as string,
      publicId: (cloudinaryBody.public_id as string) || null,
      resourceType: (cloudinaryBody.resource_type as string) || mediaType,
      bytes: (cloudinaryBody.bytes as number) || file.size,
      folder,
      format: (cloudinaryBody.format as string) || null,
    })
  } catch (error) {
    console.error("Error uploading media:", error)
    return NextResponse.json(
      { error: "Failed to upload media." },
      { status: 500 }
    )
  }
}
