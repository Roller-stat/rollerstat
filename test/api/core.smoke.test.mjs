import test from "node:test"
import assert from "node:assert/strict"
import { ADMIN_BASE_URL, WEB_BASE_URL, isSkippableConnectionError, safeFetch } from "./helpers.mjs"

test("web homepage responds", async (t) => {
  const result = await safeFetch(`${WEB_BASE_URL}/en`)
  if (!result.ok) {
    if (isSkippableConnectionError(result.error)) {
      t.skip(`Web app not reachable: ${result.error.message}`)
      return
    }
    throw result.error
  }

  assert.equal(result.response.status, 200)
})

test("admin protected posts endpoint requires auth", async (t) => {
  const result = await safeFetch(`${ADMIN_BASE_URL}/api/admin/posts?page=1&pageSize=1`)
  if (!result.ok) {
    if (isSkippableConnectionError(result.error)) {
      t.skip(`Admin app not reachable: ${result.error.message}`)
      return
    }
    throw result.error
  }

  assert.equal(result.response.status, 401)
})

test("public comments endpoint reachable", async (t) => {
  const result = await safeFetch(`${WEB_BASE_URL}/api/comments`)
  if (!result.ok) {
    if (isSkippableConnectionError(result.error)) {
      t.skip(`Web app not reachable: ${result.error.message}`)
      return
    }
    throw result.error
  }

  assert.ok([200, 400, 401, 405].includes(result.response.status))
})
