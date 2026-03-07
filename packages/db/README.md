# Rollerstat DB

This folder contains SQL schema and migration helpers for the Postgres content model.

## Apply Schema

Run the SQL in `schema.sql` in Supabase SQL Editor.

For existing projects that already have `reactions` table, run the SQL from:

`migrations/20260306_expand_reaction_types.sql`

## Import Existing MDX Content

After schema exists and env vars are set:

```bash
node scripts/import-mdx-to-db.mjs
```

Required env vars:

- `SUPABASE_URL`
- one of `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
