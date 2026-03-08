# Phase 8 Testing and Optimization Checklist

Status values: `TODO`, `PASS`, `FAIL`, `N/A`

## Deliverability and Email Reliability

- [ ] Brevo sender/domain authentication verified
- [ ] Welcome template sends correctly per locale
- [ ] Unsubscribe confirmation template sends correctly per locale
- [ ] Campaign send success/failure surfaced in admin UI

## Performance Smoke

- [ ] Web health endpoint latency acceptable (p95 target defined)
- [ ] Admin API latency acceptable for list endpoints
- [ ] Newsletter subscribers endpoint pagination performs acceptably
- [ ] Newsletter campaigns endpoint pagination performs acceptably

## Error Handling

- [ ] API returns structured error payload on expected failures
- [ ] User-facing UI shows actionable error toasts
- [ ] No unhandled promise rejections in server logs

## Operational Readiness

- [ ] Environment variables validated in startup docs
- [ ] Non-critical failures do not block primary workflows
- [ ] Basic runbook exists for common failure modes

## Manual Regression Quick Pass

- [ ] Theme modes unaffected by newsletter/admin additions
- [ ] Mobile navigation still works on admin
- [ ] Dockerized web/admin startup still healthy
