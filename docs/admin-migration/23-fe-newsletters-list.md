# Task 23 — FE: newsletter list + view

**Type:** Frontend
**Depends on:** Task 03, Task 22
**Legacy source:** `src/_hirlevel/hirlevelek.html`, `hirlevel.html`, `hirlevel_megtekint.GET.php`
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

`/admin/hirlevel` — the list of newsletters with their send progress, and `/admin/hirlevel/:id` —
a read-only view of one newsletter, from which an unfinished send can be resumed.

## Files

- Create: `resources/frontend/src/types/admin-newsletters.ts`
- Create: `resources/frontend/src/app/services/admin-newsletters.query.service.ts`
- Modify: `resources/frontend/src/app/services/queryKeys.ts`
- Create: `resources/frontend/src/mocks/admin/newsletters/…`
- Create: `resources/frontend/src/app/pages/admin/newsletters/admin-newsletters.component.*` (+ spec)
- Create: `resources/frontend/src/app/pages/admin/newsletter-details/admin-newsletter-details.component.*` (+ spec)
- Create: `resources/frontend/src/app/components/ag-grid/newsletter-progress-cell-renderer/…` (+ spec)
  — the "Kiküldés" cell needs a component to hold the text plus the progress bar
- Modify: `resources/frontend/src/app/admin.routes.ts`, `app.component.spec.ts`

## Design

### Types

The two endpoints return two different shapes, so they get two types rather than one type with an
optional `content` — the list item genuinely has no body, and the detail item always does:

```ts
export type AdminNewsletterCollectionResponseItem = {
  id: number;
  subject: string;
  createdAt: string;
  recipientCount: number;
  sentCount: number;
  isSentToEveryone: boolean;
};

export type AdminNewsletterResponseItem = AdminNewsletterCollectionResponseItem & {
  content: string;
};

// …plus the mapped `createdAt: Date` variants (`AdminNewsletterCollectionItem`,
// `AdminNewsletterItem`) and the `{ data: … }` envelopes.

export type AdminNewsletterRecipient = { id: number; email: string }; // Task 24
```

### Service

`AdminNewslettersQueryService`:

- `getAdminNewsletters()` → `GET /admin/newsletters`
- `getAdminNewsletter(id)` → `GET /admin/newsletters/{id}`

**Decided with the user:** the three Task 24 methods below were *not* built here. Nothing on these
two screens calls them, so they would have landed untested, against the project's own "test
everything" rule. They moved to Task 24 (whose doc now carries them, including the two constraints
that were this task's self-review items):

- `getAdminNewsletterRecipients(id)` → `GET /admin/newsletters/{id}/recipients` (`staleTime: 0`)
- `createAdminNewsletter()` → `POST /admin/newsletters`
- `sendNewsletterToRecipient()` → `POST /admin/newsletters/{id}/recipients/{userId}`
  (**`retry: false`** so Task 24's loop keeps sole control of 429 handling. Note the `app.config.ts`
  retry policy applies to `queries` only — TanStack mutations do not inherit it — so that override
  guards against a future default rather than fixing current behaviour.)

### List page

| Header | Field | Notes |
|---|---|---|
| Dátum | `createdAt` | `formatDisplayDateWithoutDay` |
| Tárgy | `subject` | wrap |
| Kiküldés | — | `sentCount` / `recipientCount` plus a `mat-progress-bar mode="determinate"`; when `isSentToEveryone` show "Kiküldve" |
| Kezelés | — | actions `["info"]` → `/admin/hirlevel/:id` |

Header: `<h1>Kiküldött hírlevelek</h1>` + `<a mat-flat-button routerLink="/admin/hirlevel/uj">Új hírlevél írása</a>`.
Empty state: "Még egyetlen hírlevél sem került elküldésre." (legacy `nincs_hirlevel.html`).
There is no delete action — the legacy admin had none either.

The progress cell must also be readable without colour: render the numbers as text and give the
progress bar an `aria-label` such as `Kiküldés: 118 / 120`.

### Details page (`/admin/hirlevel/:id`)

Read-only rendering of the newsletter: subject as a heading, `content` rendered as HTML, the
counters, and:

- when `isSentToEveryone` is false → a "Kiküldés folytatása" link. **Decided with the user:** a
  dedicated **`/admin/hirlevel/:id/kuldes`** route, not the router-state-into-`/admin/hirlevel/uj`
  variant this doc originally recommended — a plain `routerLink`, so the resume URL is
  deep-linkable and survives a reload. Task 24 owns that screen and registers the route; until it
  lands the link resolves to the 404 page, like every other not-yet-migrated admin link.
- when it is true → the text "A hírlevél minden címzettnek kiküldésre került."

`content` is admin-authored HTML from TinyMCE, rendered with `[innerHTML]`. Per the escape clause
above ("follow whatever they do") and **D14**, the sanitising is
`sanitizer.bypassSecurityTrustHtml(DOMPurify.sanitize(content))`, exactly like the six public
renderers of admin HTML — Angular's own sanitizer strips the `style` attributes TinyMCE uses for
colour, size and alignment, so the admin's formatting would silently vanish.

Routes (`uj` before `:id` — Task 24 adds `uj`):

```ts
{ path: "hirlevel", …, title: "Admin - Hírlevelek" },
{ path: "hirlevel/uj", …, title: "Admin - Új hírlevél" },     // Task 24
{ path: "hirlevel/:id", …, title: "Admin - Hírlevél megtekintése" },
{ path: "hirlevel/:id/kuldes", …, title: "Admin - Hírlevél kiküldése" },  // Task 24
```

## Steps

- [x] **Step 1:** Types, mocks, list spec, service + list page.
- [x] **Step 2:** View spec, then the view page.
- [x] **Step 3:** Routes + `app.component.spec.ts` cases for `/admin/hirlevel` and
      `/admin/hirlevel/1`.
- [x] **Step 4:** Verify, self review, journal, tick Task 23.

## Tests to write

`admin-newsletters.component.spec.ts` — loading; rows with subject, date and `118 / 120`; a fully
sent newsletter shows "Kiküldve"; empty state; error card; the info action navigates to the view.

`admin-newsletter-details.component.spec.ts` — fetches the newsletter, renders subject and content
HTML, shows the counters, shows the resume button only when unfinished, and shows the completed
sentence otherwise; unknown id → not-found message.

## Verification

```bash
cd resources/frontend
npx ng test && npx ng lint && npx tsc -p tsconfig.app.json && npx prettier . --check && npx knip
```

## Self review

- [x] Progress is legible as text, not only as a bar (`n / m` or "Kiküldve" in the cell, plus the
      bar's `aria-label`).
- [x] The send mutation is configured with `retry: false` (Task 24 depends on it) — **deferred to
      Task 24 together with the method itself**, and recorded in its doc and self review.
- [x] The recipients query is not cached stale (`staleTime: 0`) — **deferred to Task 24** likewise.
- [x] Rendered newsletter HTML is sanitised — with DOMPurify per D14, see above.
- [x] The resume affordance matches whatever Task 24 implements — `/admin/hirlevel/:id/kuldes` is
      written into the Task 24 doc; verify at the end of Task 24 and fix here if they drifted.

## Done when

Both screens work, FE tooling is green, journal updated, work **left uncommitted**.
