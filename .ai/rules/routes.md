---
paths:
  - routes/api.php
---

# Routes

## API rate limiting: named limiters, not inline throttle:N,M
`bootstrap/app.php` calls `$middleware->throttleApi()`, and `AppServiceProvider::boot()` defines the named limiters via `RateLimiter::for()`:
- `api` (60/min, by user id or IP) — applied automatically to the whole `api` middleware group.
- `auth` (5/min by IP) — a generic anti-abuse limiter, attached explicitly with `->middleware('throttle:auth')` to sensitive/abuse-prone unauthenticated endpoints: login, register (create/confirm_email/resend_confirm_email/revoke), request/reset password, confirm new email, captcha check, offer requests.
- `newsletter` (120/min, by user id or IP) — attached to `POST /admin/newsletters/{newsletter}/recipients/{user}` (one request per newsletter recipient, fired in a loop by the FE); needs its own limiter because that loop can exceed 60 requests/min on its own.

New sensitive/abuse-prone public endpoints should get `throttle:auth` (or a new named limiter if 5/min by IP doesn't fit) rather than inline `throttle:N,M`, to keep limiter config centralized in AppServiceProvider.

## Opting a route out of the group-applied `api` limiter
Any route inside the `api` middleware group inherits `throttle:api` (60/min) whether it needs it
or not. Giving a route its own named limiter via `->middleware('throttle:<name>')` does **not**
remove `throttle:api` — both apply, and the stricter one wins — so a route that genuinely needs a
different budget (a tighter one, or a looser one like `newsletter`'s 120/min) must explicitly drop
the inherited limiter too:

```php
Route::post(...)
    ->withoutMiddleware('throttle:api')
    ->middleware('throttle:newsletter');
```

**`->withoutMiddleware([ThrottleRequests::class])` (the bare middleware class) does not work.**
`throttleApi()` attaches the limiter as the parameterised string `throttle:api`, and Laravel's
`MiddlewareNameResolver` resolves that to `"Illuminate\Routing\Middleware\ThrottleRequests:api"` —
a string that never equals the bare class name, and isn't a valid class either, so the exclusion
check silently no-ops and the inherited limiter keeps applying. Exclude the exact string instead:
`->withoutMiddleware('throttle:api')`. This applies to excluding *any* parameterised middleware,
not just throttling.

Verify with `php artisan route:list --path=... -vv` — plain `-v` only prints the `api` group's
name, not its expanded contents, so it can't confirm the exclusion actually took effect.

## Admin routes live under /api/admin guarded by the admin middleware alias
Everything under `/api/admin` is guarded by the `admin` middleware alias (`App\Http\Middleware\EnsureUserIsAdmin`), registered in `bootstrap/app.php`. It 404s guests and non-admins (never 401/403) so the admin API's existence is not disclosed. Never add an admin route outside the `Route::prefix('admin')->middleware('admin')->group(...)` block at the end of `routes/api.php`, and never guard an admin route with `auth:sanctum` instead — that would leak a 401 to non-admins.
