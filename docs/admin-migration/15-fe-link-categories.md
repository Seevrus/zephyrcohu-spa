# Task 15 — FE: link categories admin page

**Type:** Frontend
**Depends on:** Task 12 (reuses `RenameDialogComponent`), Task 14
**Legacy source:** `src/_linkek/_kategoriak/kategoriak.html`, `kategoria.html`, `kategoria_urlap.html`
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

`/admin/linkek/kategoriak` — list link categories with their link counts, rename them, and delete
them. Deleting a category **keeps its links** and moves them to the "Egyéb" group
(decision D8, implemented in Task 13 Part A), so the confirmation must say where they end up.

## Files

- Create: `resources/frontend/src/app/pages/admin/link-categories/admin-link-categories.component.*`
  (+ spec)
- Modify: `resources/frontend/src/app/services/admin-links.query.service.ts` — add
  `updateAdminLinkCategory()` and `deleteAdminLinkCategory()`
- Modify: `resources/frontend/src/app/services/queryKeys.ts` (mutation keys)
- Create: `resources/frontend/src/mocks/admin/links/adminLinkCategoryRequests.ts`
- Modify: `resources/frontend/src/app/admin.routes.ts`, `app.component.spec.ts`

## Design

Grid:

| Header | Field | Notes |
|---|---|---|
| Kategória | `name` | wrap |
| Linkek száma | `linkCount` | numeric |
| Kezelés | — | actions `["edit", "delete"]` |

Header: `<h1>Link kategóriák</h1>` + `<a mat-button routerLink="/admin/linkek">Vissza a linkekhez</a>`.
Empty state: "Még nincsenek kategóriák." (legacy `nincs_kategoria.html`).

**Rename** — reuse `RenameDialogComponent` from Task 12 with
`title: "Kategória átnevezése"`, `label: "Kategória"`. A 422 shows either
"Ilyen nevű kategória már létezik." (duplicate) or the backend's "Ez a kategórianév foglalt."
(the reserved name "Egyéb"), and keeps the dialog open.

**Delete** — `ConfirmDialogComponent` with:

- `title: "Kategória törlése"`
- `message: 'Biztosan törölni szeretnéd a(z) „<name>” kategóriát?'`
- when `linkCount > 0`:
  `warning: 'A kategóriához tartozó <linkCount> link megmarad, és az „Egyéb” csoportba kerül.'`

Note the wording is reassurance, not a warning about loss — nothing is destroyed but the grouping.
Keep it in the `warning` slot anyway so it is visually prominent.

Mutations invalidate `queryKeys.adminLinkCategories`, `queryKeys.adminLinks` and the public
`queryKeys.links`.

Route: `{ path: "linkek/kategoriak", …, title: "Admin - Link kategóriák" }` — before `linkek/:id`.

## Steps

- [ ] **Step 1:** Mocks for `PUT`/`DELETE /admin/link-categories/:id`.
- [ ] **Step 2:** Spec first (cases below), then the page.
- [ ] **Step 3:** Route + an `app.component.spec.ts` case proving `/admin/linkek/kategoriak`
      renders the categories page and not the link form.
- [ ] **Step 4:** Verify, self review, journal, tick Task 15.

## Tests to write

`admin-link-categories.component.spec.ts`:

- loading, then rows with names and link counts
- empty state
- error card on 500
- rename dialog → `PUT /admin/link-categories/2` with `{ name }`
- rename 422 keeps the dialog open with the duplicate message
- renaming to "Egyéb" surfaces the reserved-name message from the backend
- delete dialog says the links move to "Egyéb", with the right count, when `linkCount > 0`
- delete dialog shows no such line when `linkCount === 0`
- confirming delete fires `DELETE /admin/link-categories/2`; cancelling fires nothing

## Verification

```bash
cd resources/frontend
npx ng test && npx ng lint && npx tsc -p tsconfig.app.json && npx prettier . --check && npx knip
```

## Self review

- [ ] The delete dialog states the exact number of links and that they survive under "Egyéb" —
      no wording implying deletion.
- [ ] `RenameDialogComponent` was reused, not forked.
- [ ] Both the admin links grid and the public links page are invalidated after a delete.
- [ ] The route precedes `linkek/:id`, proven by a spec.

## Done when

Renaming and deleting categories works with the correct warnings, FE tooling is green, journal
updated, work **left uncommitted**.
