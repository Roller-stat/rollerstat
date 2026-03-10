# RollerStat

RollerStat is a multilingual roller hockey platform with:

- a public website for news/blog content and community interactions
- an internal admin dashboard for content and comment moderation
- Brevo integration for subscriptions, welcome/unsubscribe messaging, and webhooks

Newsletter campaign management is handled directly in Brevo. The admin dashboard no longer includes a newsletter/campaign page.

## Project Layout

- `apps/web` - public website + public APIs
- `apps/admin` - admin dashboard + admin APIs
- `packages/db/migrations` - SQL migrations for Supabase/Postgres
- `scripts` - operational scripts (admin dev launcher, retention cleanup)

## Tech Stack

- Next.js 15 (App Router), React 19, TypeScript
- NextAuth (Google auth for web, credentials auth for admin)
- Supabase (database/storage)
- Brevo (email + subscription flows)
- Docker Compose (local container runtime)

## Requirements

- Node.js 20+
- npm
- Supabase project
- Brevo account (for subscription/email flows)

## Local Development

Install dependencies:

```bash
npm ci
```

Run public website:

```bash
npm run dev:web
```

Run admin dashboard:

```bash
npm run dev:admin
```

Local URLs:

- website: `http://localhost:3000/en`
- admin: `http://localhost:3001/admin/login` (or another port if 3001 is busy; the script prints the URL)

## Quality Checks

Run lint:

```bash
npm run lint
```

Run TypeScript checks:

```bash
cd apps/web && npx tsc --noEmit
cd apps/admin && npx tsc --noEmit
```

Build both applications:

```bash
npm run build
```

## Docker

Build and run:

```bash
docker compose up --build -d
```

Stop:

```bash
docker compose down
```

Logs:

```bash
docker compose logs -f web admin
```

Container URLs:

- website: `http://localhost:3000`
- admin: `http://localhost:3001/admin/login`

Important:

- In Compose, `ENV` defaults to `LOCAL`.
- For production-mode URL behavior in containers, run with `ENV=PROD` before `docker compose up`.

## Database Migrations

SQL files in `packages/db/migrations` are versioned migration scripts.
Adding/editing files does not change your live database automatically.
Apply them in Supabase SQL Editor (or your migration tooling) to update schema/security in the live DB.
