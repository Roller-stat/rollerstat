# Phase 3G System Integration Checklist

Status values: `TODO`, `PASS`, `FAIL`, `N/A`

## Environment

- [ ] Admin app running on expected URL
- [ ] Web app running on expected URL
- [ ] Supabase DB connectivity verified
- [ ] Brevo API connectivity verified
- [ ] Cloudinary upload route reachable

## Authentication

- [ ] Admin login success with valid credentials
- [ ] Admin login failure with invalid credentials
- [ ] Protected admin APIs reject unauthenticated requests (`401`)
- [ ] Logout clears session and protects admin routes again

## Posts + Locales

- [ ] Create draft post (all required fields)
- [ ] Publish post from admin
- [ ] Edit post and persist changes
- [ ] Delete draft post (single locale)
- [ ] Delete draft post (all draft locales)
- [ ] Locale draft generation works (EN -> ES/FR/IT/PT)

## Public Content Surface

- [ ] Post appears on web in correct locale and route
- [ ] News list and blogs list render correctly
- [ ] Post detail page loads without server errors

## Comments + Reactions

- [ ] Google sign-in required for comments
- [ ] Comment create/read/hide/delete flow works
- [ ] Reactions work for all active emojis
- [ ] One reaction per device behavior enforced
- [ ] Reaction counts visible to all visitors

## Newsletter + Brevo

- [ ] Subscribe endpoint accepts valid email
- [ ] Duplicate subscribe returns expected conflict behavior
- [ ] Unsubscribe token flow works end-to-end
- [ ] Admin newsletter campaign create/send works
- [ ] Admin newsletter campaign schedule works
- [ ] Publish-time "send newsletter" post option works

## Contacts + Retention

- [ ] Contact form submission stores record
- [ ] Retention RPC endpoint callable with secret
- [ ] Retention cleanup run logged in `retention_job_runs`
