import test from "node:test"
import assert from "node:assert/strict"
import { WEB_BASE_URL, isSkippableConnectionError, safeFetch } from "../api/helpers.mjs"

const REQUEST_COUNT = 5
const MAX_AVG_LATENCY_MS = Number.parseInt(process.env.TEST_MAX_AVG_LATENCY_MS || "1200", 10)

test("web homepage average latency is within smoke threshold", async (t) => {
  const durations = []

  for (let index = 0; index < REQUEST_COUNT; index += 1) {
    const start = performance.now()
    const result = await safeFetch(`${WEB_BASE_URL}/en`)
    const end = performance.now()

    if (!result.ok) {
      if (isSkippableConnectionError(result.error)) {
        t.skip(`Web app not reachable: ${result.error.message}`)
        return
      }
      throw result.error
    }

    assert.equal(result.response.status, 200)
    durations.push(end - start)
  }

  const average = durations.reduce((acc, value) => acc + value, 0) / durations.length
  assert.ok(
    average <= MAX_AVG_LATENCY_MS,
    `Average latency ${average.toFixed(2)}ms exceeds threshold ${MAX_AVG_LATENCY_MS}ms`,
  )
})
