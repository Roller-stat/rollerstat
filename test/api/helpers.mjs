export const WEB_BASE_URL = process.env.TEST_WEB_BASE_URL || "http://localhost:3000"
export const ADMIN_BASE_URL = process.env.TEST_ADMIN_BASE_URL || "http://localhost:3001"

export async function safeFetch(url, options = {}) {
  try {
    const response = await fetch(url, options)
    return { ok: true, response }
  } catch (error) {
    return { ok: false, error }
  }
}

export function isSkippableConnectionError(error) {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes("fetch failed") ||
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("network")
  )
}
