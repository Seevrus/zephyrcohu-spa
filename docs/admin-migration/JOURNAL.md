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

## 2026-08-23 — Task 04: BE news admin API

**Status:** done

**Shipped:**
- `app/Http/Controllers/AdminNewsController.php` — `getNews`, `getNewsItem`, `storeNews`,
  `updateNews`, `deleteNews`, all wrapped in `try/catch (Throwable) { abort(500); }`, matching
  `NewsController`.
- `app/Http/Requests/StoreNewsRequest.php`, `UpdateNewsRequest.php` — identical rule sets (full
  replace on update, matching legacy behaviour).
- `app/Http/Resources/AdminNewsResource.php` — `readers`/`readerCount` included only when the
  `readers` relation is loaded (`relationLoaded('readers')`), sorted by email, to avoid N+1 and
  accidental lazy loads.
- `routes/api.php` — `admin/news` route group inside the existing `admin` middleware group;
  removed the `AdminPingController`/`GET /api/admin/ping` placeholder from Task 01.
- `tests/Feature/AdminNewsController/{GetAdminNewsTest,GetAdminNewsItemTest,StoreNewsTest,
  UpdateNewsTest,DeleteNewsTest}.php` — full CRUD + guard coverage per the task's test table.
- `tests/Feature/Admin/AdminGuardTest.php` — rewritten to hit `GET /api/admin/news` (200/404/404)
  and `PATCH /api/admin/news/1` for the 405 case.

**Decisions made while implementing:**
- `storeNews` returns `(new AdminNewsResource($news))->response()->setStatusCode(201)` rather
  than `response(new AdminNewsResource($news), 201)` — the latter does not go through
  `JsonResource::toResponse()`, so the response is not wrapped in `{"data": …}`. No existing
  controller in the codebase returns a resource with a non-default status code, so this is a new
  (but standard Laravel) pattern.
- `users_news.news_id` is already `cascadeOnDelete` (migration `2026_02_08_181423`), confirmed
  by both reading the migration and a passing test — no explicit pivot cleanup needed in
  `deleteNews`.

**Surprises / gotchas:**
- None — the task file's contract matched the codebase exactly (route shape, error codes,
  `published_at` sort field).

**Verification:**
- `php artisan test --compact --filter=AdminNews` → 23 passed
- `php artisan test --compact --filter=AdminGuardTest` → 4 passed
- `php artisan test --compact --filter=NewsController` → 37 passed (public endpoints untouched)
- `php artisan test --compact` (full suite) → 173 passed
- `vendor/bin/pint --dirty --format agent` → passed
- `php artisan route:list --path=api/admin` → five `admin/news` routes, ping route gone

**Left uncommitted for review:** yes

**Next session should know:** Task 05 (FE news admin grid) can now consume
`GET /api/admin/news` for real. The admin news response shape matches the task file's contract
exactly (`readerCount`/`readers` always present since `getNews`/`getNewsItem` always eager-load
`readers`).

## 2026-08-24 — Task 05: FE news admin grid

**Status:** done

**Shipped:**
- `types/admin-news.ts`, `app/services/admin-news.query.service.ts` — `getAdminNews`,
  `getAdminNewsItem`, `createAdminNews`, `updateAdminNews`, `deleteAdminNews`, following
  `news.query.service.ts`. Every mutation invalidates both `queryKeys.adminNews`/
  `adminNewsItem` and the public `queryKeys.news()`/`newsItem(id)`.
- `mocks/admin/news/{adminNewsRequest,createGetAdminNewsOkResponse,deleteAdminNewsRequest}.ts`.
- `app/pages/admin/news/admin-news.component.{ts,html,scss,spec.ts}` — the first real consumer
  of `admin-grid.ts`, `zephyrGridTheme`, `ConfirmDialogComponent`, and
  `AdminActionsCellRendererComponent`. Grid columns match the legacy order/labels; the date
  column gets a muted `cellClass` for a future `publishedAt`.
- `admin.routes.ts` — `/admin` now `redirectTo: "hirek"`; `/admin/hirek` lazy-loads
  `AdminNewsComponent`.
- Deleted `pages/admin/home/` (Task 02 scaffolding) and updated the Task 02 routing assertions
  in `app.component.spec.ts` accordingly.

**Decisions made while implementing:**
- Added an FE-only search box ("Keresés cím szerint") above the grid, filtering the already
  -fetched rows by title (case-insensitive `includes`), per explicit user request. Not part of
  the task file's original design; deliberately kept client-side only — server-side
  pagination/filtering is out of scope until the API needs it. `filteredNews()` is what feeds
  `[rowData]`, not the raw query data.
- Split the error state into `errorMessage` (the `getAdminNews` query error, gates the whole
  loading/empty/grid branch) and `deleteErrorMessage` (the delete mutation error, rendered above
  a still-visible grid). Collapsing both into one signal would have made the empty/error/loading
  branches non-exclusive, which the task's self-review explicitly checks for.
- `getAdminNews()` returns a plain `AdminNewsItem[]` (not a `{ data: … }` wrapper), matching the
  `LinksQueryService` precedent for a flat, non-function `queryKeys` entry.
- Removed `matchAdminNewsItemRequest` from the mocks file after writing it — `knip` flagged it
  as unused since nothing needs the single-item request matcher until Task 06's edit form. Re-add
  it there.

**Surprises / gotchas:**
- None — ag-grid's cell renderer components (the actions column, in particular) render and
  respond to `userEvent.click` fine under Vitest/jsdom with no extra setup, so the edit/delete
  action tests didn't need anything beyond the existing `admin-actions-cell-renderer` component.

**Verification:**
- `npx ng test` → 335 passed (67 files)
- `npx ng lint` → clean
- `npx tsc -p tsconfig.app.json` → clean
- `npx prettier . --check` → clean
- `npx knip` → clean

**Left uncommitted for review:** yes

**Next session should know:** Task 06 (news create/edit form) will need
`matchAdminNewsItemRequest` back in `mocks/admin/news/adminNewsRequest.ts`, and can reuse
`getAdminNewsItem`/`createAdminNews`/`updateAdminNews` from `AdminNewsQueryService` as-is — they
were built now but exercised only indirectly (via `getAdminNews`'s per-item cache seeding) since
this task doesn't need them directly.

## 2026-08-25 — Task 06: FE news create/edit form

**Status:** done

**Shipped:**
- `mappers/dates.ts` — `toApiDate(date: Date): string` (ISO `yyyy-MM-dd`, via `date-fns`
  `formatISO`), with a `dates.spec.ts` case.
- `mocks/admin/news/adminNewsRequest.ts` — re-added `matchAdminNewsItemRequest(id)` (removed by
  Task 05, flagged then to come back here).
- `mocks/admin/news/createAdminNewsRequest.ts` — `matchCreateAdminNewsRequest()` (POST) and
  `matchUpdateAdminNewsRequest(id)` (PUT).
- `mocks/admin/news/createGetAdminNewsItemOkResponse.ts` — single-item GET response factory,
  mirroring `createGetAdminNewsOkResponse`'s override-defaults shape.
- `app/validators/richTextRequiredValidator.ts` — custom signal-forms validator: strips HTML tags
  and trims before checking non-empty, so an "empty" TinyMCE value (e.g. `<p><br></p>`) still
  fails required.
- `app/pages/admin/news-form/admin-news-form.component.{ts,html,scss,spec.ts}` — one component
  for both `/admin/hirek/uj` (create) and `/admin/hirek/:id` (edit), signal forms
  (`form()`/`submit()`), `MatDatepickerModule` with `provideNativeDateAdapter()` +
  `MAT_DATE_LOCALE: "hu-HU"` scoped to the component's own `providers`. 8 spec cases per the task
  file's list.
- `admin.routes.ts` — added `hirek/uj` and `hirek/:id` (order matters, `uj` first).
- `app.component.spec.ts` — folded the "Admin routes" describe block into two `test.each` tables
  (admin → testId; non-admin → not-found) to satisfy `sonarjs/parameterized-tests`, and added the
  two new form routes to the admin table.

**Decisions made while implementing:**
- **Local form model diverges from `SaveAdminNewsRequest`.** `AdminNewsFormModel.publishedAt` is
  `Date | null` (bound straight to `MatDatepicker`, converted to the API's ISO string only at
  submit via `toApiDate`) and `additionalContent` is always `string` (never `null`), so it can
  bind to `app-rich-text-editor`'s `FieldTree<string>` input. `null` is reintroduced for
  `additionalContent` only when building the outgoing `SaveAdminNewsRequest` at submit time, if
  the trimmed value is empty — this is what the self-review's "sent as null, not empty string"
  bullet is checking.
- **Prefill uses `linkedSignal`'s two-argument (`source`/`computation`) form, not a plain
  computation.** The `computation` returns `previous.value` whenever `previous.source` is already
  defined, i.e. it only builds the form model from `data` the *first* time the query resolves; any
  later reference change to `newsItemQuery.data()` (a background refetch producing a new object
  with the same values) still re-triggers `computation`, but it returns the untouched `previous`
  value instead of rebuilding — so a refetch can never clobber what the admin is mid-typing.
  Chose this over an `effect()`-based approach because it keeps the writable model itself as the
  single source of truth for signal forms (an effect would need a second signal plus a guard
  condition against every field the admin touches).
- **Rich text fields are inside `<fieldset><legend>…</legend>` groups, not `<mat-form-field>`.**
  `app-rich-text-editor` wraps a raw TinyMCE `<editor>`, so a `<mat-label>` can't associate with
  it the way it does with `matInput`/`mat-select`. A `fieldset`/`legend` pair gives the group an
  accessible name without inventing a bespoke label pattern; the "required" error text under
  `mainContent` gets `role="alert"` so it's announced without a `mat-error`.
- **Date and rich text fields are set directly through the component instance in specs**
  (`fixture.componentInstance.newsForm.publishedAt().value.set(...)`), not driven via
  `userEvent`. `newsForm` is exposed as plain `readonly` (not `protected`) for this reason —
  matching `loginForm`/`updateProfileForm`'s existing precedent of public reactive forms reachable
  from specs, since a `protected` signal-forms field can't be accessed from a spec file at all
  under TypeScript's visibility rules. TinyMCE doesn't render a usable control under jsdom
  (established in `rich-text-editor.component.spec.ts`), and the Material datepicker's calendar
  overlay is comparably brittle to drive with `userEvent` under jsdom — both are test-hooked
  instead, consistent with the task file's guidance for the rich text field specifically.
- **`getError("required")` kind on the custom rich-text validator is literally `"required"`**
  (not a bespoke kind), so the template's error-lookup pattern stays identical to every other
  required field in the app.

**Surprises / gotchas:**
- Updating (or creating, once the admin list/news queries are cached) invalidates
  `queryKeys.adminNewsItem(id)`, and in edit mode this component's own `getAdminNewsItem(id)`
  query is still an *active* observer for that exact key — so a successful PUT triggers a second,
  automatic GET refetch of the same item before the component unmounts (`router.navigate` doesn't
  actually navigate under `provideRouter([])` in the test, so the component stays mounted and the
  query stays active). The edit-mode submit spec has to flush that follow-up GET too, or
  `httpTesting.verify()` fails on a dangling request. This is correct real-world behaviour (the
  admin would just see the row refresh before leaving the page), not a bug.
- `linkedSignal`'s two-argument form needed an explicit `linkedSignal<S, D>` type argument (or an
  explicit `computation` return type) — leaving it fully inferred made every downstream read of
  `newsModel()` widen to `unknown`, which then broke `form()`'s `schemaPath` typing entirely.
- `[formField]` on a `matInput` rejects a plain `maxlength` HTML attribute
  (`NG8022: Setting the 'maxlength' attribute is not allowed on nodes using the '[formField]'
  directive`) — length limits have to go through the schema (`maxLength(schemaPath.title, 255)`)
  instead, which also gets its own `mat-error` branch.

**Verification:**
- `npx ng test` → 348 passed (68 files)
- `npx ng lint` → clean
- `npx tsc -p tsconfig.app.json` → clean
- `npx prettier . --check` → clean
- `npx knip` → clean

**Left uncommitted for review:** yes

**Next session should know:** Task 06 is the explicitly-designated "pattern task" for Tasks 08
(offers) and 10 (knowledgebase) — reuse this component's shape (one component for create+edit,
`linkedSignal` prefill guard, `fieldset`/`legend` around each rich text field, form-model type
that diverges from the API request type for the datepicker/rich-text fields) rather than
re-deriving it.

**Follow-up fix (same session, still Task 06):** `hirek/uj` and `hirek/:id` are two separate
route entries loading the same component — that's the normal Angular pattern (a literal segment
always wins over a parameterized sibling), not a duplication smell. But `numericId` originally
did a bare `Number(id())`, so any `hirek/:id` match that *isn't* numeric (e.g. a typo like
`/admin/hirek/ujjjj`, which doesn't match the literal `hirek/uj` route and falls through to
`:id`) produced `NaN` — which is `!== undefined`, so the item query still ran and fired
`GET /admin/news/NaN`. Fixed: `numericId` now returns `undefined` for a non-integer id, and a new
`hasInvalidId` computed (route had an `:id` segment, but it didn't parse) drives a
`redirectOnInvalidIdEffect` that navigates back to `/admin/hirek` with `replaceUrl: true` —
mirroring `NewsArticleComponent`'s existing `redirectOnInvalidIdEffect`/`/hirek` redirect for the
public `hirek/:id` route, which the user pointed out was the more consistent choice than
inventing a separate error-card path for this one form. Added a regression spec asserting the
redirect happens and that no request is ever matched for `.../admin/news/NaN`. Verified again:
349 tests passed, lint/tsc/prettier/knip clean.

**Follow-up layout fix (same session, still Task 06):** the "Mégsem" cancel link rendered as a
plain unstyled `<a>` instead of a Material button — `MatButton` was never added to the
component's `imports`, so the `mat-button` attribute on `<a mat-button routerLink="...">` was
inert (compare `admin-news.component.ts`, which does import `MatButton` for its own
`<a mat-flat-button>`). Also widened/re-centered the form per feedback: the one-line fields
(audience/title/publishedAt) cap at 500px (matching the app's other forms), the two rich text
`fieldset`s cap at 1200px, and `.form-elements-container` itself is centered
(`margin: 0 auto; max-width: 1200px`) instead of sitting flush left. No behavioural change, no
new tests needed; full sweep re-verified: 349 tests, lint/tsc/prettier/knip clean.

**Follow-up: extracted the layout into a mixin (same session, still Task 06).** Per feedback that
Tasks 08/10 (offers, knowledgebase) will need the identical "short fields at 500px, rich text
fieldsets at 1200px, left-aligned except a centered 500px action row" shape, moved it out of
`admin-news-form.component.scss` into `shared/mixins.scss` as
`zephyr-admin-rich-text-form`, next to the existing `zephyr-grid`/`zephyr-admin-main` mixins.
Renamed the two component-scoped classes it targets to generic ones —
`.admin-news-form-field-error` → `.admin-form-field-error`, `.admin-news-form-actions` →
`.admin-form-actions` — so Tasks 08/10 can `@include mixins.zephyr-admin-rich-text-form;` and
reuse the same class names verbatim instead of re-deriving the rules. `.form-elements-container`
was already a shared class name (see `shared-register.form-layout`'s narrower forms), so it
carried over unchanged. Pure refactor, no behavioural/test change; full sweep re-verified: 349
tests, lint/tsc/prettier/knip clean.

**Follow-up fix: missing datepicker toggle icon (same session, still Task 06).** The calendar
icon on `mat-datepicker-toggle` wasn't rendering at all — not just mis-styled, absent from the
DOM. Cause: `matIconSuffix` on `<mat-datepicker-toggle matIconSuffix [for]="...">` is the
`MatSuffix` directive (`@angular/material/form-field`, selector
`[matSuffix], [matIconSuffix], [matTextSuffix]`), which was never added to the component's
`imports`. `MatFormField` projects prefix/suffix content by that marker; content not carrying it
isn't projected into the form field at all, so the toggle button silently disappeared instead of
just losing its positioning. Fixed by adding `MatSuffix` to `imports`. Verified the fix is real
(not just cosmetic) by reverting the import and re-running: the new spec assertion
(`getByRole("button", { name: "Open calendar" })`) failed RED with the import missing, passed
GREEN with it restored. Full sweep re-verified: 350 tests, lint/tsc/prettier/knip clean.
