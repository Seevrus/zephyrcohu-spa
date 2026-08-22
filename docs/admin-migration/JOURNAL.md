# Admin migration — development journal

Append one entry per finished task, newest at the bottom. Keep entries short but concrete:
a future session (possibly on a cheaper model, with no memory of this one) should be able to
resume from the last entry alone.

## Entry template

```markdown
## YYYY-MM-DD — Task NN: <title>

**Status:** done / partially done (what is missing) / blocked (by what)

**Shipped:**
- <file> — <what it does>

**Decisions made while implementing:**
- <decision + why>

**Surprises / gotchas:**
- <anything that cost time, or that contradicts the task file>

**Verification:**
- `php artisan test --compact --filter=…` → N passed
- `npx ng test` → N passed
- (lint / typecheck / prettier / knip / pint as applicable)

**Left uncommitted for review:** yes

**Next session should know:**
- <hand-off note>
```

---

## 2026-08-22 — Task 00: planning

**Status:** done

**Shipped:**
- `docs/admin-migration/00-overview.md` — decisions, conventions, full admin API surface, SPA
  route map, task index.
- `docs/admin-migration/01…27-*.md` — one file per task.
- `docs/admin-migration/JOURNAL.md` — this journal.

**Decisions made while planning:** see the decision table D1–D12 in the overview. The four that
were confirmed with the product owner: separate `/api/admin/*` namespace; "Dátum"/"Érvényes"
collapse into a single `publishedAt` labelled "Közzététel dátuma"; shared Material confirm
dialog instead of per-entity delete pages; both legacy cron scripts become Laravel schedules.

**Surprises / gotchas:**
- `links.link_category_id` shipped as NOT NULL with `cascadeOnDelete`, and
  `LinkController::getLinks` inner-joins `link_categories`. Confirmed with the product owner that
  this was an oversight while wiring up the link reads, not a decision: a category deletion would
  have silently deleted links. Task 13 Part A restores the legacy semantics — nullable column,
  `nullOnDelete`, left join, and a null category reading back as "Egyéb" (D8). "Egyéb" also
  becomes a reserved category name so the virtual group cannot collide with a real one.
- `users_newsletters` has no `sent_at`/attempt columns — the presence of a pivot row is the only
  "already sent" marker, which is exactly what the FE-governed sending loop needs (D6).
- The legacy admin stores rich text through `htmlspecialchars()`, so old content is
  HTML-escaped in the database. Nothing in the new SPA does that; the new admin stores the
  TinyMCE HTML as-is. Confirmed that no legacy data has been migrated yet, so this only matters
  for the import — Task 27 owns the entity-decode.
- The `api` rate limiter (60/min per user, applied group-wide by `throttleApi()`) would have
  broken the FE-governed newsletter loop for any list longer than 60 recipients. Fixed in the
  plan before implementation: dedicated `throttle:newsletter` limiter, the send route opts out of
  the global one, and the FE paces at ~1s and treats 429 as "retry this recipient" (D13).
- Angular's `DomSanitizer` strips `style` attributes, and TinyMCE emits them for colour, font size
  and alignment — so admin formatting would silently vanish on the public pages. This is **not
  resolved**: D14 in the overview is an open question, and Task 03 Step 0 is a blocking spike that
  measures what survives and picks between trimming the toolbar, adopting DOMPurify (new FE
  dependency, needs sign-off), or accepting the loss.
- The admin "generate password" action is a deliberate last-resort fallback, not an oversight
  (D15): self-service reset is the preferred route, and both the admin UI and the notification
  mail have to say so.
- The SPA is not deployed yet, so work goes straight to `main` and the admin nav linking to
  not-yet-built screens is acceptable during the migration.
- There are no model factories in this project; Pest feature tests insert rows with
  `DB::table(...)->insert(...)`.

**Verification:** none (planning only).

**Left uncommitted for review:** yes

**Next session should know:** start with Task 01; it unblocks every other backend task.

---

## 2026-08-22 — Task 01: BE admin guard (middleware + `/api/admin` group)

**Status:** done

**Shipped:**
- `app/Http/Middleware/EnsureUserIsAdmin.php` — resolves the user via `$request->user('sanctum')`,
  `abort(404)` for guests and non-admins (checks `User::admin()`).
- `bootstrap/app.php` — registers the `admin` middleware alias.
- `app/Http/Controllers/AdminPingController.php` — temporary, returns `{"data":"ok"}`.
- `routes/api.php` — `Route::prefix('admin')->middleware('admin')->group(...)` with `GET /ping`,
  appended at the end of the file.
- `tests/Feature/Admin/AdminGuardTest.php` — 4 guard tests (guest 404, non-admin 404, admin 200,
  wrong method 405).
- `.ai/rules/routes.md` — recorded rule via Boost `record-rule`.

**Decisions made while implementing:** none beyond the task file — followed it as written.

**Surprises / gotchas:**
- Found and fixed a **pre-existing bug** in `bootstrap/app.php`: the 405 exception renderer was
  registered against `Symfony\Component\Routing\Exception\MethodNotAllowedException`, but
  Laravel's router actually throws `Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException`
  (which extends `HttpException`, not the routing-component class). The renderer never matched,
  so every wrong-method request in the whole app — not just admin — fell through to the generic
  `HttpException` handler and returned 500 `INTERNAL_SERVER_ERROR` instead of 405
  `GENERIC_METHOD_NOT_ALLOWED`. Fixed the import/type in the same file already in scope for this
  task. Verified with the full test suite (150 passed) that nothing relied on the old (broken)
  behaviour.

**Verification:**
- `php artisan test --compact --filter=AdminGuardTest` → 4 passed
- `php artisan test --compact` (full suite) → 150 passed
- `vendor/bin/pint --dirty --format agent` → passed
- `php artisan route:list --path=api/admin -v` → shows `admin` middleware, no `auth:sanctum`
- `php artisan route:list` → no duplicate route names

**Left uncommitted for review:** yes

**Next session should know:** `AdminPingController` and the `/api/admin/ping` route are
temporary. Task 04 removes them and rewrites `AdminGuardTest` to exercise
`GET /api/admin/news` instead.
