# Retention Automation Setup

This project now supports automatic retention cleanup for comments, reactions, and contact submissions.

## 1. Apply DB migration

Run this SQL in Supabase SQL Editor:

`packages/db/migrations/20260307_retention_automation.sql`

It creates:

- `contact_submissions` table
- `retention_job_runs` audit table
- `run_retention_cleanup()` SQL function
- optional daily `pg_cron` job (when extension is available)

## 2. Configure API secret (optional but recommended)

Add this env var to the web app:

```env
RETENTION_CRON_SECRET=replace-with-strong-random-secret
```

The endpoint accepts either:

- `x-retention-secret: <RETENTION_CRON_SECRET>`
- `Authorization: Bearer <RETENTION_CRON_SECRET>`

Endpoint:

`POST /api/maintenance/retention`

Example:

```bash
curl -X POST http://localhost:3000/api/maintenance/retention \
  -H "x-retention-secret: $RETENTION_CRON_SECRET" \
  -H "content-type: application/json" \
  -d '{"invokedBy":"manual_api"}'
```

## 3. Manual run from CLI

```bash
npm run retention:run
```

Optional custom source label:

```bash
node scripts/run-retention-cleanup.mjs "manual_cli"
```

## 4. Current enforced windows

- comments with `status='deleted'`: purge after 30 days
- reactions: purge after 12 months
- contact submissions: purge after 12 months

