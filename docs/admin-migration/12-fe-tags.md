# Task 12 — FE: tags admin page

**Type:** Frontend
**Depends on:** Task 03, Task 11
**Legacy source:** `src/_tudasbazis/_cimkek/cimkek.html`, `cimke.html`, `cimke_urlap.html`
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

`/admin/tudasbazis/cimkek` — a grid of knowledgebase tags with inline rename and delete. No
create screen: tags are born when an article is saved.

## Files

- Create: `resources/frontend/src/types/admin-tags.ts`
- Create: `resources/frontend/src/app/services/admin-tags.query.service.ts`
- Modify: `resources/frontend/src/app/services/queryKeys.ts`
- Create: `resources/frontend/src/mocks/admin/tags/…`
- Create: `resources/frontend/src/app/pages/admin/tags/admin-tags.component.*` (+ spec)
- Modify: `resources/frontend/src/app/admin.routes.ts`, `app.component.spec.ts`

## Design

Grid columns:

| Header | Field | Notes |
|---|---|---|
| Címke | `name` | wrap |
| Cikkek száma | `count` | numeric |
| Kezelés | — | actions `["edit", "delete"]` |

Header: `<h1>Tudásbázis címkék</h1>`.
Empty state: "Még nincsenek címkék." (legacy `nincs_cimke.html`).

**Rename** — the legacy admin had a separate edit page for a single text field; here the `edit`
action opens a small Material dialog with one required text field ("Címke") and Save/Cancel.
Build it as `RenameDialogComponent` in
`resources/frontend/src/app/components/rename-dialog/` (title, label, initial value, and a
`confirmLabel` in its data contract) so Task 15 can reuse it for link categories — that reuse is
the reason it is generic rather than tag-specific. It returns the new name or `undefined`.

- signal form with a single `required` field
- `Enter` submits, `Escape` cancels
- a 422 from the API (duplicate name) shows "Ilyen nevű címke már létezik." inside the dialog and
  keeps it open

**Delete** — the shared `ConfirmDialogComponent`:
title "Címke törlése", message `Biztosan törölni szeretnéd a(z) „<name>” címkét?`, and when
`count > 0` a `warning`: `A címke <count> cikkről kerül eltávolításra. A cikkek megmaradnak.`

Service `AdminTagsQueryService`: `getAdminTags()`, `updateAdminTag()` (`{ id, name }`),
`deleteAdminTag()` (`id`). Both mutations invalidate `queryKeys.adminTags`, the public
`queryKeys.knowledgebaseTags`, and `queryKeys.knowledgebase()` (article payloads embed tags).

Route: `{ path: "tudasbazis/cimkek", …, title: "Admin - Címkék" }` — **before** `tudasbazis/:id`.

## Steps

- [ ] **Step 1:** Write `rename-dialog.component.spec.ts` (renders label + initial value; Save
      returns the trimmed value; Cancel returns `undefined`; empty value disables Save; an error
      message can be displayed) and implement the dialog.
- [ ] **Step 2:** Mocks, then `admin-tags.component.spec.ts`, then service + page.
- [ ] **Step 3:** Route + `app.component.spec.ts` case, making sure `/admin/tudasbazis/cimkek`
      renders the tags page and **not** the article form.
- [ ] **Step 4:** Verify, self review, journal, tick Task 12.

## Tests to write

`admin-tags.component.spec.ts`:

- loading spinner, then the tag rows with their counts
- empty state
- error card on 500
- edit action opens the rename dialog; saving fires `PUT /admin/tags/1` with `{ name }`
- a 422 on rename keeps the dialog open with the duplicate message
- delete action opens the confirm dialog with the "N cikkről kerül eltávolításra" warning when
  the tag is in use, and firing it sends `DELETE /admin/tags/1`
- cancelling either dialog fires no request

## Verification

```bash
cd resources/frontend
npx ng test && npx ng lint && npx tsc -p tsconfig.app.json && npx prettier . --check && npx knip
```

## Self review

- [ ] `RenameDialogComponent` has no tag-specific wording baked in (Task 15 reuses it).
- [ ] Both dialogs manage focus and can be dismissed with `Escape`.
- [ ] Public knowledgebase queries are invalidated after a rename — a stale tag cloud in the same
      tab would be a visible bug.
- [ ] The route sits before `tudasbazis/:id` and a spec proves the ordering.

## Done when

The tags page renames and deletes tags, FE tooling is green, journal updated, work **left
uncommitted**.
