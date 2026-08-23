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

---

## 2026-08-22 — Task 02: FE admin routing and guard

**Status:** done

**Shipped:**
- `resources/frontend/src/app/guards/admin.guard.ts` — `CanMatchFn`, resolves `true` only for a
  session with `isAdmin === true`; models `user.guard.ts` minus the redirect.
- `resources/frontend/src/app/admin.routes.ts` — index route loading `AdminHomeComponent`.
- `resources/frontend/src/app/pages/admin/home/admin-home.component.ts` (+ `.scss`, `.spec.ts`)
  — temporary landing page, **Task 05 deletes it**.
- `resources/frontend/src/app/app.routes.ts` — `/admin` entry (`canMatch: [adminGuard]`,
  `loadChildren` from `admin.routes`) added before the `**` wildcard.
- `resources/frontend/src/app/app.component.spec.ts` — new `describe("Admin routes")` block: 4
  cases (admin session, non-admin session, failing session request, non-admin on a nested
  `/admin/hirek` path).
- `resources/frontend/src/mocks/users/createGetSessionOkResponse.ts` — new factory mock
  (`isAdmin` defaults to `false`), matching the project's `create*OkResponse` convention.
  `getSessionOkResponse.json` was removed and every pre-existing spec that used it now calls
  `createGetSessionOkResponse()` instead (reviewer's follow-up, not scoped to this task, but
  keeps one canonical non-admin session mock instead of two).

**Decisions made while implementing:** none beyond the task file — followed it as written,
except the session mock (task file suggested inlining the admin body; used a factory instead,
per reviewer direction, to match the existing `create*OkResponse` pattern).

**Surprises / gotchas:**
- `admin.guard.spec.ts`, using the shared `testQueryClient` mock the same way every other
  guard/service spec does, passed in isolation but **deterministically failed** its 2nd and 3rd
  test in the full `npx ng test` run ("no request found" for the session fetch). Root cause:
  `testQueryClient` was a single mutable `QueryClient` object exported from a module shared
  across the whole bundled test run, so a concurrently running spec file's own
  `queryKeys.session` fetch could get deduped against this guard's `ensureQueryData` call before
  its own `HttpTestingController` ever saw a request. Fixed at the source (reviewer's change,
  not scoped to this task): `mocks/testQueryClient.ts` now exports an `InjectionToken<QueryClient>`
  with a factory and no explicit `providedIn` (defaults to `'root'`), and every
  `provideTanStackQuery(testQueryClient)` call site passes the token straight through —
  `provideTanStackQuery` accepts `QueryClient | InjectionToken<QueryClient>` for exactly this.
  Each test's TestBed root injector now lazily constructs and caches its own `QueryClient`
  instance, so there is no longer a cross-test/cross-file shared mutable instance to leak, and
  the old manual `testQueryClient.clear()` `beforeEach`/`afterEach` pair is gone. Verified with
  4 consecutive full-suite runs (316/316 each time).

**Verification:**
- `npx ng test` (full suite) → 316 passed, 64 files (run twice to confirm the fix wasn't luck)
- `npx eslint` on all changed/new files → clean (fixed 3 unnecessary type-assertion errors in
  the guard spec; the pre-existing 783 `ng lint` errors are all in `src/assets/tinymce` vendor
  files, unrelated)
- `npx tsc -p tsconfig.app.json` → clean
- `npx prettier . --check` → clean for every changed file (pre-existing warnings are vendored
  tinymce assets)
- `npx knip` → no new unused exports (pre-existing findings are tinymce-related, unrelated)

**Left uncommitted for review:** yes

**Next session should know:** `AdminHomeComponent` and `admin.routes.ts`'s single index route
are scaffolding — Task 05 deletes the component and replaces the index route with
`{ path: "", pathMatch: "full", redirectTo: "hirek" }` once the news grid lands. The
`app-admin-nav` links already point at future admin paths (`/admin/hirek`, `/admin/ajanlatok`,
etc.); until their routes exist they correctly 404 for everyone, admins included — expected
until later tasks build those screens.

---

## 2026-08-23 — Task 03: FE admin UI kit (confirm dialog, grid actions, rich text field, layout)

**Status:** done

**Shipped:**
- Step 0/D14 (done ahead of the rest, by the reviewer): confirmed Angular's `DomSanitizer`
  strips `style`, which TinyMCE uses for colour/font-size/alignment. Chose **(b) DOMPurify** —
  `dompurify` added as a new FE dependency (approved). All six public renderers of
  admin-authored HTML now sanitise with `DOMPurify.sanitize(...)` and pass the result through
  `sanitizer.bypassSecurityTrustHtml(...)` instead of `sanitizer.sanitize(SecurityContext.HTML, …)`:
  `pages/news-article`, `components/news-article-list-item`, `pages/knowledgebase-article`,
  `components/knowledgebase-article-list-item`, `pages/offer`, `components/offer-article-list-item`.
  `eslint.config.mjs` disables `sonarjs/no-angular-bypass-sanitization` for the project, since
  this is now the deliberate, consistent pattern rather than an isolated escape hatch. D14 in
  `00-overview.md` moved from "open question" to the settled decisions table.
- `shared/mixins.scss` — `zephyr-admin-main` (composes `zephyr-main`, caps at `$widescreen`).
- `app/components/confirm-dialog/confirm-dialog.component.ts` (+ `.html`, `.scss`, `.spec.ts`) —
  `ConfirmDialogComponent`, `MAT_DIALOG_DATA`-driven (`ConfirmDialogData`), `close(true)` on
  confirm / `close(false)` on cancel, confirm button `cdkFocusInitial` + `color="warn"`.
- `app/components/ag-grid/admin-actions-cell-renderer/admin-actions-cell-renderer.component.ts`
  (+ `.html`, `.scss`, `.spec.ts`) — `AdminActionsCellRendererComponent<TRow>`, renders the
  requested subset of `info`/`edit`/`email`/`delete` icon buttons in order, each with an
  `aria-label` built from a Hungarian default plus an optional `rowLabel(row)` suffix (e.g.
  `"Szerkesztés: Cím"`), calls `onAction(action, row)`.
- `shared/admin-grid.ts` — `adminGridModules`, `adminGridAutoSizeStrategy`,
  `adminPaginationPanels`, `adminGridLocaleText`, lifted from `pages/integra/integra.component.ts`.
- `app/components/rich-text-editor/rich-text-editor.component.ts` (+ `.html`, new `.spec.ts`) —
  added a required `field = input.required<FieldTree<string>>()`, forwarded to `<editor
  [formField]="field()" …>` so signal-forms' `FormField` directive can bind to it. Spec renders
  it inside a tiny inline host component with a real `form()` model; does not attempt to drive
  TinyMCE under jsdom.

**Decisions made while implementing:**
- `AdminActionsParams<TRow>` extends `ICellRendererParams<TRow>` and adds an optional
  `rowLabel?: (row: TRow) => string` (not in the task file's sketch) so aria-labels can include
  row identity generically across every future admin grid, instead of each grid re-deriving it.
- `ConfirmDialogComponent`'s spec opens the component through a real `TestBed.inject(MatDialog).open(...)`
  rather than rendering it standalone with a stubbed `MatDialogRef`: rendered outside the CDK
  dialog container, there is no `role="dialog"` and no `aria-labelledby` wiring, so the
  "accessible name" assertion the task calls for is only meaningful against the real overlay.
  This also meant dropping `provideNoopAnimations()`/`provideAnimations()` — both are deprecated
  in this Angular version (20.2, removal targeted for v23) — and `afterClosed().toPromise()` in
  favour of `firstValueFrom(dialogRef.afterClosed())`, also deprecated.

**Surprises / gotchas:**
- No spike database row was needed/left over — the reviewer verified the `style`-stripping
  behaviour by inspecting `DomSanitizer`'s allow-list and TinyMCE's output directly rather than
  inserting a row via tinker; confirmed via `database-query` that no `news` row matching a spike
  title exists, so there was nothing to delete.
- `knip` still flags `shared/admin-grid.ts` as unused (no page consumes it yet); `confirm-dialog`
  and `admin-actions-cell-renderer` are *not* flagged because their own specs import them. Per
  the task note, left as-is rather than adding a knip ignore — re-check when Task 05's grid lands.

**Verification:**
- `npx ng test` (full suite) → 325 passed, 67 files
- `npx tsc -p tsconfig.app.json` → clean
- `npx eslint src/app src/mocks src/shared` → clean
- `npx prettier . --check` → clean for every changed file (pre-existing warnings are vendored
  tinymce assets, unrelated)
- `npx knip` → only the expected `shared/admin-grid.ts` unused-file warning

**Left uncommitted for review:** yes

**Next session should know:** Task 05 (news grid) is the first real consumer of
`zephyr-admin-main`, `admin-grid.ts`, `ConfirmDialogComponent`, and
`AdminActionsCellRendererComponent` — re-run `npx knip` once it lands and confirm the
`admin-grid.ts` warning is gone. `RichTextEditorComponent` still has no page consumer either;
its `field` input is exercised only by its own spec until a form task binds it for real.
