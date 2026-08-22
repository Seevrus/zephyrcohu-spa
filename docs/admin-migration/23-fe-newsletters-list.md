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
- Create: `resources/frontend/src/app/pages/admin/newsletter-view/admin-newsletter-view.component.*` (+ spec)
- Modify: `resources/frontend/src/app/admin.routes.ts`, `app.component.spec.ts`

## Design

### Types

```ts
export type AdminNewsletterResponse = {
  id: number;
  subject: string;
  content?: string;          // only on the single-newsletter endpoint
  createdAt: string;
  recipientCount: number;
  sentCount: number;
  isSentToEveryone: boolean;
};

export type AdminNewsletterRecipient = { id: number; email: string };
```

### Service

`AdminNewslettersQueryService`:

- `getAdminNewsletters()` → `GET /admin/newsletters`
- `getAdminNewsletter(id)` → `GET /admin/newsletters/{id}`
- `getAdminNewsletterRecipients(id)` → `GET /admin/newsletters/{id}/recipients`
  (`staleTime: 0` — the list shrinks as the run progresses)
- `createAdminNewsletter()` → `POST /admin/newsletters` (used by Task 24)
- `sendNewsletterToRecipient()` → `POST /admin/newsletters/{id}/recipients/{userId}`
  (used by Task 24; **no automatic retry** — override `retry: false` on this mutation so the
  FE loop stays in control. Note that the app-level `QueryClient` in `app.config.ts` *does* retry
  429s three times with a growing delay; that default must not apply here, because Task 24 handles
  429 itself.)

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

### View page (`/admin/hirlevel/:id`)

Read-only rendering of the newsletter: subject as a heading, `content` rendered as HTML, the
counters, and:

- when `isSentToEveryone` is false → a "Kiküldés folytatása" button that navigates to the send
  flow with this newsletter's id. Task 24 owns that flow; the button routes to
  `/admin/hirlevel/uj` with `state: { newsletterId: id }`, or — decide in Task 24 and keep both
  ends consistent — to a dedicated `/admin/hirlevel/:id/kuldes` route. **Recommendation:** let
  the compose screen (Task 24) accept an existing newsletter through router state; note the final
  choice in the journal so Task 24 matches it.
- when it is true → the text "A hírlevél minden címzettnek kiküldésre került."

`content` is admin-authored HTML from TinyMCE. Render it with `[innerHTML]` and add a comment
explaining that Angular's sanitizer strips scripts; do not use `bypassSecurityTrustHtml`.
(The public news/knowledgebase pages already render admin HTML the same way — follow whatever
they do, and if they use a different mechanism, copy it instead.)

Routes (`uj` before `:id` — Task 24 adds `uj`):

```ts
{ path: "hirlevel", …, title: "Admin - Hírlevelek" },
{ path: "hirlevel/uj", …, title: "Admin - Új hírlevél" },     // Task 24
{ path: "hirlevel/:id", …, title: "Admin - Hírlevél megtekintése" },
```

## Steps

- [ ] **Step 1:** Types, mocks, list spec, service + list page.
- [ ] **Step 2:** View spec, then the view page.
- [ ] **Step 3:** Routes + `app.component.spec.ts` cases for `/admin/hirlevel` and
      `/admin/hirlevel/1`.
- [ ] **Step 4:** Verify, self review, journal, tick Task 23.

## Tests to write

`admin-newsletters.component.spec.ts` — loading; rows with subject, date and `118 / 120`; a fully
sent newsletter shows "Kiküldve"; empty state; error card; the info action navigates to the view.

`admin-newsletter-view.component.spec.ts` — fetches the newsletter, renders subject and content
HTML, shows the counters, shows the resume button only when unfinished, and shows the completed
sentence otherwise; unknown id → not-found message.

## Verification

```bash
cd resources/frontend
npx ng test && npx ng lint && npx tsc -p tsconfig.app.json && npx prettier . --check && npx knip
```

## Self review

- [ ] Progress is legible as text, not only as a bar.
- [ ] The send mutation is configured with `retry: false` (Task 24 depends on it).
- [ ] The recipients query is not cached stale (`staleTime: 0`).
- [ ] Rendered newsletter HTML goes through Angular's sanitizer.
- [ ] The resume affordance matches whatever Task 24 implements — verify at the end of Task 24
      and fix here if they drifted.

## Done when

Both screens work, FE tooling is green, journal updated, work **left uncommitted**.
