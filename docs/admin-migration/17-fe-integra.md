# Task 17 — FE: Integra documents admin grid + upload form

**Type:** Frontend
**Depends on:** Task 03, Task 16
**Legacy source:** `src/_integra/integra_lista.html`, `integra.html`, `integra_urlap.html`
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

`/admin/integra` (grid), `/admin/integra/uj` and `/admin/integra/:id` (form) — upload, replace
and delete the documents served on the public Integra pages.

## Files

- Create: `resources/frontend/src/types/admin-documents.ts`
- Create: `resources/frontend/src/app/services/admin-documents.query.service.ts`
- Modify: `resources/frontend/src/app/services/queryKeys.ts`
- Create: `resources/frontend/src/mocks/admin/documents/…`
- Create: `resources/frontend/src/app/pages/admin/documents/admin-documents.component.*` (+ spec)
- Create: `resources/frontend/src/app/pages/admin/document-form/admin-document-form.component.*` (+ spec)
- Modify: `resources/frontend/src/app/admin.routes.ts`, `app.component.spec.ts`

## Design

### Category labels

Reuse `INTEGRA_CATEGORIES` from `resources/frontend/src/types/integra.ts` (slug → API category).
For the admin UI you also need the human labels, which currently live only in
`BreadcrumbService.integraCategories`. Add an exported constant next to `INTEGRA_CATEGORIES`:

```ts
export const INTEGRA_CATEGORY_LABELS: Record<IntegraCategory, string> = {
  "integra-flyer": "Tájékoztató",
  "integra-trial": "Próbaverzió",
  "integra-documentation": "Dokumentáció",
  "integra-update": "Programfrissítés",
  "integra-other": "Egyéb",
};
```

and have `BreadcrumbService` keep working (do not break its existing map; if you refactor it to
use the new constant, update `breadcrumb.service.spec.ts` accordingly).

### Grid

| Header | Field | Notes |
|---|---|---|
| Kategória | `category` | label from `INTEGRA_CATEGORY_LABELS` |
| Név | `displayName` | wrap |
| Fájl | `fileName` | wrap |
| Verzió | `version` | |
| Közzététel dátuma | `publishedAt` | `formatDisplayDateWithoutDay` |
| Kezelés | — | actions `["edit", "delete"]` |

Header: `<h1>Feltöltések</h1>` + `<a mat-flat-button routerLink="/admin/integra/uj">Új fájl feltöltése</a>`.
Empty state: "Még nincsenek feltöltött fájlok." (legacy `nincs_integra.html`).
Delete dialog: "Fájl törlése" / `Biztosan törölni szeretnéd a(z) „<displayName>” fájlt?` with
`warning: "A feltöltött fájl is véglegesen törlődik."`.

### Form

| Label | Control | Validation |
|---|---|---|
| Kategória | `mat-select` over `INTEGRA_CATEGORY_LABELS` | required |
| Honlapon megjelenő név | `matInput` | required, max 255 |
| Feltöltendő fájl | native `<input type="file">` styled with a Material button | required on create, optional on edit |
| Verzió | `matInput` | required, max 255 |
| Közzététel dátuma | datepicker | required |

The file input is the one control that cannot be a signal-forms field: keep it as a separate
`signal<File | undefined>()` and validate it in `onSubmit` (show a `mat-error`-styled message
when it is missing on create). Give it a real `<label for>` and announce the selected file name
next to it. In edit mode show the current `fileName` and the hint
"Csak akkor válassz fájlt, ha cserélni szeretnéd." (legacy `input-info`).

The request is `FormData`, so the service must **not** set `Content-Type` (let the browser set the
boundary):

```ts
const body = new FormData();
body.set("category", request.category);
body.set("displayName", request.displayName);
body.set("version", request.version);
body.set("publishedAt", request.publishedAt);
if (file) body.set("file", file);
```

Create → `POST /admin/documents`; edit → `POST /admin/documents/{id}` (decision D9 — **not** PUT).

Error mapping: a 422 whose validation errors mention `file` renders the backend message
("Ez a fájl korábban már feltöltésre került!" / "Az új kategóriában ilyen nevű fájl már
létezik.") — `throwHttpError` currently collapses 422 into `INVALID_REQUEST_DATA` and drops the
messages, so for this screen read `error.error.errors` yourself in the component's catch block
before falling back to the generic message. Do not change `throwHttpError`'s behaviour for the
other screens.

Buttons: "Feltöltés" / "Fájl módosítása" + "Mégsem".

Routes (`uj` before `:id`):

```ts
{ path: "integra", …, title: "Admin - INTEGRA" },
{ path: "integra/uj", …, title: "Admin - Új INTEGRA fájl" },
{ path: "integra/:id", …, title: "Admin - INTEGRA fájl szerkesztése" },
```

Mutations invalidate `queryKeys.adminDocuments` and the public `queryKeys.integra()` for every
category.

## Steps

- [ ] **Step 1:** Add `INTEGRA_CATEGORY_LABELS`; keep `breadcrumb.service.spec.ts` green.
- [ ] **Step 2:** Mocks, grid spec, service + grid.
- [ ] **Step 3:** Form spec (cases below), then the form. Use
      `new File(["x"], "test.pdf", { type: "application/pdf" })` and
      `userEvent.upload(input, file)` to drive the file input.
- [ ] **Step 4:** Routes + `app.component.spec.ts` case for `/admin/integra`.
- [ ] **Step 5:** Verify, self review, journal, tick Task 17.

## Tests to write

`admin-documents.component.spec.ts` — loading, rows with category labels and file names, empty
state, error card, edit navigation, delete confirm → `DELETE /admin/documents/1` (and the
warning text is present), cancel → nothing.

`admin-document-form.component.spec.ts`:

- create mode blocks submit until a file is chosen and shows the "kötelező" message
- a valid create submits `FormData` to `POST /admin/documents` containing every field and the
  file (assert on `request.body instanceof FormData` and its `get()` values)
- the request carries no explicit `Content-Type` header
- edit mode prefills the fields, shows the current file name, and submits without a file
- a 422 mentioning `file` renders the backend message verbatim
- a 500 renders the unexpected-error card

## Verification

```bash
cd resources/frontend
npx ng test && npx ng lint && npx tsc -p tsconfig.app.json && npx prettier . --check && npx knip
```

## Self review

- [ ] The file input has a programmatically associated label and its selected file is announced.
- [ ] `Content-Type` is never set manually for the multipart requests.
- [ ] Edit submits to `POST /admin/documents/:id`, matching the backend (a PUT would 405).
- [ ] Public Integra queries are invalidated for **all five** categories after a mutation.
- [ ] `BreadcrumbService` still passes its spec after the label refactor.

## Done when

Uploading, replacing and deleting documents works end to end against the Task 16 API, FE tooling
is green, journal updated, work **left uncommitted**.
