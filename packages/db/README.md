# Rollerstat DB

This folder contains SQL schema and migration helpers for the Postgres content model.

## Apply Schema

Run the SQL in `schema.sql` in Supabase SQL Editor.

For existing projects that already have `reactions` table, run the SQL from:

`migrations/20260306_expand_reaction_types.sql`

Then apply:

`migrations/20260306_interactions_scope_post_id.sql`

and:

`migrations/20260307_retention_automation.sql`

and:

`migrations/20260310_enable_row_level_security.sql`

## Import Existing MDX Content

After schema exists and env vars are set:

```bash
node scripts/import-mdx-to-db.mjs
```

Required env vars:

- `SUPABASE_URL`
- one of `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_KEY`

## Retention Cleanup

The retention migration creates:

- `contact_submissions`
- `retention_job_runs`
- `public.run_retention_cleanup(p_invoked_by text)`

Policy enforced by SQL cleanup:

- deleted comments hard-deleted after 30 days
- reactions older than 12 months deleted
- contact submissions older than 12 months deleted

Manual run from repo root:

```bash
npm run retention:run
```

If `pg_cron` is available in your DB, the migration also registers a daily automatic cleanup job.
