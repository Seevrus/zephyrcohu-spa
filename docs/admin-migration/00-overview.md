# Admin functionalities migration — Overview

**Goal:** Move every administrative functionality of the legacy PHP app `zephyrcohu-admin-ui`
into the integrated Laravel + Angular SPA `zephyrcohu-spa`, so the legacy admin app can be
retired.

**Source of truth for the legacy behaviour:** `d:\GoogleDrive\web\zephyrcohu-admin-ui\src`
(page-per-file PHP with Mustache templates, Hungarian identifiers) and `...\src_cron`
(cron scripts).

**Target:** `d:\zephyrcohu-spa` — Laravel 13 API (`app/`, `routes/api.php`, Pest tests in
`tests/Feature`) plus the Angular 22 SPA (`resources/frontend`, Vitest + Testing Library specs).

---

## How to work with these documents

- `00-overview.md` (this file) — decisions, conventions, task index. Read it first, every time.
- `NN-*.md` — one task per file, in execution order. A task is a single admin functionality
  (a BE endpoint set, an FE screen, or a supporting change) and is meant to be one working
  session.
- `JOURNAL.md` — running development journal. **Append an entry at the end of every task**:
  what was done, what was decided, what surprised you, what the next session needs to know.
- The original brief these documents were written from is `admin-functionalities-migration.md`
  in the repository root (currently untracked). If it is dropped, the decision table below is
  the surviving record of what was agreed.

**Project state:** the SPA is **not deployed yet**, which is why work goes straight to `main` and
why a half-migrated admin area is fine. The admin navigation bar already links to all seven
sections, so until the matching task lands, those links render the 404 page. That is expected —
do not hide nav items or add placeholder screens to cover it.

### Rules that apply to every task

1. **Use `superpowers`.** At minimum `superpowers:test-driven-development` while implementing
   and `superpowers:verification-before-completion` before declaring the task done. Reach for
   `superpowers:systematic-debugging` when something misbehaves.
2. **Work inline.** No branches, no worktrees. The repository stays on `main`.
3. **Do not commit.** Every task ends with *uncommitted* changes so a human can review them.
   The reviewer commits.
4. **Self review before finishing.** Re-read your own diff against the task's "Self review"
   checklist, fix what you find, then re-run the verification commands.
5. **Test everything.** BE changes get Pest feature tests; FE changes get Vitest specs.
   FE routing is asserted in `resources/frontend/src/app/app.component.spec.ts`.
6. **Update `JOURNAL.md`** as the last step, and tick the task off in the index below.

### Verification commands

Backend (from `d:\zephyrcohu-spa`):

```bash
php artisan test --compact --filter=<TestNameOrFile>
vendor/bin/pint --dirty --format agent
```

Frontend (from `d:\zephyrcohu-spa\resources\frontend`):

```bash
npx ng test          # whole suite; the @angular/build:unit-test builder cannot filter files
npx ng lint
npx tsc -p tsconfig.app.json
npx prettier . --check
npx knip             # catches unused exports/files introduced by a task
```

---

## Decisions (settled — do not re-litigate)

| # | Decision | Rationale |
|---|---|---|
| D1 | The admin API lives under `/api/admin/*` with dedicated `Admin*Controller` classes. | Keeps the public controllers untouched; one guard covers the whole surface. |
| D2 | A single `admin` middleware (`EnsureUserIsAdmin`) returns **404 `GENERIC_NOT_FOUND`** for guests *and* for logged-in non-admins. | "We don't advertise these to anyone." It is the same story the FE tells. |
| D3 | FE admin routes are lazy children behind a `canMatch` guard. A non-admin simply fails to match, falls through to the `**` route and gets the existing `NotFoundComponent` — with the typed URL preserved. | No redirect, no leak, no new 404 component. |
| D4 | The legacy "Dátum" + "Érvényes" pair is **one** date, backed by `published_at`. Admin forms label it **"Közzététel dátuma"**. No `valid_until` column is introduced. | Both legacy fields were "valid from" dates; the shipped public side already treats `publishedAt` this way (the Integra grid even labels it "Érvényes"). |
| D5 | Destructive actions use one shared Angular Material confirm dialog (`ConfirmDialogComponent`), opened from the grid's `delete_forever` icon. | Avoids ~7 extra routes/pages; Material dialog is already available. |
| D6 | Newsletter sending is **FE-governed**: the SPA fetches the pending recipients and fires one send request per recipient, sequentially, showing progress. No queue, no PHP self-refresh. | No queue infrastructure is available. Progress is visible and a run is resumable — recipients already recorded in `users_newsletters` are never re-sent. |
| D7 | Knowledgebase tags are submitted **by name** (`tags: string[]`); the backend `firstOrCreate`s missing tags and syncs. | Replaces the legacy `83*H#bkn-` prefix hack with something honest. |
| D8 | `links.link_category_id` becomes **nullable** with `nullOnDelete`, and a null category reads back as the legacy fallback **"Egyéb"**. Deleting a category therefore keeps its links and moves them to "Egyéb". Task 13 Part A ships the migration together with the public read fix. | The shipped schema had it NOT NULL with `cascadeOnDelete`, which was an oversight in the original wiring rather than a decision: deleting a category would have silently deleted links, and `LinkController::getLinks` inner-joins `link_categories`, so a null-category link would vanish from the public page entirely. Losing content on a category rename-gone-wrong is the worse failure mode. |
| D9 | Document (Integra) updates use `POST /api/admin/documents/{document}`, not `PUT`. | PHP does not parse `multipart/form-data` bodies on `PUT`, and an update may carry a replacement file. |
| D10 | Both legacy cron scripts become Laravel scheduled artisan commands. | `send_reminders.php` → `zephyr:send-pending-registrations-reminder`; `clean_db.php` → `zephyr:prune-expired-records`. |
| D11 | The "API dokumentáció" nav item stays inert. | Explicitly out of scope; whether the SPA gets an API docs node at all is decided separately. |
| D12 | Admin grids are `ag-grid` (like the Integra page), client-side paginated, and admin pages may grow to `variables.$widescreen` instead of `$desktop-width`. | Requested; admin tables are wide. |
| D13 | The newsletter send endpoint gets its own rate limiter (`throttle:newsletter`, 120/min) and opts **out** of the global `api` limiter, and the FE paces its loop at ~1s per send and backs off on 429. | The `api` limiter is 60/min per user (`AppServiceProvider::boot()`, applied group-wide by `throttleApi()`), and the FE-governed loop makes one request per recipient. Without this, a run larger than 60 recipients would 429 and mark everyone after the 60th as failed. The 1s pacing also reproduces the legacy `sleep(1)`, which protected the shared SMTP account. |
| D15 | The admin "generate new password" action stays (legacy parity), but the UI states that **self-service reset is the preferred route** and that the generated password travels by email in plain text. | Deliberate fallback for when nothing else helps. It is a last resort, and both the admin UI and the notification mail should say so. |

### Open question — decide during Task 03

| # | Question | Why it matters |
|---|---|---|
| **D14** | How should admin-authored rich text survive rendering? The public pages run content through `DomSanitizer.sanitize(SecurityContext.HTML, …)` (see `pages/news-article/news-article.component.ts`), whose allow-list contains `class`, `align`, `color`, `face` but **not `style`** — and TinyMCE 8 emits `style="…"` for colours, font sizes and alignment. Admin formatting will therefore be silently dropped on the public site. | Task 03 runs the spike that proves what survives, and the decision is recorded here before any admin form is built. Candidate answers: **(a)** trim the editor toolbar to formatting that survives; **(b)** sanitise with **DOMPurify** on render and pass the result through `bypassSecurityTrustHtml` (a new FE dependency — needs sign-off, and moves the XSS boundary to DOMPurify's allow-list); **(c)** accept the loss and document it. Until this is answered, do not tune the TinyMCE toolbar. |

### Deliberate behaviour changes vs. the legacy admin

- No POST/redirect/session-flash cycle. Forms are signal forms; errors render inline from the
  API response.
- No captcha anywhere in the admin.
- The legacy "Olvasók" columns (who read a news item / KB article) survive as a count plus an
  expandable list of emails in the grid.
- The legacy per-page delete confirmation screens are replaced by the shared confirm dialog (D5).
- Admin password expiry (the legacy header's "password age in days") is already covered by the
  SPA profile page and `passwordSetAt`; nothing to migrate.
- The legacy newsletter unsubscribe link (`index.php?content=unsub&p1=…`) is replaced by the
  SPA profile page: the mail links to `/profil`.

---

## Conventions

### Backend

- Controllers: `app/Http/Controllers/Admin<Entity>Controller.php` (flat directory, as today).
- Requests: `app/Http/Requests/Store<Entity>Request.php`, `Update<Entity>Request.php`.
- Resources: `app/Http/Resources/Admin<Entity>Resource.php`. Response keys are **camelCase**;
  request keys are **camelCase** as well and are mapped to snake_case columns in the controller.
- Errors: reuse `ErrorResource` + `App\ErrorCode`. Unexpected failures `abort(500)` inside a
  `try/catch (Throwable)`, exactly like `NewsController`.
- No new `ErrorCode` cases are needed by this migration.
- Routes: `routes/api.php`, one `Route::prefix('admin')->middleware('admin')` group holding
  per-entity sub-groups. Rate limiting stays with the named limiters described in
  `.ai/rules/routes.md`; the default `api` limiter (60/min) is enough for admin traffic.
- Tests: `tests/Feature/Admin<Entity>Controller/<Action>Test.php`, Pest `describe()` blocks with
  a `reset...TestData()` helper inserting rows via `DB::table(...)->insert(...)`, mirroring
  `tests/Feature/NewsController/GetNewsItemTest.php`. **This project has no factories.**
- **Every admin endpoint gets three guard tests**: guest → 404, non-admin user → 404,
  admin → success.

### Frontend

- Pages live in `resources/frontend/src/app/pages/admin/<feature>/`.
- Routes live in `resources/frontend/src/app/admin.routes.ts`, lazily loaded from
  `app.routes.ts` behind `adminGuard` (`canMatch`).
- Services: `resources/frontend/src/app/services/admin-<feature>.query.service.ts`, following
  `news.query.service.ts` (TanStack Query `queryOptions`/`mutationOptions`, `lastValueFrom`,
  `throwHttpError`, cache invalidation in `onSuccess`).
- Query/mutation keys are added to `resources/frontend/src/app/services/queryKeys.ts`.
- Types go to `resources/frontend/src/types/admin-<feature>.ts`; HTTP mocks to
  `resources/frontend/src/mocks/admin/<feature>/`.
- Forms are **signal forms** (`@angular/forms/signals`), modelled on
  `pages/request-quote/request-quote.component.ts`. No captcha.
- Rich text uses `app-rich-text-editor` bound with `[formField]` (see Task 03).
- Icons: `edit`, `delete_forever`, `email`, `info` (Angular Material icon font).
- Styling: host class plus `@include mixins.zephyr-admin-main` (added in Task 03) which caps the
  page at `variables.$widescreen`; grids use `mixins.zephyr-grid` and `zephyrGridTheme`.
- Accessibility is a hard requirement: a label on every control, `aria-label` on icon buttons,
  dialog focus management, AA contrast. Specs query by role/label wherever practical.
- Hungarian UI copy throughout, matching the legacy wording where it still fits.

### Admin API surface (complete)

| Method | Path | Purpose | Task |
|---|---|---|---|
| GET | `/api/admin/news` | list all news incl. unpublished, with readers | 04 |
| POST | `/api/admin/news` | create | 04 |
| GET | `/api/admin/news/{news}` | single (edit form) | 04 |
| PUT | `/api/admin/news/{news}` | update | 04 |
| DELETE | `/api/admin/news/{news}` | delete | 04 |
| GET/POST/GET/PUT/DELETE | `/api/admin/offers[/{offer}]` | offers CRUD | 07 |
| GET/POST/GET/PUT/DELETE | `/api/admin/knowledgebase[/{knowledgebase}]` | KB CRUD incl. tag sync | 09 |
| GET | `/api/admin/tags` | tags with usage counts | 11 |
| PUT | `/api/admin/tags/{tag}` | rename | 11 |
| DELETE | `/api/admin/tags/{tag}` | delete (detaches) | 11 |
| GET/POST/PUT/DELETE | `/api/admin/links[/{link}]` | links CRUD | 13 |
| GET | `/api/admin/link-categories` | categories with link counts | 13 |
| PUT | `/api/admin/link-categories/{linkCategory}` | rename | 13 |
| DELETE | `/api/admin/link-categories/{linkCategory}` | delete (its links fall back to "Egyéb") | 13 |
| GET | `/api/admin/documents` | all Integra documents | 16 |
| POST | `/api/admin/documents` | upload (multipart) | 16 |
| POST | `/api/admin/documents/{document}` | update, optional new file (multipart) | 16 |
| DELETE | `/api/admin/documents/{document}` | delete row + file | 16 |
| GET | `/api/admin/users` | user list | 18 |
| PUT | `/api/admin/users/{user}` | update email / confirm / newsletter / new password | 18 |
| DELETE | `/api/admin/users/{user}` | delete with reason + notification | 18 |
| POST | `/api/admin/users/{user}/email` | send an ad-hoc email to the user | 18 |
| GET | `/api/admin/newsletters` | list with send progress | 22 |
| POST | `/api/admin/newsletters` | create (does not send) | 22 |
| GET | `/api/admin/newsletters/{newsletter}` | single (view) | 22 |
| GET | `/api/admin/newsletters/{newsletter}/recipients` | pending recipients | 22 |
| POST | `/api/admin/newsletters/{newsletter}/recipients/{user}` | send to one recipient | 22 |

### SPA route map (all behind `adminGuard`)

| Route | Screen | Task |
|---|---|---|
| `/admin` | redirects to `/admin/hirek` (a throwaway landing page holds the slot in Task 02 and is deleted in Task 05) | 02, 05 |
| `/admin/hirek` | news grid | 05 |
| `/admin/hirek/uj`, `/admin/hirek/:id` | news form | 06 |
| `/admin/ajanlatok`, `/admin/ajanlatok/uj`, `/admin/ajanlatok/:id` | offers | 08 |
| `/admin/tudasbazis`, `/admin/tudasbazis/uj`, `/admin/tudasbazis/:id` | knowledgebase | 10 |
| `/admin/tudasbazis/cimkek` | tags | 12 |
| `/admin/linkek`, `/admin/linkek/uj`, `/admin/linkek/:id` | links | 14 |
| `/admin/linkek/kategoriak` | link categories | 15 |
| `/admin/integra`, `/admin/integra/uj`, `/admin/integra/:id` | Integra documents | 17 |
| `/admin/felhasznalok` | user grid | 19 |
| `/admin/felhasznalok/:id` | user edit | 20 |
| `/admin/felhasznalok/:id/email` | write to user | 21 |
| `/admin/hirlevel` | sent newsletters | 23 |
| `/admin/hirlevel/:id` | newsletter view | 23 |
| `/admin/hirlevel/uj` | compose + send | 24 |

> `/admin/tudasbazis/cimkek` must be registered **before** `/admin/tudasbazis/:id`, and
> `/admin/linkek/kategoriak` before `/admin/linkek/:id`, otherwise the `:id` route wins.

These paths are exactly the ones the already-shipped `app-admin-nav` component links to
(`resources/frontend/src/app/header/admin-nav/admin-nav.component.html`) — do not rename them.

---

## Task index

| # | Type | Task | Depends on | Done |
|---|---|---|---|---|
| 01 | BE | [Admin guard: middleware + `/api/admin` group](01-be-admin-guarding.md) | — | [ ] |
| 02 | FE | [Admin routing and guard](02-fe-admin-routing-and-guard.md) | 01 | [ ] |
| 03 | FE | [Admin UI kit: dialog, grid actions, rich text field, layout](03-fe-admin-ui-kit.md) | 02 | [ ] |
| 04 | BE | [News admin API](04-be-news-crud.md) | 01 | [ ] |
| 05 | FE | [News admin grid](05-fe-news-list.md) | 03, 04 | [ ] |
| 06 | FE | [News create/edit form](06-fe-news-form.md) | 05 | [ ] |
| 07 | BE | [Offers admin API](07-be-offers-crud.md) | 01 | [ ] |
| 08 | FE | [Offers admin grid + form](08-fe-offers.md) | 03, 06, 07 | [ ] |
| 09 | BE | [Knowledgebase admin API](09-be-knowledgebase-crud.md) | 01 | [ ] |
| 10 | FE | [Knowledgebase admin grid + form](10-fe-knowledgebase.md) | 03, 06, 09 | [ ] |
| 11 | BE | [Tags admin API](11-be-tags-crud.md) | 01 | [ ] |
| 12 | FE | [Tags admin page](12-fe-tags.md) | 03, 11 | [ ] |
| 13 | BE | [Links + link categories admin API](13-be-links-crud.md) | 01 | [ ] |
| 14 | FE | [Links admin grid + form](14-fe-links.md) | 03, 13 | [ ] |
| 15 | FE | [Link categories admin page](15-fe-link-categories.md) | 14 | [ ] |
| 16 | BE | [Integra documents admin API](16-be-integra-documents.md) | 01 | [ ] |
| 17 | FE | [Integra documents admin grid + upload form](17-fe-integra.md) | 03, 16 | [ ] |
| 18 | BE | [Users admin API + mails](18-be-users-admin.md) | 01 | [ ] |
| 19 | FE | [Users admin grid](19-fe-users-list.md) | 03, 18 | [ ] |
| 20 | FE | [User edit form](20-fe-user-edit.md) | 19 | [ ] |
| 21 | FE | [Write to user + delete user flows](21-fe-user-email-and-delete.md) | 19 | [ ] |
| 22 | BE | [Newsletters API + mail](22-be-newsletters.md) | 01 | [ ] |
| 23 | FE | [Newsletter list + view](23-fe-newsletters-list.md) | 03, 22 | [ ] |
| 24 | FE | [Newsletter compose + FE-governed sending](24-fe-newsletter-compose-send.md) | 23 | [ ] |
| 25 | BE | [Scheduled commands](25-be-schedules.md) | — | [ ] |
| 26 | Supporting | [Final integration sweep](26-final-integration-sweep.md) | all | [ ] |
| 27 | Supporting | [Legacy data import](27-supporting-legacy-data-import.md) | 13, 16, 22, 26 | [ ] |

Tasks 04–24 are grouped per feature; inside a feature the BE task must land before its FE
sibling. Features are independent of each other, so the order *between* features may be changed
if something turns out to be blocked.

Task 27 is the odd one out: it moves the live content out of the legacy MySQL database into the
new schema. Nothing has been migrated yet, so the new tables are empty and every earlier task
works against hand-made data. Run 27 last, once the schema has stopped moving.
