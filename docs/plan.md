# Rollerstat Plan Status (March 2026)

This file is now split into two sections:
- `Implemented`
- `Left to be implemented`

## Implemented

### 1) Architecture and setup
- Monorepo structure in place:
  - `apps/web` (public website)
  - `apps/admin` (admin backend UI)
  - `packages/db` (schema + SQL migrations)
  - `scripts` (data import + maintenance)
- Dockerized web + admin services with consistent port mapping.
- Locale baseline finalized to: `en`, `es`, `fr`, `it`, `pt` (no `de`).

### 2) Public website (core product)
- Responsive landing/home, news, blogs, contact pages.
- Locale routes implemented:
  - `/{locale}`
  - `/{locale}/news`
  - `/{locale}/blogs`
  - `/{locale}/news/{slug}`
  - `/{locale}/blogs/{slug}`
- Homepage dynamic content behavior implemented (latest + top stories from content data).
- Theme system implemented across web and admin:
  - `light`
  - `dark`
  - `system`
- Legal pages implemented:
  - `/{locale}/privacy`
  - `/{locale}/license`
  - `/{locale}/terms`

### 3) Auth, comments, reactions
- Web auth implemented with Google provider (Auth.js / NextAuth).
- Comment policy implemented:
  - login required to comment
  - users can edit/delete their own comments
  - admin can moderate comments (`visible`, `hidden`, `deleted`)
- Reactions implemented with emoji set:
  - 👍, 👎, 👏, ❤️
- Reaction rule implemented:
  - one reaction per device per canonical post
  - toggle/switch behavior supported

### 4) Content model and data layer
- Supabase Postgres integration implemented.
- Canonical post model implemented:
  - `posts` as canonical entity
  - `post_localizations` for locale-specific versions
  - shared interactions (comments/reactions) across locales via `post_id`
- Tags/localization linking implemented.
- MDX-to-DB import script implemented:
  - `scripts/import-mdx-to-db.mjs`
- DB schema and migrations implemented in:
  - `packages/db/schema.sql`
  - `packages/db/migrations/*`

### 5) Admin panel (content operations)
- Admin authentication implemented (credentials).
- Admin pages implemented:
  - dashboard
  - posts list/new/edit
  - comments moderation
  - newsletter panel
- Post management implemented with:
  - create/edit
  - draft/publish states
  - locale-aware content
  - locale draft generation (AI translate mode)
- Post list filtering + pagination implemented:
  - date range (`today`, `7d`, `30d`, `custom`)
  - date field selector (`publishedAt`, `createdAt`, `updatedAt`)
  - type (`news`, `blog`)
  - status (`draft`, `published`, `archived`)
  - locale (`en`, `es`, `fr`, `it`, `pt`)
  - search (title/slug)
  - server-side pagination with query-param persistence
- Draft deletion behavior implemented:
  - delete single locale draft
  - optional delete all draft locales in a group
  - published posts protected from this delete action

### 6) Media management
- Cloudinary upload flow implemented in admin:
  - image upload (max 4 MB)
  - video upload (max 20 MB)
- Uploaded URLs auto-fill media URL fields.
- Manual URL input remains supported.

### 7) Newsletter (Brevo)
- Brevo integration implemented for subscribe/unsubscribe + status.
- Public APIs implemented:
  - `POST /api/subscribe`
  - `POST /api/unsubscribe`
  - `GET /api/subscription-status`
  - `POST /api/webhooks/brevo`
- Tokenized unsubscribe flow implemented (with verification route + page).
- Admin newsletter module implemented:
  - subscribers listing
  - campaign listing
  - campaign creation/send/schedule
- Admin post publishing supports newsletter campaign trigger.

### 8) Compliance and retention
- Privacy/Terms/License pages implemented and wired in UI.
- Retention policy text implemented.
- Retention automation implemented technically:
  - SQL migration for cleanup function + logs
  - maintenance API route
  - runtime cleanup script (`scripts/run-retention-cleanup.mjs`)

## Left to be implemented

### A) Analytics (product analytics)
- GA4 (or equivalent) end-to-end analytics is still not implemented:
  - pageview/event instrumentation
  - defined event taxonomy
  - dashboard/reporting layer

### B) Full automated integration test suite in repo
- Test scripts are present in `package.json`, but no committed `test/` directory is currently present.
- A complete automated PASS/FAIL suite for core flows is still pending in-repo.

### C) Deployment hardening and production ops
- Final production hardening checklist still pending:
  - SMTP/domain deliverability hardening (SPF/DKIM/DMARC verification process)
  - alerting/monitoring runbook finalization
  - incident/recovery runbook finalization

### D) Security hardening follow-up
- Brevo webhook signature verification strict enforcement should be finalized if `BREVO_WEBHOOK_SECRET`-based validation is required in your production policy.

### E) Optional product items (not critical now)
- Forced sign-up prompt/gate on landing (current UX uses CTA, not forced gate).
- Advanced newsletter segmentation and deeper analytics reporting.
