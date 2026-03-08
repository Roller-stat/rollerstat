# Brevo Email Subscription Plan - Current Status (March 2026)

## Implemented (Already in Code)

- Brevo SDK integration is in place (`@getbrevo/brevo`) for web and admin newsletter workflows.
- Core Brevo service layer exists with contact/list/email helpers:
  - subscribe/unsubscribe contact handling
  - list operations
  - welcome/unsubscribe transactional email sending
- Public API routes are implemented:
  - `POST /api/subscribe`
  - `POST /api/unsubscribe`
  - `GET /api/subscription-status`
  - `POST /api/webhooks/brevo`
- Token-based unsubscribe flow is implemented:
  - signed unsubscribe token generation/verification
  - locale-aware unsubscribe page and API flow
- Locale-based Brevo template support is implemented for welcome/unsubscribe emails.
- Hero subscription UI integration is implemented with loading/success/error behavior.
- Admin newsletter panel is implemented:
  - subscriber list view with search + pagination
  - campaign list/history with status filter + pagination
  - campaign creation with send-now / schedule support
  - stats cards and campaign metrics (including open/click rates from Brevo)
- Admin API endpoints for newsletter management are implemented:
  - `GET /api/admin/newsletter/stats`
  - `GET /api/admin/newsletter/subscribers`
  - `GET/POST /api/admin/newsletter/campaigns`
- Admin post publish flow can trigger newsletter campaign creation from post content.
- Webhook event processing logic is implemented for key events (including unsubscribe/spam/bounce handling behavior).

## Left to Implement

- Bulk subscriber operations in admin (bulk add/remove/tag actions).
  - Criticality: **Not critical now**
- Subscriber export (CSV/JSON) from admin.
  - Criticality: **Not critical now**
- True segmentation workflows (segment management + targeting UI), beyond basic list-based flow.
  - Criticality: **Not critical now**
- Advanced analytics/reporting (ROI/conversion dashboards, deeper engagement analytics).
  - Criticality: **Not critical now**
- Double opt-in flow (email confirmation before final subscription) if you want stricter compliance posture.
  - Criticality: **Recommended before large-scale/public growth**
- Enforce webhook signature verification in the webhook route using `BREVO_WEBHOOK_SECRET` (helper exists, route should enforce it).
  - Criticality: **Recommended soon (security hardening)**
- Formal testing/optimization suite for newsletter features (load/perf/rate-limit behavior).
  - Criticality: **Not critical now**
- Production operations hardening (SPF/DKIM/DMARC checks, monitoring/alerting runbook).
  - Criticality: **Critical before full production scale**
