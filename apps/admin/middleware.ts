import { NextRequest, NextResponse } from "next/server"

function parseIpAllowlist(raw: string | undefined): Set<string> {
  if (!raw) {
    return new Set()
  }

  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => entry.replace(/^::ffff:/, "")),
  )
}

function getRequestIp(request: NextRequest): string | null {
  const cfIp = request.headers.get("cf-connecting-ip")
  if (cfIp) {
    return cfIp.replace(/^::ffff:/, "").trim()
  }

  const xRealIp = request.headers.get("x-real-ip")
  if (xRealIp) {
    return xRealIp.replace(/^::ffff:/, "").trim()
  }

  const xForwardedFor = request.headers.get("x-forwarded-for")
  if (!xForwardedFor) {
    return null
  }

  const first = xForwardedFor
    .split(",")
    .map((entry) => entry.trim())
    .find(Boolean)

  return first ? first.replace(/^::ffff:/, "") : null
}

function hasCloudflareAccessHeaders(request: NextRequest): boolean {
  const accessEmail = request.headers.get("cf-access-authenticated-user-email")
  const accessJwt = request.headers.get("cf-access-jwt-assertion")
  return Boolean(accessEmail || accessJwt)
}

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next()
  }

  const allowedIps = parseIpAllowlist(process.env.ADMIN_ALLOWED_IPS)
  const requireCloudflareAccess = process.env.ADMIN_REQUIRE_CF_ACCESS !== "false"

  const requestIp = getRequestIp(request)
  const ipAllowed = requestIp ? allowedIps.has(requestIp) : false
  const cloudflareAccessAllowed = requireCloudflareAccess && hasCloudflareAccessHeaders(request)

  if (ipAllowed || cloudflareAccessAllowed) {
    return NextResponse.next()
  }

  return NextResponse.json(
    { error: "Forbidden" },
    { status: 403 },
  )
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/auth/:path*"],
}
