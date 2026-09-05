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

## 2026-08-27 — Task 07: BE offers admin API

**Status:** done

**Shipped:**
- `app/Http/Controllers/AdminOfferController.php` — `getOffers`, `getOfferItem`, `storeOffer`,
  `updateOffer`, `deleteOffer`, straight copy of `AdminNewsController`'s shape minus everything
  about readers (offers have no readers relation).
- `app/Http/Requests/StoreOfferRequest.php`, `UpdateOfferRequest.php` — identical rule set to the
  news requests (`audience` in `A,P`, `title` required/max 255, `mainContent` required,
  `additionalContent` nullable, `publishedAt` required date).
- `app/Http/Resources/AdminOfferResource.php` — same shape as `AdminNewsResource` minus the
  reader fields.
- `routes/api.php` — `admin/offers` route group added inside the existing `admin` middleware
  group, right after `admin/news`.
- `tests/Feature/AdminOfferController/{GetAdminOffersTest,GetAdminOfferItemTest,StoreOfferTest,
  UpdateOfferTest,DeleteOfferTest}.php` — full CRUD + guard coverage per the task's test table.

**Decisions made while implementing:** none beyond the task file — followed Task 04's pattern
step-for-step as instructed, dropping readers entirely (no `with('readers')`, no
`readerCount`/`readers` keys, no `users_offers` pivot to worry about on delete).

**Surprises / gotchas:** none — the task file's contract matched the codebase exactly, and
`Offer`'s `published`/`unpublished` scope wasn't even needed since the admin list intentionally
bypasses it (`Offer::orderBy('published_at', 'desc')->get()`, no `published()` scope, to include
unpublished offers).

**Verification:**
- `php artisan test --compact --filter=AdminOffer` → 22 passed
- `php artisan test --compact --filter=OfferController` → 34 passed (public endpoints untouched)
- `php artisan test --compact` (full suite) → 195 passed
- `vendor/bin/pint --dirty --format agent` → passed
- `php artisan route:list --path=api/admin` → five new `admin/offers` routes alongside the
  existing five `admin/news` routes

**Left uncommitted for review:** yes

**Next session should know:** Task 08 (FE offers admin grid + form) can now consume
`/api/admin/offers` for real, and per Task 06's journal note should reuse
`AdminNewsFormComponent`'s shape (one component for create+edit, `linkedSignal` prefill guard,
`fieldset`/`legend` around each rich text field, `zephyr-admin-rich-text-form` mixin) rather than
re-deriving it.

## 2026-08-27 — Bug fix (cross-cutting, found while closing Task 07): PUT/DELETE from the admin UI returned 500

**Status:** done

**Symptom (user-reported):** editing or deleting a news item through the real UI returned
`500 INTERNAL_SERVER_ERROR`, even though `AdminNewsController`'s update/delete tests all passed
and manually updating/deleting the row via `App\Models\News` in tinker worked fine — proving the
bug was in the HTTP layer, not the controller/model.

**Root cause:** `resources/frontend/src/app/services/xsrfInterceptor.ts` only attached the
`X-XSRF-TOKEN` header when `request.method === "POST"` — a pre-existing bug dating back to the
very first CORS-wiring commit (`98b74ea`), never hit before because every previous state-changing
endpoint in the app was `POST`-only (login, register, profile update, etc.). Task 04/06/07 were
the first to add real `PUT`/`DELETE` admin endpoints, which exposed it: those requests went out
with no CSRF token, Sanctum's stateful-API CSRF check (`statefulApi()` in `bootstrap/app.php`)
threw `TokenMismatchException`, Laravel's exception handler converts that into an `HttpException`
with status 419 — but `bootstrap/app.php`'s exception config only special-cases specific
`HttpException` subtypes/statuses (400/401/403/404/405/415/423/429) and renders **every other**
`HttpException`, 419 included, through the generic `ErrorHandling::internal_Server_error()`
handler. So a routine CSRF-token omission surfaced as an opaque 500 with no server-side log entry
(the controller's own `catch (Throwable) { abort(500); }` never even ran — the failure happened
in middleware, before the controller).

**Fix:** `xsrfInterceptor.ts` now checks `STATE_CHANGING_METHODS.has(request.method)`
(`POST`/`PUT`/`PATCH`/`DELETE`) instead of `=== "POST"`. Backend untouched — the 419→500 masking
is existing, deliberate-looking app convention (every other unmapped `HttpException` falls
through the same generic handler) and out of scope for this fix.

**Verification:**
- Added `xsrfInterceptor.spec.ts` (none existed before): confirmed RED first — `PUT`/`PATCH`/
  `DELETE` requests came through with no `X-XSRF-TOKEN` header while `POST` already had it; fixed
  the method check, re-ran GREEN for all four plus a `GET` case (asserts the header is *absent*,
  matching the existing safe-method exclusion).
- `npx ng test` → 355 passed (69 files)
- `npx ng lint` / `npx tsc -p tsconfig.app.json` / `npx prettier . --check` / `npx knip` → clean

**Left uncommitted for review:** yes

**Next session should know:** this bug affected every current and future admin `PUT`/`DELETE`
endpoint identically (news, and by the same code path, offers once Task 08 ships a form for them)
— it is fixed at the interceptor level, so no per-feature workaround is needed. If a 500 with no
matching server log entry turns up again, suspect the same 419-masking path before assuming the
controller is at fault.

## 2026-08-27 — Task 08: FE offers admin grid + form

**Status:** done

**Shipped:**
- `types/admin-offers.ts` — `AdminOfferResponse` is a plain re-export of the existing public
  `OfferResponse` (field-for-field identical, per the task's guidance), plus `AdminOfferItem`
  (`Date`-typed timestamps), `AdminOfferCollectionResponse`/`AdminOfferItemResponse`, and
  `SaveAdminOfferRequest`. `types/offers.ts` itself untouched.
- `app/services/admin-offers.query.service.ts` — `AdminOffersQueryService`, a straight copy of
  `AdminNewsQueryService`'s shape (`getAdminOffers`, `getAdminOfferItem`, `createAdminOffer`,
  `updateAdminOffer`, `deleteAdminOffer`). Every mutation invalidates both the admin keys and the
  public `queryKeys.offers()`/`offerItem(id)`.
- `services/queryKeys.ts` — added `adminOffers`/`adminOfferItem`/`createAdminOffer`/
  `updateAdminOffer`/`deleteAdminOffer` keys alongside the existing news ones.
- `mocks/admin/offers/{adminOffersRequest,createGetAdminOffersOkResponse,
  createGetAdminOfferItemOkResponse,saveAdminOfferRequest,deleteAdminOfferRequest}.ts` — same
  shape as the news mocks.
- `app/pages/admin/offers/admin-offers.component.{ts,html,scss,spec.ts}` — the offers grid.
  Columns per the task's table (`Kiknek szól`/`Cím`/`Közzététel dátuma`/`Kezelés`, no readers
  columns). No search box — the task's design section doesn't call for one on this grid, unlike
  Task 05's news grid where it was an explicit user add-on.
- `app/pages/admin/offer-form/admin-offer-form.component.{ts,html,scss,spec.ts}` — the offers
  create/edit form, a direct copy of `AdminNewsFormComponent`'s final shape (post all of Task 06's
  follow-up fixes): `linkedSignal` prefill guard, `fieldset`/`legend` rich text groups, the
  `redirectOnInvalidIdEffect` + `numericId` `Number.isInteger` guard for a non-numeric `:id`, and
  `MatSuffix` imported from the start (the datepicker-toggle bug Task 06 hit mid-session doesn't
  recur here). Uses the `zephyr-admin-rich-text-form` mixin as-is — no new mixin needed.
- `admin.routes.ts` — added `ajanlatok`, `ajanlatok/uj` (before `ajanlatok/:id`), `ajanlatok/:id`.
- `app.component.spec.ts` — extended both `test.each` tables in the "Admin routes" describe block
  with the three new offers paths.

**Decisions made while implementing:** none beyond the task file — this was explicitly the
"apply the pattern task" case (Task 06 for the form, Task 05 for the grid minus readers), and the
task file's own design section fully specified the deltas (no readers, different route segment,
different Hungarian copy). Followed it directly rather than re-deriving anything.

**Surprises / gotchas:** none in this task itself — but see the cross-cutting bug fix entry
directly above: the CSRF/`xsrfInterceptor` bug found while closing Task 07 would have hit this
form's update/delete just as hard had it not already been fixed at the interceptor level.

**Verification:**
- `npx ng test` → 377 passed (71 files), all green on the first run (no red/green cycle needed
  beyond the individual spec files' own TDD)
- `npx ng lint` → clean
- `npx tsc -p tsconfig.app.json` → clean
- `npx prettier . --check` → clean
- `npx knip` → clean

**Left uncommitted for review:** yes

**Next session should know:** Task 09/10 (knowledgebase admin API + FE) is next; it has *more*
surface than offers (readers-equivalent tag sync per D7), so it's closer to Task 04/06's shape
than Task 07/08's. Tasks 05/06/08 together are now the reference trio for any future
content-entity admin screen (grid + create/edit form).

**Follow-up (same session, still Task 08): added the title search box to the offers grid.** Task
08's own design section didn't call for one (unlike Task 05's news grid, where it was an explicit
user add-on), but the user asked for parity — "similarly to news - and kb will be the same".
Ported `AdminNewsComponent`'s exact pattern into `AdminOffersComponent`: a `searchTerm` signal, a
`toObservable`/`toSignal`+`debounceTime(SEARCH_DEBOUNCE_MS)` debounced signal, and a
`filteredOffers` computed that title-filters case-insensitively; `[rowData]` now binds to
`filteredOffers()` instead of the raw query data. Added the two matching spec cases (filters
case-insensitively; debounces instead of re-filtering every keystroke). This is now duplicated
verbatim across two grid components — noted for Task 10: if the knowledgebase grid needs the same
box a third time (the user's "kb will be the same" suggests it will), that's the point to extract
a shared debounced-search helper instead of copying a third time.

**Verification:** `npx ng test` → 379 passed (71 files); lint/tsc/prettier/knip → clean.

**Left uncommitted for review:** yes

## 2026-08-28 — Task 09: BE knowledgebase admin API

**Status:** done

**Shipped:**
- `app/Http/Controllers/AdminKnowledgebaseController.php` — full CRUD, mirrors
  `AdminNewsController`/`AdminOfferController`, plus a private `syncTags(Knowledgebase, array)`
  helper shared by store/update: trims, filters blanks, de-dupes, `Tag::firstOrCreate`s each name,
  then `$knowledgebase->tags()->sync($tagIds)` — all inside `DB::transaction`.
- `app/Http/Requests/StoreKnowledgebaseRequest.php`, `UpdateKnowledgebaseRequest.php` — same
  rules as news/offers plus `tags` (`array`) / `tags.*` (`string`, `max:255`).
- `app/Http/Resources/AdminKnowledgebaseResource.php` — same shape as `AdminNewsResource` plus an
  always-present `tags` key via `TagResource::collection($this->whenLoaded('tags'))`. Reused the
  existing `TagResource` unchanged, per D7/self-review — no second tag resource.
- `routes/api.php` — added `AdminKnowledgebaseController` import and an `admin/knowledgebase`
  route group inside the existing `admin` middleware group, after `admin/offers`.
- `tests/Feature/AdminKnowledgebaseController/{GetAdminKnowledgebaseTest,GetAdminKnowledgebaseItemTest,StoreKnowledgebaseTest,UpdateKnowledgebaseTest,DeleteKnowledgebaseTest}.php`
  — full CRUD + tag-sync + guard coverage, seeded via `DB::table(...)->insert(...)`.

**Decisions made while implementing:**
- Extracted the `firstOrCreate` + `sync` block from the task file into `syncTags()` instead of
  duplicating it across store and update — it's byte-for-byte identical in both per the task's
  own contract, so inlining twice would just be copy-paste risk.
- `AdminKnowledgebaseResource`'s `tags` key uses `whenLoaded` (not a bare `->tags` access) so the
  key still resolves correctly for the store/update responses, which explicitly `load(['tags',
  'readers'])` before serialising — kept consistent with the `readers` key's existing
  `relationLoaded` guard pattern from `AdminNewsResource`.

**Surprises / gotchas:**
- `TagResource`'s `count` key uses `whenCounted`, which resolves to Laravel's `MissingValue` and
  is dropped from the JSON entirely when not counted (not serialised as `null`) — the list/item
  responses here never `withCount`, so `assertExactJson` expects `{id, name}` only, no `count`
  key. Caught this before it caused a spurious RED.
- An empty-string entry in a `tags` array (`['INTEGRA', ''])`) unexpectedly 422s: Laravel's
  `ConvertEmptyStringsToNull` middleware turns `''` into `null` in the request body before
  validation runs, which then fails the `string` rule on `tags.*`. Not a bug — the FE never
  submits blank tag entries — so the "trims and de-duplicates" test uses two non-empty
  duplicate/whitespace variants instead, which is what that behaviour actually needs to prove.

**Verification:**
- `php artisan test --compact --filter=AdminKnowledgebase` → 27 passed (73 assertions)
- `php artisan test --compact --filter=KnowledgebaseController` → 48 passed (116 assertions,
  public endpoints unaffected)
- `php artisan test --compact` (full suite) → 222 passed (514 assertions)
- `vendor/bin/pint --dirty --format agent` → clean

**Left uncommitted for review:** yes

**Next session should know:**
- Task 10 (FE knowledgebase admin grid + form) is next, following Task 08's (offers) pattern —
  including the debounced title-search box (see the Task 08 follow-up entry above: this is the
  third occurrence, the flagged point to extract a shared debounced-search helper instead of
  copying a third time), plus a tags multi-select/chip input the news/offers forms didn't need.

## 2026-08-28 — Task 10: FE knowledgebase admin grid + form

**Status:** done

**Shipped:**
- `types/admin-knowledgebase.ts`, `app/services/admin-knowledgebase.query.service.ts`,
  `queryKeys.ts` additions — mirror the offers/news pattern, plus a `tags` field on the item type
  and `SaveAdminKnowledgebaseRequest`.
- `mocks/admin/knowledgebase/*` — list/item matchers, OK-response builders, delete/save matchers,
  mirroring the news/offers mock shape.
- `pages/admin/knowledgebase/admin-knowledgebase.component.*` — grid with the third occurrence of
  the debounced title-search box (see Task 08's follow-up note above — this is the flagged
  trigger point, noted below rather than acted on), a "Címkék" column (`TagResponse[]`, formatted
  sorted-and-joined), and readers/reader-count columns like the news grid. Header adds a
  "Címkék kezelése" link to `/admin/tudasbazis/cimkek`, which has no route yet — Task 12 fills
  that slot; until then it 302-redirects back to the grid via the same invalid-`:id` guard the
  form already has, matching the "nav links 404/redirect until their task lands" convention.
- `pages/admin/knowledgebase-form/admin-knowledgebase-form.component.*` — mirrors
  `AdminNewsFormComponent`, plus a `mat-chip-grid` + `mat-autocomplete` tag input. `tags: string[]`
  lives in the same signal-forms model as the other fields, but chip add/remove reads and writes
  the field's `.value` signal directly (`knowledgebaseForm.tags().value.set(...)`) rather than
  through a `[formField]` binding — signal forms has no native adapter for a chip-grid control,
  and this keeps the array in the same model the rest of the form already uses (submit just reads
  `this.knowledgebaseModel().tags`). The tag list itself is loaded via the **public**
  `KnowledgebaseQueryService.getKnowledgebaseTags()` / `queryKeys.knowledgebaseTags`, per the task
  file — no new admin endpoint.
- `admin.routes.ts` — `tudasbazis`, `tudasbazis/uj`, `tudasbazis/:id` (in that order; `cimkek`'s
  slot deliberately left open for Task 12, ahead of `:id` when it lands).
- `app.component.spec.ts` — extended both "Admin routes" tables with the three new paths.

**Decisions made while implementing:**
- Tag chip removal doesn't need a custom Backspace/Delete handler — `MatChipRow` already calls
  `remove()` (which emits `(removed)`) on Backspace/Delete when a chip has keyboard focus; wiring
  `(removed)="onTagRemoved(tag)"` was enough to get keyboard removal for free, on top of the
  explicit `matChipRemove` button per the task's design.

**Surprises / gotchas:**
- `MatChipInput`'s "Enter ends a chip" detection reads the deprecated `KeyboardEvent.keyCode`
  (`_isSeparatorKey` in `@angular/material/chips`), but `@testing-library/user-event`'s `{enter}`
  syntax deliberately omits that property — so `user.type(input, "name{enter}")` silently does
  nothing to the chip grid under jsdom. Fixed in the specs with a small
  `typeTagAndPressEnter()` helper: `user.type` for the text, then a plain
  `fireEvent.keyDown(input, { key: "Enter", keyCode: 13 })` for the Enter itself. Cost real time
  to isolate (looked first like the app's `addTag()` logic was broken, then like a signal-forms
  array-field limitation) — worth remembering if a later task (or Task 12/14's own chip inputs, if
  any) hits the same silent no-op.
- Initially set `[matChipInputSeparatorKeyCodes]="[]"` on the tag input thinking it was inert
  without an explicit value; it isn't — Material's own default is `[ENTER]`, and passing `[]`
  overrides that default and disables Enter entirely. Removed the binding so the default applies.
- Every knowledgebase mutation invalidates `queryKeys.knowledgebaseTags` (self-review requirement)
  as well as the admin/public list and item keys — since the form's own tag-autocomplete query is
  an active observer for that key, every successful create/update triggers an extra tags refetch
  the specs have to flush, same shape as the existing item-requery pattern from the news/offers
  forms.

**Verification:**
- `npx ng test` → 409 passed (73 files)
- `npx ng lint` → clean (3 pre-existing `sonarjs/deprecation` errors in `guards/*.ts` are
  unrelated to this task, confirmed via `git status` — not touched)
- `npx tsc -p tsconfig.app.json` → clean
- `npx prettier . --check` → clean
- `npx knip` → clean

**Left uncommitted for review:** yes

**Next session should know:**
- Task 11 (BE tags admin API) is next. It also unblocks Task 12 (FE tags admin page), which is
  the point to finally fill in `/admin/tudasbazis/cimkek` — until then the "Címkék kezelése" link
  added by this task redirects back to the grid instead of 404ing, since it hits the form route's
  existing invalid-id guard rather than a true unmatched route.
- Three grids now duplicate the debounced-search-box signal trio verbatim (news, offers,
  knowledgebase). Still deferring the extraction per the Task 08 follow-up note — worth doing
  before a fourth admin grid needs it.

**Follow-up (same session, still Task 10): the "unpublished row" cell class was dead CSS for
offers and knowledgebase.** The user asked what `admin-knowledgebase-unpublished` (applied by the
grid's `cellClass` to a future-dated `publishedAt` cell) actually does — turned out only
`admin-news-unpublished` had a matching rule in `ag-grid-overrides.scss`; `admin-offers-unpublished`
(pre-existing, from Task 08) and the new `admin-knowledgebase-unpublished` were classes applied to
the DOM with no style behind them. Generalised to one shared `.admin-grid-unpublished` rule and
pointed all three grids' `cellClass` at it instead of a per-entity class name.

**Verification:** `npx ng test` → 409/410 passed — the one failure
(`App Component > Profile Component > redirects to a guard page if the user is not logged in`) is
a **pre-existing flake**, confirmed by stashing all of this session's changes (tracked and
untracked) and reproducing the same failure on unmodified `HEAD` (`bb075ce`); not caused by this
fix. lint/tsc/prettier/knip → clean.

**Left uncommitted for review:** yes

**Follow-up (same session): root-caused and fixed the pre-existing `app.component.spec.ts` flake
noted above.** The user asked what was wrong with the failing "redirects to a guard page" test.
Root cause: `mocks/testQueryClient.ts`'s `QueryClient` never set `staleTime`, unlike the real
app's client (`app.config.ts`, `staleTime: 30 * 60 * 1000`). `/profil` with no session runs
`userGuard` (fetches `queryKeys.session`, sees none, redirects to `/regisztracio_szukseges`) →
that route is itself guarded by `guestGuard`, which reads the **same** `queryKeys.session` key
again. With the default `staleTime: 0` the test client had, that second read was already stale by
the time it ran, so it silently refetched — a second, unflushed `GET /users/session` the test
never resolves, hanging `guestGuard`'s `await` forever and timing out `findByTestId`. Not a race
that "usually" passes; every affected test run hit it deterministically once triggered (confirmed
by 4 consecutive clean reruns after the fix, and by reproducing the hang on unmodified `HEAD`
before it). Fixed by giving `testQueryClient` the same `staleTime` as production, with a comment
explaining why — a one-line change that also protects any other current or future guard chain
that reads the same query key more than once per navigation.

**Verification:** `npx ng test` → 410/410 passed, `app.component.spec.ts` reran clean 4x in a row;
lint/tsc/prettier/knip → clean.

**Left uncommitted for review:** yes

**Follow-up (same session): admin edit-form page titles were generic, unlike the matching public
`:id` pages.** The user pointed out that `/admin/hirek/:id`, `/admin/ajanlatok/:id` and
`/admin/tudasbazis/:id` always show the route-level static title (e.g. "Admin - Hír szerkesztése -
Zephyr Bt.") even once the item has loaded, whereas the public article pages
(`NewsArticleComponent`, `OfferComponent`, `KnowledgebaseArticleComponent`) overwrite the tab
title with the specific item title via a `Title.setTitle` effect once their query resolves.
Mirrored that pattern — plus the breadcrumb half, which the admin section hadn't been using at
all — in all three admin form components: a `pageTitleEffect` reads the loaded item's `title`
and, once present, calls both `breadcrumbService.setBreadcrumb()` with the old generic label now
carrying the specific title (e.g. `Admin - Hír szerkesztése - ${title}`) and `titleService.setTitle()`
with just `${title} - Zephyr Bt.` — same split the public article pages use, tab title kept to the
item's own name, the section/action context demoted to the breadcrumb. Create mode (no id, no
query) is untouched, so it still shows the plain route title.

**Verification:** `npx ng test` → 413/413 passed (3 title/breadcrumb-effect tests, one per admin
form; one unrelated pre-existing flake in `news.component.spec.ts` reran clean); lint/tsc/prettier/
knip → clean.

**Left uncommitted for review:** yes

## Task 11 — BE: tags admin API

List/rename/delete knowledgebase tags, mirroring `AdminOfferController`'s structure. No create
endpoint — tags are only ever created implicitly by Task 09's article save (`firstOrCreate`).

- `AdminTagController::getTags` — `Tag::withCount('knowledgebase')->orderBy('tag_name')->get()`,
  returned through the existing `TagResource` unchanged (`whenCounted('knowledgebase')` picked up
  `knowledgebase_count` from `withCount('knowledgebase')` exactly as the task file expected — no
  workaround needed).
- `AdminTagController::updateTag` — `UpdateTagRequest` validates `name` with
  `Rule::unique('tags', 'tag_name')->ignore($this->route('tag'))` (route-model-bound `Tag`), so
  renaming a tag to its own current name succeeds while a collision with another tag's name 422s.
  The controller reloads the count (`loadCount('knowledgebase')`) before responding so the updated
  resource still carries an accurate `count`.
- `AdminTagController::deleteTag` — plain `$tag->delete()`; `knowledgebase_tags` rows cascade via
  the existing FK, articles are untouched (asserted directly in the test).
- Route group added to the `admin` middleware block in `routes/api.php`, after `offers`, matching
  the task's contract exactly.
- Three new Pest files under `tests/Feature/AdminTagController/`: `GetAdminTagsTest`,
  `UpdateTagTest`, `DeleteTagTest` — alphabetical ordering, zero-count tag, rename-to-self,
  duplicate-name 422, pivot/article survival on delete, and the standard three guard cases per
  endpoint (guest 404, non-admin 404, admin success).

**Verification:** `php artisan test --compact --filter=AdminTag` → 14/14 passed;
`--filter=GetKnowledgebaseTags` (public tag cloud) → 4/4 passed, unaffected;
`--filter=AdminOffer` and `--filter=AdminKnowledgebase` reran clean too; `vendor/bin/pint --dirty
--format agent` → clean.

**Left uncommitted for review:** yes

## Task 12 — FE: tags admin page

`/admin/tudasbazis/cimkek` — a grid of knowledgebase tags with inline rename and delete, no
create screen. Route registered *before* `tudasbazis/:id` in `admin.routes.ts` (proven by an
`app.component.spec.ts` case).

- `RenameDialogComponent` (`components/rename-dialog/`) — generic single-text-field dialog, no
  tag wording baked in (Task 15 reuses it for link categories). Data contract: `title`, `label`,
  `initialValue`, optional `confirmLabel`/`cancelLabel`/`errorMessage`. A signal form with one
  `required` field; Save is disabled while invalid; submitting the `<form>` (click or Enter)
  closes the dialog with the trimmed value, Cancel/Escape close it with `undefined` — mirroring
  `ConfirmDialogComponent`'s boolean-or-undefined contract.
- **Deviation from the task file:** the task says a 422 "shows the message inside the dialog and
  keeps it open." The dialog itself stays deliberately dumb (no HTTP knowledge, so it can stay
  generic) — the actual mutation runs in `AdminTagsComponent`, fired from
  `dialogRef.afterClosed()`, the same fire-and-forget `.mutate()` pattern every other admin grid
  in this codebase uses. On a 422 the component **reopens** the same dialog with the just-typed
  value as `initialValue` and the duplicate-name message as `errorMessage`, so the visible result
  (same field, same typed text, error shown) matches the spec's intent without the dialog owning
  an async save. This wasn't a style preference: an earlier version had the dialog `await` a
  caller-supplied `save(value): Promise<void>` and stay open across it, which under zoneless CD
  hit `NG0101: ApplicationRef.tick is called recursively` intermittently (roughly 1-in-3 runs) —
  two components each independently reacting to the same TanStack mutation signals inside one
  user-event click. The close/reopen redesign removed the second async layer and the crash with
  it (5/5 clean reruns after).
- **jsdom gotcha, not a bug:** `user.type()` into the dialog's field is unreliable when the
  dialog is opened through the real `MatDialog` overlay — the CDK focus trap moves focus
  asynchronously after open, jsdom has no layout so the trap's tabbable check finds nothing and
  focus lands on the dialog container instead of the input, and keystrokes typed after that are
  lost (this is what looked like flaky mid-word truncation while writing the tests). Two fixes
  landed: `rename-dialog.component.spec.ts` renders the component directly (no `MatDialog.open`,
  no overlay, no focus trap) to test typing/trim/Enter/Escape behaviour for real; the outer
  `admin-tags.component.spec.ts`, which does open the real dialog, fills the field with a single
  `fireEvent.input(...)` instead of `user.type()` — one event, no focus dependency. Both files
  say why in a comment so the next session doesn't "fix" the workaround back into the bug.
- `AdminTagsComponent` — `ag-grid` with three columns (Címke/wrap, Cikkek száma/numeric, Kezelés).
  Empty state "Még nincsenek címkék.", `<h1>Tudásbázis címkék</h1>`. Delete uses the shared
  `ConfirmDialogComponent`, with the "N cikkről kerül eltávolításra" warning only when
  `count > 0`. Two error banners: `deleteErrorMessage` (unchanged pattern) and
  `renameErrorMessage`, which only surfaces non-422 mutation failures — a 422 is absorbed by the
  dialog-reopen path above, never the banner.
- `AdminTagsQueryService` — `getAdminTags()`, `updateAdminTag()`, `deleteAdminTag()`; both
  mutations invalidate `queryKeys.adminTags`, the public `queryKeys.knowledgebaseTags`, and
  `queryKeys.knowledgebase()` (article payloads embed tags), per the task's contract.
- `types/admin-tags.ts` stayed a flat `AdminTagResponse` (no `AdminTagItem`/date-mapping split
  like offers/knowledgebase) — tags have no date fields, so the extra alias would have been
  pure ceremony.

**Verification:** `npx ng test` → 436/436 passed, reran 5x in a row clean (0 unhandled errors,
confirming the `NG0101` flake above is gone); `npx ng lint`, `npx tsc -p tsconfig.app.json`,
`npx prettier . --check`, `npx knip` → all clean. No backend files touched.

**Left uncommitted for review:** yes

**Follow-up (same session): the admin tags page went stale after a knowledgebase article's tags
changed.** Reported by the user directly. Cause: `AdminKnowledgebaseQueryService`'s
`invalidateKnowledgebaseQueries()` (shared by create/update/delete) invalidated
`adminKnowledgebase`, `knowledgebase()` and the public `knowledgebaseTags`, but never
`queryKeys.adminTags` — so creating a new tag on an article, or changing an article's tag set,
left the admin tags grid's counts (and its list, for a brand-new tag) stale until a hard reload.
Fixed with a one-line addition to that same private method, so all three mutations pick it up.
Added `queryKeys.adminTags` assertions to the existing create/update invalidation checks in
`admin-knowledgebase-form.component.spec.ts` (seeding the key with `setQueryData` first, same as
the two pre-existing assertions there — `invalidateQueries` only marks a state that already
exists in the cache, so an unseeded key's `getQueryState()` stays `undefined` rather than
`{ isInvalidated: true }`, which is what the first attempt at this test got wrong). Delete's own
spec still doesn't assert invalidation, matching the pre-existing convention (offers/news do the
same) — not something this fix changed.

**Verification:** `npx ng test` → 436/436 passed, reran 3x clean; `npx ng lint`, `npx tsc -p
tsconfig.app.json`, `npx prettier . --check`, `npx knip` → all clean.

**Left uncommitted for review:** yes

## 2026-09-05 — Task 13: link category fallback + links admin API

**Status:** done

**Shipped (Part A — the "Egyéb" fallback, decision D8):**
- `database/migrations/2026_09_05_064538_update_links_table.php` — drops the NOT NULL +
  `cascadeOnDelete` FK on `links.link_category_id`, replaces it with nullable +
  `nullOnDelete`. `down()` deletes any link left with a null category before restoring the
  original constraint, with a comment explaining the lossiness.
- `app/Models/Link.php` — `UNCATEGORISED_NAME = 'Egyéb'` constant.
- `app/Http/Controllers/LinkController.php` — inner join → left join, sort by
  `COALESCE(link_categories.category_name, 'Egyéb')` then title.
- `app/Http/Resources/LinkResource.php` — `$this->category?->category_name ?? Link::UNCATEGORISED_NAME`
  instead of `whenLoaded` (which would fatal dereferencing a null category).
- `tests/Feature/LinkController/GetLinksTest.php` — added a null-category case (returned, not
  dropped, sorts alphabetically among real categories) and a `nullOnDelete` regression test
  (deleting a `link_categories` row via `DB::table(...)->delete()` leaves its links in place
  with a null `link_category_id`).

**Shipped (Part B — admin API):**
- `app/Http/Controllers/AdminLinkController.php` — full CRUD (`getLinks`, `getLink`,
  `storeLink`, `updateLink`, `deleteLink`). Create/update take `categoryName` (never a category
  id) and resolve it through a private `resolveCategoryId()` helper: `null`/empty → `null`
  (uncategorised), otherwise `trim()` then `LinkCategory::firstOrCreate(['category_name' => ...])`.
- `app/Http/Controllers/AdminLinkCategoryController.php` — `getLinkCategories` (`withCount('links')`,
  ordered by name), `updateLinkCategory` (rename), `deleteLinkCategory` (204; the FK's
  `nullOnDelete` from Part A does the rest).
- `app/Http/Requests/StoreLinkRequest.php`, `UpdateLinkRequest.php` — `title`, `url` (with the
  `url` validation rule, so a bare host like `example.com` 422s), `categoryName` nullable with
  `Rule::notIn([Link::UNCATEGORISED_NAME])` and a custom "Ez a kategórianév foglalt." message.
- `app/Http/Requests/UpdateLinkCategoryRequest.php` — `name` required, same `notIn` guard, plus
  `Rule::unique(...)->ignore($this->route('linkCategory'))` (mirrors `UpdateTagRequest`).
- `app/Http/Resources/AdminLinkResource.php` — embeds `category` as `{id, name}` or `null`
  (never the "Egyéb" fallback string — the admin UI needs to tell "genuinely uncategorised"
  apart from "a category literally named Egyéb", which can't exist per the guard above).
- `app/Http/Resources/AdminLinkCategoryResource.php` — `{id, name, linkCount}` via `whenCounted('links')`.
- `routes/api.php` — `links` and `link_categories` sub-groups added to the existing
  `admin` middleware group, after `tags`.
- Seven new Pest files: `tests/Feature/AdminLinkController/{GetAdminLinksTest,StoreLinkTest,
  UpdateLinkTest,DeleteLinkTest}.php`, `tests/Feature/AdminLinkCategoryController/
  {GetAdminLinkCategoriesTest,UpdateLinkCategoryTest,DeleteLinkCategoryTest}.php`. All three
  guard cases (guest/non-admin/admin) per endpoint, plus the tag-idempotency-style cases the
  task called for (existing category reused, new category created, name trimmed, null clears
  the category, "Egyéb" rejected on both create/rename, category delete leaves links behind and
  readable as "Egyéb" through the *public* endpoint).

**Decisions made while implementing:**
- The task's illustrative sort example ("Community → Egyéb → Documentation") doesn't match this
  install's actual collation, which sorts `COALESCE(...)` output plain-alphabetically
  (Community → Documentation → Egyéb, since 'D' < 'E'). Went with the real, verified DB
  behaviour rather than the example — the contract is "alphabetical via COALESCE", not a
  specific fixed order, and the code matches that literally.
- `resolveCategoryId()` factored as one private helper shared by store/update, so there is
  exactly one code path from `categoryName` to `link_category_id` — matches the self-review
  requirement that category ids are never accepted from the client.

**Surprises / gotchas:**
- None beyond the sort-order example above; Part A's left-join + `AdminLinkResource`'s
  `{id, name}|null` shape were the two places most likely to fatal on a null category, and both
  were covered by tests before being trusted.

**Verification:** `php artisan test --compact` → 279/279 passed (full suite, not just the new
files); `php artisan test --compact --filter=GetLinksTest` → 3/3 (public endpoint, run standalone
too); `vendor/bin/pint --dirty --format agent` → clean; `cd resources/frontend && npx ng test` →
436/436 passed (public links page and its FE types/grouping logic untouched, confirmed by
running the suite, not assumed).

**Left uncommitted for review:** yes (**since committed as `04e4ea9`**)

## 2026-09-05 — Follow-up: DB-level unique constraints on `link_categories.category_name` and `tags.tag_name`

**Status:** done

**Why:** raised during review of Task 13. Both `link_categories` and `tags` only had their
uniqueness enforced in PHP — `Rule::unique(...)->ignore(...)` on rename, and `firstOrCreate` on
create. Neither is race-safe: two concurrent "create with a brand-new category/tag name" requests
can both pass `firstOrCreate`'s `SELECT` before either commits its `INSERT`, producing two rows
with the same name. Only a DB-level constraint closes that gap.

**Shipped:**
- `database/migrations/2026_09_05_073319_add_unique_constraint_to_link_categories_and_tags.php` —
  adds a unique index on `link_categories.category_name` and `tags.tag_name`. `down()` drops both.
- `tests/Feature/AdminLinkCategoryController/LinkCategoryUniqueConstraintTest.php`,
  `tests/Feature/AdminTagController/TagUniqueConstraintTest.php` — each proves the constraint is
  live with a direct `DB::table(...)->insert()` duplicate, expecting `QueryException`, bypassing
  the application layer entirely (so the test can't be satisfied by the existing `Rule::unique`
  checks alone).

**Decisions made while implementing:**
- No new exception handling added around `firstOrCreate`/`update` in `AdminLinkController` or
  `AdminTagController` — a losing race still 500s via the existing blanket `try/catch (Throwable)`,
  same as every other unexpected failure in these controllers. This is an internal admin panel
  with no concurrent public traffic, so the DB constraint is here as a correctness backstop, not
  because a race was observed or is expected to be user-visible.
- Both tables fixed in one migration/journal entry rather than two, since they're the same gap
  in the same shape (Task 11's tags, Task 13's link categories).

**Verification:** `php artisan test --compact` → 281/281 passed (no existing seed data collided
with the new constraints); `vendor/bin/pint --dirty --format agent` → clean.

**Left uncommitted for review:** yes

## 2026-09-05 — Task 14: FE links admin grid + form

**Status:** done

**Shipped:**
- `types/admin-links.ts`, `services/admin-links.query.service.ts` (`getAdminLinks`,
  `getAdminLink`, `getAdminLinkCategories`, `createAdminLink`, `updateAdminLink`,
  `deleteAdminLink`), plus `queryKeys.ts`/`mutationKeys` entries — mirrors the offers/tags
  services exactly. Every mutation invalidates `adminLinks`, `adminLinkCategories` (a mutation
  may create or empty a category) and the public `links` key.
- `mocks/admin/links/*` — request matchers + OK-response factories for links and link
  categories, following the offers mock shape.
- `components/ag-grid/link-url-cell-renderer/` — a small `ICellRendererAngularComp` rendering
  the row's URL as `<a target="_blank" rel="noopener noreferrer">`. Deliberately not modelled on
  `integra-document-link-cell-renderer` (that one drives a download mutation); this is a plain
  outbound link with no request behind the click.
- `pages/admin/links/admin-links.component.*` — grid with Kategória (falls back to "Egyéb"
  client-side for a `null` category, per the API contract), Hivatkozás szövege, the URL cell
  renderer, and the shared `AdminActionsCellRendererComponent` Kezelés column. Header carries
  both "Új link felvétele" and "Kategóriák" buttons; the latter points at
  `/admin/linkek/kategoriak`, which 404s until Task 15 lands — expected per `00-overview.md`'s
  "Project state" note.
- `pages/admin/link-form/admin-link-form.component.*` — `mat-select` with "Egyéb (nincs
  kategória)", the loaded categories, and "+ Új kategória"; picking the last reveals a text
  input for the new name. Whatever is picked/typed resolves to `categoryName: string | null`
  in the request, exactly as the Task 13 API expects.
- Routes: `linkek`, `linkek/uj`, `linkek/:id` added to `admin.routes.ts` (literal segments
  before `:id`, per the existing convention). `linkek/kategoriak` is **not** registered yet —
  its component doesn't exist until Task 15; adding the route now would 500 on navigation
  instead of the accepted 404. `app.component.spec.ts` extended with the matching
  admin/non-admin cases.

**Decisions made while implementing:**
- The "new category required only while that branch is selected" rule turned out not to need
  the manual-`onSubmit`-validation fallback the task doc allowed for: `@angular/forms/signals`
  (v22 as installed) ships a `when` option on `required()` (`required(path, { when: (ctx) =>
  ctx.valueOf(otherPath) === ... } )`), so it's a schema-level conditional validator like any
  other field, not something bolted on in `onSubmit`. No `applyWhen` function exists in this
  version — `required`'s `when` covers the same need for this case.
- The URL protocol check uses the built-in `pattern()` signal-forms validator (available in this
  version) rather than a hand-rolled `validate()` function — same idea as
  `richTextRequiredValidator` but no custom function needed here.
- The "Kategória" grid column reads `category?.name ?? "Egyéb"` via a `valueFormatter`, keeping
  the "Egyéb" fallback wording entirely client-side, as the task doc specifies (the admin API
  itself only ever sends `category: null`).
- Reused `zephyr-admin-rich-text-form` (despite its name) for the link form's layout — it's the
  only admin-form layout mixin in the codebase and works fine with zero rich-text fieldsets;
  introducing a second, near-duplicate mixin for a form with no rich text felt like the wrong
  trade.

**Surprises / gotchas:**
- A handful of `ng test` runs report 4 "Unhandled Rejection: NG04002: Cannot match any routes"
  entries attributed to `admin-link-form.component.spec.ts`, even though every test in that file
  passes. Root-caused to the existing (pre-Task-14) pattern shared by every admin form —
  `this.router.navigate([...])` is fired without `await` in `onSubmit`, and the test harness's
  `provideRouter([])` has no routes to match, so the navigation promise always rejects; offer/
  news/knowledgebase forms do the exact same thing and are presumably equally exposed, but
  whether it surfaces as a reported "unhandled rejection" depends on which test happens to be
  running in the same Vitest worker when that promise settles. Not a regression introduced here
  and not affecting pass/fail — flagged for whoever eventually hardens the admin forms' test
  harness (e.g. giving `provideRouter` real routes, or awaiting/catching the navigation).

**Verification:** `cd resources/frontend && npx ng test` → 461/461 passed (up from 436);
`npx ng lint` → clean (auto-fixed two spec-file spacing warnings); `npx tsc -p
tsconfig.app.json` → clean; `npx prettier . --check` → clean (auto-fixed formatting on the new
files); `npx knip` → clean (one initially-unused exported type inlined away).

**Left uncommitted for review:** yes

### Review follow-up (same day)

Reviewer testing surfaced two gaps, both fixed in place (no new task number):

- **Missing client-side validation for the reserved category name.** The task doc had already
  called for this ("keep the '+ Új kategória' input from submitting it in the first place") but
  the first pass only relied on the backend's 422. Added a `validate()` on
  `linkForm.newCategoryName` (active only while `categorySelection === "new"`, via the same
  `valueOf()` sibling-read used by the conditional `required`) that rejects the exact reserved
  name kept in sync with `Link::UNCATEGORISED_NAME` (`"Egyéb"`), showing the same
  "Ez a kategórianév foglalt." message the backend would have returned, and disabling submit.
  Typing an *existing* category's name into "+ Új kategória" is intentionally left unvalidated —
  the backend resolves it to that category via `firstOrCreate` rather than erroring, which is
  the documented, correct behaviour, not a bug.
- **The 422 message read as plain text, not a card.** Swapped the bare
  `<p data-testid="invalid-data-message">` for the shared `app-error-card` (title "Érvénytelen
  adatok"), matching `FormUnexpectedErrorComponent`'s look. This only touches the links form —
  `admin-offer-form`/`admin-news-form`/`admin-knowledgebase-form` still use the plain-text
  version, so the two styles now coexist. Worth unifying across all admin forms later, but that
  wasn't asked for here.

**Verification:** `npx ng test` → 462/462 passed (one new test: reserved name blocks submit);
`npx ng lint` → clean; `npx tsc -p tsconfig.app.json` → clean; `npx prettier . --check` → clean;
`npx knip` → clean.

## 2026-09-05 — Task 15: FE link categories admin page

**Status:** done

**Shipped:**
- `resources/frontend/src/app/pages/admin/link-categories/admin-link-categories.component.*` —
  `/admin/linkek/kategoriak` grid (Kategória / Linkek száma / Kezelés), reusing
  `RenameDialogComponent` (Task 12) and `ConfirmDialogComponent` (D5) exactly like
  `admin-tags.component`.
- `admin-links.query.service.ts` — added `updateAdminLinkCategory()` and
  `deleteAdminLinkCategory()`, both routed through the existing `invalidateLinkQueries()` so a
  rename/delete invalidates `adminLinks`, `adminLinkCategories` and the public `links` in one
  place.
- `queryKeys.ts` — `updateAdminLinkCategory`/`deleteAdminLinkCategory` mutation keys.
- `types/admin-links.ts` — `AdminLinkCategoryItemResponse`, `SaveAdminLinkCategoryRequest`.
- `mocks/admin/links/adminLinkCategoryRequests.ts` — `PUT`/`DELETE` request matchers.
- `admin.routes.ts` — `linkek/kategoriak` registered before `linkek/:id`.
- `app.component.spec.ts` — proves `/admin/linkek/kategoriak` renders the categories page (not
  the link form) for an admin, and 404s for a non-admin.

**Decisions made while implementing:**
- The reserved-name vs. duplicate-name 422 message is picked **client-side**, not parsed out of
  the API response: `throwHttpError` collapses every validation failure to a bare
  `INVALID_REQUEST_DATA` with no body, so the only way to tell "Ez a kategórianév foglalt." (the
  reserved `Link::UNCATEGORISED_NAME`, `"Egyéb"`) apart from an ordinary duplicate-name 422 is to
  compare the submitted name against the same reserved constant already used in
  `admin-links.component.ts` and `admin-link-form.component.ts`. This mirrors how the create-link
  form validates the same reserved name (Task 14 follow-up) rather than inventing a new pattern.
- Delete confirmation reuses the `warning` slot for a *reassurance*, not a danger notice — worded
  "A kategóriához tartozó N link megmarad, és az „Egyéb” csoportba kerül." with no wording
  implying loss, per D8 (a null category reads back as "Egyéb").

**Surprises / gotchas:**
- None — this task is structurally identical to Task 12 (tags), just with a second numeric column
  and the client-side reserved-name branch above.

**Verification:** `npx ng test` → 477/477 passed (15 new tests); `npx ng lint` → clean;
`npx tsc -p tsconfig.app.json` → clean; `npx prettier . --check` → clean; `npx knip` → clean.

**Left uncommitted for review:** yes

**Next session should know:** Task 16 (BE: Integra documents admin API) is next and has no FE
dependency on this task beyond routing conventions already established.
