# Task 14 — FE: links admin grid + form

**Type:** Frontend
**Depends on:** Task 03, Task 13
**Legacy source:** `src/_linkek/linkek.html`, `link.html`, `link_urlap.html`, `link_urlap.js`
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

`/admin/linkek` (grid), `/admin/linkek/uj` and `/admin/linkek/:id` (form) — manage the useful
links shown on `/tudasbazis/linkek`.

## Files

- Create: `resources/frontend/src/types/admin-links.ts`
- Create: `resources/frontend/src/app/services/admin-links.query.service.ts`
- Modify: `resources/frontend/src/app/services/queryKeys.ts`
- Create: `resources/frontend/src/mocks/admin/links/…`
- Create: `resources/frontend/src/app/pages/admin/links/admin-links.component.*` (+ spec)
- Create: `resources/frontend/src/app/pages/admin/link-form/admin-link-form.component.*` (+ spec)
- Modify: `resources/frontend/src/app/admin.routes.ts`, `app.component.spec.ts`

## Design

### Grid

| Header | Field | Notes |
|---|---|---|
| Kategória | `category?.name` | wrap; `null` renders as "Egyéb" — the admin API sends `category: null` for uncategorised links (Task 13) and leaves the fallback wording to the client |
| Hivatkozás szövege | `title` | wrap |
| Hivatkozás URI címe | `url` | rendered as an `<a target="_blank" rel="noopener noreferrer">` via a tiny cell renderer or `cellRenderer` returning a link — reuse the pattern of `integra-document-link-cell-renderer` if a component is needed |
| Kezelés | — | actions `["edit", "delete"]` |

Header: `<h1>Linkek kezelése</h1>` + `<a mat-flat-button routerLink="/admin/linkek/uj">Új link felvétele</a>`
+ `<a mat-button routerLink="/admin/linkek/kategoriak">Kategóriák</a>`.
Empty state: "Még nincsenek linkek az oldalon." (legacy `nincs_link.html`).
Delete dialog: "Link törlése" / `Biztosan törölni szeretnéd a(z) „<title>” linket?`.

### Form

| Label | Control | Validation |
|---|---|---|
| Kategória | `mat-select`: "Egyéb (nincs kategória)" + the existing categories + a "+ Új kategória" option that reveals a text input | required (the "Egyéb" option is a valid choice, not an empty one) |
| Hivatkozás szövege | `matInput` | required, max 500 |
| Hivatkozás URI címe | `matInput`, hint "Kötelezően a protokollal együtt! (pl.: „https://”)" | required, max 500, must start with `http://` or `https://` |

The category select is fed by `GET /admin/link-categories` (the same service). Whatever the admin
picks or types is sent as `categoryName` — the backend resolves or creates it (Task 13) — except
the "Egyéb (nincs kategória)" option, which sends `categoryName: null` and leaves the link
uncategorised; the public page then groups it under "Egyéb". The request type is therefore
`categoryName: string | null`.

Do **not** offer "Egyéb" as a creatable category name: the backend rejects it as reserved with
422 "Ez a kategórianév foglalt.". Surface that message if it ever comes back, but also keep the
"+ Új kategória" input from submitting it in the first place.

Model the "new category" branch as a `linkedSignal`/`computed` on the model, and make the extra
input `required` only while that branch is active (`applyWhen`/`required` inside the schema on a
condition; if that turns out awkward with signal forms, validate it in `onSubmit` and set a
`mat-error` — whichever you choose, say so in the journal).

URL validation: a `pattern` validator with `/^https?:\/\/.+/i` and the message
"A cím protokollal együtt adható meg (pl.: https://)". The backend's `url` rule is the backstop.

Buttons: "Beküldés" / "Link módosítása" + "Mégsem".

Routes — `uj` and `kategoriak` before `:id`:

```ts
{ path: "linkek", …, title: "Admin - Hasznos linkek" },
{ path: "linkek/uj", …, title: "Admin - Új link" },
{ path: "linkek/kategoriak", …, title: "Admin - Link kategóriák" },  // Task 15
{ path: "linkek/:id", …, title: "Admin - Link szerkesztése" },
```

Service `AdminLinksQueryService`: `getAdminLinks()`, `getAdminLink(id)`,
`getAdminLinkCategories()`, `createAdminLink()`, `updateAdminLink()`, `deleteAdminLink()`.
Mutations invalidate the admin link keys, the admin category key (a new category may have been
created) and the public `queryKeys.links`.

## Steps

- [ ] **Step 1:** Mocks, grid spec, service + grid.
- [ ] **Step 2:** Form spec (cases below), then the form.
- [ ] **Step 3:** Routes + `app.component.spec.ts` case for `/admin/linkek`.
- [ ] **Step 4:** Verify, self review, journal, tick Task 14.

## Tests to write

`admin-links.component.spec.ts` — loading, rows with category and clickable URL, empty state,
error card, edit navigation, delete confirm → `DELETE /admin/links/1`, cancel → no request.

`admin-link-form.component.spec.ts`:

- loads the categories and lists them in the select, with "Egyéb (nincs kategória)" first
- submitting with an existing category sends `categoryName` equal to that category's name
- choosing "+ Új kategória", typing a name and submitting sends the typed name
- choosing "Egyéb (nincs kategória)" sends `categoryName: null`
- an uncategorised link loaded in edit mode preselects the "Egyéb (nincs kategória)" option
- an URL without a protocol shows the pattern error and blocks submit
- edit mode prefills all three fields from `GET /admin/links/1` and submits `PUT`
- 422 → invalid-data message; 500 → unexpected-error card

## Verification

```bash
cd resources/frontend
npx ng test && npx ng lint && npx tsc -p tsconfig.app.json && npx prettier . --check && npx knip
```

## Self review

- [ ] External links carry `rel="noopener noreferrer"` with `target="_blank"`.
- [ ] The "new category" input is only required while that branch is selected, and is cleared
      when the admin switches back to an existing category.
- [ ] The public links query is invalidated by every mutation.
- [ ] Grid actions have aria-labels naming the link.

## Done when

Both screens work, FE tooling is green, journal updated, work **left uncommitted**.
