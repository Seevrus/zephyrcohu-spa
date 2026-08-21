---
paths:
  - routes/api.php
---

# Routes

## API rate limiting: named limiters, not inline throttle:N,M
`bootstrap/app.php` calls `$middleware->throttleApi()`, and `AppServiceProvider::boot()` defines the named limiters via `RateLimiter::for()`:
- `api` (60/min, by user id or IP) — applied automatically to the whole `api` middleware group.
- `auth` (5/min by IP) — attach explicitly with `->middleware('throttle:auth')` to sensitive unauthenticated endpoints (login, register, confirm/resend email, revoke registration, request/reset password, confirm new email).

New sensitive/abuse-prone public endpoints should get `throttle:auth` (or a new named limiter) rather than inline `throttle:N,M`, to keep limiter config centralized in AppServiceProvider.

## API rate limiting: named limiters, not inline throttle:N,M
`bootstrap/app.php` calls `$middleware->throttleApi()`, and `AppServiceProvider::boot()` defines the named limiters via `RateLimiter::for()`:
- `api` (60/min, by user id or IP) — applied automatically to the whole `api` middleware group.
- `auth` (5/min by IP) — a generic anti-abuse limiter, attached explicitly with `->middleware('throttle:auth')` to sensitive/abuse-prone unauthenticated endpoints: login, register (create/confirm_email/resend_confirm_email/revoke), request/reset password, confirm new email, captcha check, offer requests.

New sensitive/abuse-prone public endpoints should get `throttle:auth` (or a new named limiter if 5/min by IP doesn't fit) rather than inline `throttle:N,M`, to keep limiter config centralized in AppServiceProvider.
