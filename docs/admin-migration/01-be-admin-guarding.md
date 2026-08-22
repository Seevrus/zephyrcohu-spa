# Task 01 — BE: admin guard (middleware + `/api/admin` route group)

**Type:** Backend
**Depends on:** —
**Unblocks:** every other backend task
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

Create the single guard that protects the whole admin API, and the empty `/api/admin` route
group that later tasks hang their endpoints on. A guest or a logged-in non-admin must get a
**404 `GENERIC_NOT_FOUND`** — never a 401 or 403 — so the existence of the admin API is not
advertised (decision D2).

## Files

- Create: `app/Http/Middleware/EnsureUserIsAdmin.php`
- Modify: `bootstrap/app.php` — register the `admin` middleware alias
- Modify: `routes/api.php` — add the `Route::prefix('admin')->middleware('admin')` group
- Create: `app/Http/Controllers/AdminPingController.php` *(temporary, see Step 3)*
- Create: `tests/Feature/Admin/AdminGuardTest.php`
- Modify: `.ai/rules/routes.md` — document the admin group (see Step 7)

## Design

`EnsureUserIsAdmin` resolves the user from the `sanctum` guard (the API is stateful — see
`bootstrap/app.php`'s `$middleware->statefulApi()`), checks the `user_admins` row through the
existing `User::admin()` relation, and aborts with 404 otherwise. Aborting (rather than
returning an `ErrorResource`) makes `bootstrap/app.php`'s existing `NotFoundHttpException`
renderer produce the standard body:

```json
{ "status": 404, "code": "GENERIC_NOT_FOUND", "message": "The server cannot find the requested resource." }
```

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin {
    /**
     * Reject anyone who is not a logged in administrator with a 404, so that the
     * existence of the admin API is not disclosed.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response {
        $user = $request->user('sanctum');

        if (! $user || ! $user->admin) {
            abort(404);
        }

        return $next($request);
    }
}
```

Registration in `bootstrap/app.php`, inside the existing `withMiddleware` closure:

```php
$middleware->alias([
    'admin' => EnsureUserIsAdmin::class,
]);
```

Route group in `routes/api.php` (later tasks add sub-groups inside it):

```php
Route::prefix('admin')->middleware('admin')->group(function () {
    Route::get('/ping', [AdminPingController::class, 'ping']);
});
```

## Steps

- [ ] **Step 1: Write the failing guard test.** `tests/Feature/Admin/AdminGuardTest.php`, using
      the `describe()` + `reset...TestData()` shape of
      `tests/Feature/NewsController/GetNewsItemTest.php`. Seed two users: id 1 (plain) and
      id 2 (with a `user_admins` row). Cases:
      - guest `GET /api/admin/ping` → 404 with `['status' => 404, 'code' => 'GENERIC_NOT_FOUND']`
        (assert with `assertJson`, since the renderer also returns `message`)
      - non-admin (`Sanctum::actingAs(User::find(1))`) → 404
      - admin (`Sanctum::actingAs(User::find(2))`) → 200
      - `POST /api/admin/ping` as admin → 405 `GENERIC_METHOD_NOT_ALLOWED` (proves the group is
        routed, not swallowed)
- [ ] **Step 2: Run it and watch it fail** — `php artisan test --compact --filter=AdminGuardTest`
      (expect 404 on every case, including the admin one, because the route does not exist yet).
- [ ] **Step 3: Create the temporary ping controller.** `php artisan make:controller AdminPingController --no-interaction`,
      with a single action returning `response()->json(['data' => 'ok'])`, so the 200 assertion
      has a body to check.
- [ ] **Step 4: Create the middleware** with `php artisan make:middleware EnsureUserIsAdmin --no-interaction`
      and fill in the body above.
- [ ] **Step 5: Register the alias** in `bootstrap/app.php` and **add the route group** in
      `routes/api.php` (place it *after* the existing controller groups, at the end of the file).
- [ ] **Step 6: Run the test again** — all four cases pass.
- [ ] **Step 7: Record the rule.** Use the Boost `record-rule` MCP tool with
      `glob: routes/api.php` documenting: "everything under `/api/admin` is guarded by the
      `admin` middleware alias (`EnsureUserIsAdmin`), which 404s guests and non-admins; never
      add an admin route outside that group, and never guard it with `auth:sanctum` (that would
      leak a 401)."
- [ ] **Step 8: `vendor/bin/pint --dirty --format agent`**
- [ ] **Step 9: Self review** (checklist below), then append a `JOURNAL.md` entry and tick
      Task 01 in `00-overview.md`.

> **Keep or drop the ping endpoint?** Keep it for this task only; Task 04 is the first task that
> adds a real endpoint. Task 04 removes `AdminPingController` and rewrites
> `AdminGuardTest` to exercise `GET /api/admin/news` instead. Note that hand-off in the journal.

## Tests to write

`tests/Feature/Admin/AdminGuardTest.php`:

- `test('returns 404 for a guest')`
- `test('returns 404 for a logged in non-admin user')`
- `test('lets an administrator through')`
- `test('returns 405 for a wrong method on an admin route')`

## Verification

```bash
php artisan test --compact --filter=AdminGuardTest
vendor/bin/pint --dirty --format agent
php artisan route:list --path=api/admin
```

## Self review

- [ ] The middleware uses `$request->user('sanctum')` — not `auth()->user()` — and does not
      short-circuit on session state.
- [ ] Non-admin and guest responses are byte-identical (no hint that the user is "almost" allowed).
- [ ] The alias is registered once, and no admin route carries `auth:sanctum`.
- [ ] `routes/api.php` still passes `php artisan route:list` without duplicate route names.
- [ ] Pint reports no changes left to make.

## Done when

All four guard tests pass, `php artisan route:list --path=api/admin` shows the group with the
`admin` middleware, Pint is clean, the rule is recorded, the journal has an entry, and the work
is **left uncommitted**.
