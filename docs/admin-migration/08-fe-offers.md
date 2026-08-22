# Task 08 — FE: offers admin grid + form

**Type:** Frontend
**Depends on:** Task 03, Task 06 (pattern), Task 07
**Legacy source:** `src/_ajanlatok/ajanlatok.html`, `ajanlat.html`, `ajanlat_urlap.html`
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

`/admin/ajanlatok` (grid), `/admin/ajanlatok/uj` and `/admin/ajanlatok/:id` (form) — the offers
equivalent of Tasks 05 and 06, in one task because offers have no readers and therefore less
surface.

## Files

- Create: `resources/frontend/src/types/admin-offers.ts`
- Create: `resources/frontend/src/app/services/admin-offers.query.service.ts`
- Modify: `resources/frontend/src/app/services/queryKeys.ts`
- Create: `resources/frontend/src/mocks/admin/offers/` — `adminOffersRequest.ts`,
  `createGetAdminOffersOkResponse.ts`, `createGetAdminOfferItemOkResponse.ts`,
  `saveAdminOfferRequest.ts`, `deleteAdminOfferRequest.ts`
- Create: `resources/frontend/src/app/pages/admin/offers/admin-offers.component.*` (+ spec)
- Create: `resources/frontend/src/app/pages/admin/offer-form/admin-offer-form.component.*` (+ spec)
- Modify: `resources/frontend/src/app/admin.routes.ts`, `app.component.spec.ts`

## Design

Everything follows Tasks 05 and 06. The differences:

**Types** — `AdminOfferResponse` is `AdminNewsResponse` minus `readers`/`readerCount`; reuse the
existing public `OfferResponse` shape from `types/offers.ts` if it already matches (it does,
field for field) and only add the request type:

```ts
export type SaveAdminOfferRequest = {
  audience: "A" | "P";
  title: string;
  mainContent: string;
  additionalContent: string | null;
  publishedAt: string;
};
```

If you can build `types/admin-offers.ts` purely by re-exporting `OfferResponse`, do that instead
of duplicating the shape — but do not modify `types/offers.ts` itself.

**Service** — `AdminOffersQueryService` with `getAdminOffers()`, `getAdminOfferItem(id)`,
`createAdminOffer()`, `updateAdminOffer()`, `deleteAdminOffer()`. Mutations invalidate the admin
keys **and** the public `queryKeys.offers()` / `queryKeys.offerItem(id)`.

**Grid columns** (legacy `ajanlat.html` order):

| Header | Field | Notes |
|---|---|---|
| Kiknek szól | `audience` | "Mindenki" / "Regisztrált felhasználók" |
| Cím | `title` | wrap |
| Közzététel dátuma | `publishedAt` | `formatDisplayDateWithoutDay` |
| Kezelés | — | actions `["edit", "delete"]` |

Header: `<h1>Ajánlatok kezelése</h1>` + `<a mat-flat-button routerLink="/admin/ajanlatok/uj">Új ajánlat készítése</a>`.
Empty state: "Még nincsenek ajánlatok az oldalon." (legacy `nincs_ajanlat.html`).
Delete dialog: title "Ajánlat törlése", message
`Biztosan törölni szeretnéd a(z) „<title>” című ajánlatot?`.

**Form fields**: Kiknek szól, Cím, Közzététel dátuma, "Ajánlat fő szövege" (rich text, required),
"További szöveg (lenyitható)" (rich text, optional). Buttons: "Beküldés" / "Ajánlat módosítása",
plus a "Mégsem" link back to the grid.

**Routes** (`uj` before `:id`):

```ts
{ path: "ajanlatok", …, title: "Admin - Ajánlatok" },
{ path: "ajanlatok/uj", …, title: "Admin - Új ajánlat" },
{ path: "ajanlatok/:id", …, title: "Admin - Ajánlat szerkesztése" },
```

## Steps

- [ ] **Step 1:** Mocks first, then the grid spec (same case list as Task 05 minus the readers
      case), then implement service + grid.
- [ ] **Step 2:** Form spec (same case list as Task 06), then implement the form.
- [ ] **Step 3:** Register the three routes; extend `app.component.spec.ts` with an admin-renders
      / non-admin-404s case for `/admin/ajanlatok`.
- [ ] **Step 4:** Verify, self review, journal, tick Task 08.

## Tests to write

- `admin-offers.component.spec.ts` — loading, list rendering incl. an unpublished offer, empty
  state, error card, edit navigation, delete confirm → DELETE fired, cancel → no request.
- `admin-offer-form.component.spec.ts` — create mode (valid submit → POST + navigate; disabled
  while invalid; 422 message; 500 card), edit mode (GET prefills; PUT on submit).
- `app.component.spec.ts` — `/admin/ajanlatok` for admin vs non-admin.

## Verification

```bash
cd resources/frontend
npx ng test && npx ng lint && npx tsc -p tsconfig.app.json && npx prettier . --check && npx knip
```

## Self review

- [ ] No copy-paste drift from Task 05/06: shared behaviour that turned out identical (date
      conversion, error message mapping) is imported, not re-typed.
- [ ] Public offer queries are invalidated by every offer mutation.
- [ ] Icon actions carry the offer title in their aria-labels.
- [ ] `types/offers.ts` and the public offers pages are untouched.

## Done when

Both screens work, the FE tooling is green, journal updated, work **left uncommitted**.
