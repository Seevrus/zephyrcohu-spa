# Task 10 — FE: knowledgebase admin grid + form

**Type:** Frontend
**Depends on:** Task 03, Task 06 (pattern), Task 09
**Legacy source:** `src/_tudasbazis/tudasbazis.html`, `tudasbazis_cikk.html`, `tudasbazis_urlap.html`, `cimkek.js`
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

`/admin/tudasbazis` (grid), `/admin/tudasbazis/uj` and `/admin/tudasbazis/:id` (form) — the
knowledgebase equivalent of Tasks 05/06, with tag selection replacing the legacy checkbox +
`83*H#bkn-` hack.

## Files

- Create: `resources/frontend/src/types/admin-knowledgebase.ts`
- Create: `resources/frontend/src/app/services/admin-knowledgebase.query.service.ts`
- Modify: `resources/frontend/src/app/services/queryKeys.ts`
- Create: `resources/frontend/src/mocks/admin/knowledgebase/…` (list, item, save, delete matchers
  + OK-response builders)
- Create: `resources/frontend/src/app/pages/admin/knowledgebase/admin-knowledgebase.component.*` (+ spec)
- Create: `resources/frontend/src/app/pages/admin/knowledgebase-form/admin-knowledgebase-form.component.*` (+ spec)
- Modify: `resources/frontend/src/app/admin.routes.ts`, `app.component.spec.ts`

## Design

### Grid columns (legacy `tudasbazis_cikk.html` order)

| Header | Field | Notes |
|---|---|---|
| Kiknek szól | `audience` | "Mindenki" / "Regisztrált felhasználók" |
| Cím | `title` | wrap |
| Címkék | `tags` | valueFormatter: names joined with `"; "`, sorted |
| Közzététel dátuma | `publishedAt` | `formatDisplayDateWithoutDay` |
| Olvasottság | `readerCount` | numeric |
| Olvasók | `readers` | joined with `"; "`, wrap |
| Kezelés | — | actions `["edit", "delete"]` |

Header: `<h1>Tudásbázis cikkek</h1>` + `<a mat-flat-button routerLink="/admin/tudasbazis/uj">Új cikk írása</a>`
+ `<a mat-button routerLink="/admin/tudasbazis/cimkek">Címkék kezelése</a>`.
Empty state: "Még nincsenek tudásbázis cikkek az oldalon." (legacy `nincs_tudasbazis_cikk.html`).
Delete dialog: "Tudásbázis cikk törlése" / `Biztosan törölni szeretnéd a(z) „<title>” című cikket?`.

### Form

Fields, in legacy order:

| Label | Control | Validation |
|---|---|---|
| Kiknek szól | `mat-select` (`P` / `A`) | required |
| Cím | `matInput` | required, max 255 |
| Címkék | `mat-chip-grid` (see below) | optional |
| Közzététel dátuma | datepicker | required |
| Cikk fő szövege | `app-rich-text-editor` | required |
| További szöveg (lenyitható) | `app-rich-text-editor` | optional |

**Tag input** — Angular Material chips with autocomplete, replacing the legacy checkbox list +
"press Enter to add" input:

- `<mat-chip-grid>` holding one removable chip per selected tag name
- an input with `<mat-autocomplete>` offering the existing tags, loaded from the **public**
  `GET /knowledgebase/tags` endpoint through the existing `KnowledgebaseQueryService`
  (`queryKeys.knowledgebaseTags`) — no new endpoint needed; it returns every tag with counts
- typing a name that does not exist and pressing Enter adds it as a new chip (the backend creates
  it on save, decision D7)
- duplicates are ignored, whitespace is trimmed
- the chip grid needs `<mat-label>Címkék</mat-label>` and each chip's remove button an
  `aria-label` such as `Címke eltávolítása: INTEGRA`

The form model holds `tags: string[]`, sent verbatim in the request body.

Buttons: "Beküldés" / "Cikk módosítása" + "Mégsem".

### Routes

```ts
{ path: "tudasbazis", …, title: "Admin - Tudásbázis" },
{ path: "tudasbazis/uj", …, title: "Admin - Új tudásbázis cikk" },
{ path: "tudasbazis/cimkek", …, title: "Admin - Címkék" },   // added by Task 12 — keep the slot free
{ path: "tudasbazis/:id", …, title: "Admin - Tudásbázis cikk szerkesztése" },
```

`uj` and `cimkek` **must** precede `:id`.

## Steps

- [ ] **Step 1:** Mocks, then the grid spec, then service + grid (Task 05 shape).
- [ ] **Step 2:** Form spec including the tag cases below, then the form.
- [ ] **Step 3:** Routes + `app.component.spec.ts` cases for `/admin/tudasbazis`.
- [ ] **Step 4:** Verify, self review, journal, tick Task 10.

## Tests to write

`admin-knowledgebase.component.spec.ts` — loading, list incl. unpublished, tag column rendering,
readers, empty state, error card, edit navigation, delete confirm → DELETE, cancel → no request.

`admin-knowledgebase-form.component.spec.ts`:

- create mode renders empty fields and loads the tag list (`GET /knowledgebase/tags`)
- selecting an existing tag from the autocomplete adds a chip
- typing a new name and pressing Enter adds a chip
- adding the same tag twice keeps one chip
- removing a chip drops it from the payload
- a valid submit fires `POST /admin/knowledgebase` with `tags: ["…"]` in the body
- edit mode prefills chips from the loaded article and submits `PUT /admin/knowledgebase/1`
- 422 → invalid-data message; 500 → unexpected-error card

## Verification

```bash
cd resources/frontend
npx ng test && npx ng lint && npx tsc -p tsconfig.app.json && npx prettier . --check && npx knip
```

## Self review

- [ ] The tag chips are keyboard-operable end to end (add via Enter, remove via the chip's
      remove button and Backspace) and every interactive element has an accessible name.
- [ ] The tag list query reuses `KnowledgebaseQueryService`/`queryKeys.knowledgebaseTags` instead
      of a duplicated request.
- [ ] Knowledgebase mutations invalidate the public `queryKeys.knowledgebase()`,
      `queryKeys.knowledgebaseItem(id)` **and** `queryKeys.knowledgebaseTags`.
- [ ] Tag names are trimmed before they enter the model, so the backend never sees `" INTEGRA"`.
- [ ] The rich text editors follow the Task 06 jsdom note (no TinyMCE typing in specs).

## Done when

Both screens work, FE tooling is green, journal updated, work **left uncommitted**.
