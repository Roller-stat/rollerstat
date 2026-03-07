# Rollerstat Temporary Test Folder

This folder is intentionally isolated at the repository root so it can be deleted in one step later.

## Scope Covered

- Phase 3G: system-wide integration checks (auth, posts, comments, reactions, newsletter APIs)
- Phase 8: basic optimization checks (API latency smoke checks, endpoint health checks)

## Run

1. Start apps (`web` and `admin`) before running tests.
2. Optionally set:
   - `TEST_WEB_BASE_URL` (default: `http://localhost:3000`)
   - `TEST_ADMIN_BASE_URL` (default: `http://localhost:3001`)
3. Run:
   - `npm run test:phase3g`
   - `npm run test:phase8`

## Notes

- Tests are smoke-style and intentionally non-destructive.
- If servers are not running, tests skip instead of failing hard.
