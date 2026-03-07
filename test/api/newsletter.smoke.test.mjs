import test from "node:test"
import assert from "node:assert/strict"
import { ADMIN_BASE_URL, WEB_BASE_URL, isSkippableConnectionError, safeFetch } from "./helpers.mjs"

test("subscribe endpoint health", async (t) => {
  const result = await safeFetch(`${WEB_BASE_URL}/api/subscribe`)
  if (!result.ok) {
    if (isSkippableConnectionError(result.error)) {
      t.skip(`Web app not reachable: ${result.error.message}`)
      return
    }
    throw result.error
  }

  assert.equal(result.response.status, 200)
})

test("admin newsletter stats endpoint requires auth", async (t) => {
  const result = await safeFetch(`${ADMIN_BASE_URL}/api/admin/newsletter/stats`)
  if (!result.ok) {
    if (isSkippableConnectionError(result.error)) {
      t.skip(`Admin app not reachable: ${result.error.message}`)
      return
    }
    throw result.error
  }

  assert.equal(result.response.status, 401)
})

test("admin newsletter campaigns endpoint requires auth", async (t) => {
  const result = await safeFetch(`${ADMIN_BASE_URL}/api/admin/newsletter/campaigns?page=1&pageSize=1`)
  if (!result.ok) {
    if (isSkippableConnectionError(result.error)) {
      t.skip(`Admin app not reachable: ${result.error.message}`)
      return
    }
    throw result.error
  }

  assert.equal(result.response.status, 401)
})
