Done — I reviewed the **main branch only**, read-only.

Verified:
- Branch stayed: `main`
- Commit reviewed: `9f27bcd fix quotes`
- Working tree: clean
- No files changed
- No branch created
- No push made

## Repo understanding

Your repo is a **Next.js monorepo**:

```txt
rollerstat/
  apps/
    web/       public multilingual website
    admin/     internal admin dashboard
  packages/
    db/        Supabase/Postgres schema + migrations
  scripts/     retention cleanup + admin dev launcher
  docs/
```

Tech:
- Next.js 15
- React 19
- TypeScript
- Supabase/Postgres
- NextAuth
- next-intl
- Brevo
- Cloudinary
- Gemini translation
- Docker Compose

## Main improvement priorities

### 1. SEO / website ranking — highest priority

Important issue: committed sitemap/robots currently reference localhost.

Files:
- `apps/web/public/sitemap.xml`
- `apps/web/public/robots.txt`

Fix:
- Ensure production sitemap uses `https://rollerstat.com`
- Add proper canonical URLs
- Add dynamic sitemap with actual news/blog URLs
- Add `hreflang` only for real translated posts
- Add stronger article metadata + sports/news structured data

This directly affects Google ranking.

---

### 2. Public pages should use caching / ISR

Many public pages use dynamic rendering / no cache.

Improve:
- Use ISR for news/blog/home pages
- Example: `revalidate = 60` or `300`
- Generate static params for known post slugs
- Revalidate after admin publishes content

This improves speed, SEO crawlability, and cost.

---

### 3. Add CI/tests immediately

Currently I found:
- No `.github/workflows`
- No tests
- No `test` script
- No automated typecheck script

Add CI for:
- `npm ci`
- lint web/admin
- TypeScript check web/admin
- build web/admin

This is important before serious growth.

---

### 4. Admin security needs hardening

Current admin auth works for early stage, but improve before production scale.

Issues:
- Plain env-based admin credentials
- No login rate limit / lockout
- Cloudflare Access middleware checks headers but does not verify JWT signature
- Admin APIs use Supabase service role, so route auth must be very strong

Improvements:
- Verify Cloudflare Access JWT, not just header presence
- Add login rate limiting
- Add admin audit logs
- Consider Cloudflare Access / SSO as mandatory production layer
- Centralize `requireAdmin()` helper

---

### 5. Supabase RLS is enabled but policies are missing

File:
- `packages/db/migrations/20260310_enable_row_level_security.sql`

RLS is enabled, but no actual policies are defined.

Improve:
- Add policies for public read published content
- Admin-only write policies
- Explicit function permissions
- Avoid broad key fallbacks like `SUPABASE_KEY` for privileged server operations

---

### 6. MDX/Markdown safety + rendering

There are custom markdown renderers and admin preview uses `dangerouslySetInnerHTML`.

Improve:
- Use a proper markdown/MDX renderer
- Sanitize HTML
- Restrict allowed MDX components
- Validate AI-generated content before save/publish

Important because your admin may paste or generate content.

---

### 7. Admin content workflow can become much better

Current admin dashboard is functional, but improvements:

- Autosave drafts
- Unsaved changes warning
- Better markdown editor
- Real preview matching frontend
- Publish checklist
- Image insertion flow
- Post status workflow: draft → review → published → archived
- Comment moderation notes/audit trail
- Bulk comment moderation

---

### 8. Deployment/ops improvements

Add:
- `.env.example`
- Healthcheck endpoints
- Docker healthchecks
- Next.js standalone Docker output
- Production deployment runbook
- Retention cron monitoring
- Backup/export strategy for posts/media/database

---

### 9. Automation opportunities for your future content system

Good candidates for cron/automation later:

- Daily source monitoring for roller hockey news
- Draft generation from approved sources
- Translation draft generation
- SEO metadata generation
- Broken link/image checker
- Sitemap refresh check
- Social post drafts
- Weekly content performance summary
- Comment spam/moderation digest
- Retention cleanup monitoring

For now I would keep automation as **draft-only**, not auto-publish.

---

## My recommended roadmap

### Phase 1 — Foundation / safety

1. Fix sitemap/robots/canonical SEO
2. Add CI + typecheck + build checks
3. Add `.env.example`
4. Harden admin auth/middleware
5. Add RLS policies
6. Add healthchecks

### Phase 2 — Content quality

1. Improve admin editor
2. Add proper MDX/markdown renderer
3. Add post preview
4. Add autosave drafts
5. Add structured content schema
6. Improve translations workflow

### Phase 3 — SEO/content growth

1. Dynamic sitemap with real posts
2. Better article schema
3. Internal linking
4. Tag/category pages
5. Author pages
6. Related posts
7. Performance optimization

### Phase 4 — Automation

1. Source monitoring
2. Draft creation
3. Translation drafts
4. Social media drafts
5. SEO checks
6. Analytics reports

### Phase 5 — Future SaaS analytics

Keep analytics separate from news/blog schema:
- teams/accounts
- players/clubs/leagues
- matches/events
- statistics tables
- billing/subscriptions
- permissions/roles
- data ingestion pipeline

## Bottom line

Your repo is a solid early-stage foundation. The biggest immediate wins are:

1. **Fix SEO basics**
2. **Add CI/testing**
3. **Harden admin security**
4. **Improve caching/performance**
5. **Make content publishing safer and more professional**

I’ve also saved the repo structure in memory for future RollerStat work.