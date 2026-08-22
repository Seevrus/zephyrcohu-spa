# Task 05 — FE: news admin grid

**Type:** Frontend
**Depends on:** Task 03, Task 04
**Legacy source:** `src/_hirek/hirek.GET.php` + `hirek.html` + `hir.html`
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

`/admin/hirek` — an ag-grid listing every news item (published or not) with the legacy columns,
an edit action, a delete action behind the shared confirm dialog, and a link to the create form.

This is the **pattern task** for every other admin grid.

## Files

- Create: `resources/frontend/src/types/admin-news.ts`
- Create: `resources/frontend/src/app/services/admin-news.query.service.ts`
- Modify: `resources/frontend/src/app/services/queryKeys.ts`
- Create: `resources/frontend/src/mocks/admin/news/adminNewsRequest.ts`
- Create: `resources/frontend/src/mocks/admin/news/createGetAdminNewsOkResponse.ts`
- Create: `resources/frontend/src/mocks/admin/news/deleteAdminNewsRequest.ts`
- Create: `resources/frontend/src/app/pages/admin/news/admin-news.component.ts` (+ `.html`,
  `.scss`, `.spec.ts`)
- Modify: `resources/frontend/src/app/admin.routes.ts`
- Modify: `resources/frontend/src/app/app.component.spec.ts`
- **Delete:** `resources/frontend/src/app/pages/admin/home/` (the whole folder — the Task 02
  scaffolding landing page, see "Retiring the admin landing page" below)

## Design

### Types (`types/admin-news.ts`)

```ts
export type AdminNewsResponse = {
  id: number;
  audience: "A" | "P";
  title: string;
  mainContent: string;
  additionalContent: string | null;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  readerCount: number;
  readers: string[];
};

export type AdminNewsItem = Omit<AdminNewsResponse, "publishedAt" | "createdAt" | "updatedAt"> & {
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminNewsCollectionResponse = { data: AdminNewsResponse[] };
export type AdminNewsItemResponse = { data: AdminNewsResponse };

export type SaveAdminNewsRequest = {
  audience: "A" | "P";
  title: string;
  mainContent: string;
  additionalContent: string | null;
  publishedAt: string;   // ISO date string
};
```

### Service (`admin-news.query.service.ts`)

`@Service()` class following `news.query.service.ts` to the letter (`inject(HttpClient)`,
`inject(QueryClient)`, `queryOptions`/`mutationOptions`, `lastValueFrom`, `catchError` →
`throwHttpError`). Members needed by this task, plus the two the form task (06) will use:

- `getAdminNews()` — `GET /admin/news`, maps date strings to `Date`, and seeds the per-item cache
  with `queryClient.setQueryData(queryKeys.adminNewsItem(id), item)` the way
  `NewsQueryService.mapNewsResponse` does.
- `getAdminNewsItem(id: number | undefined)` — `GET /admin/news/{id}`, `enabled: id !== undefined`.
- `createAdminNews()` — `POST /admin/news`.
- `updateAdminNews()` — `PUT /admin/news/{id}`, variables `{ id, request }`.
- `deleteAdminNews()` — `DELETE /admin/news/{id}`, variables `id`.

Every mutation invalidates `queryKeys.adminNews` **and** the public `queryKeys.news()` /
`queryKeys.newsItem(id)` in `onSuccess` — an admin edit must not leave the public pages showing
stale content in the same tab.

New keys in `queryKeys.ts`:

```ts
adminNews: ["admin_news"],
adminNewsItem(id?: number) { return id ? ["admin_news_item", id] : ["admin_news_item"]; },
```

and mutation keys `createAdminNews`, `updateAdminNews`, `deleteAdminNews`.

### Page

Host class `app-admin-news`, `data-testid="admin-news-component"`, layout
`@include mixins.zephyr-admin-main`, grid wrapper `@include mixins.zephyr-grid`.

States, mirroring `pages/integra/integra.component.html`:

- error → `<app-form-unexpected-error />`
- loading → `<mat-progress-bar mode="indeterminate" />`
- empty → the legacy sentence: "Még nincsenek hírek az oldalon."
- otherwise → the grid

Header row above the grid: an `<h1>Hírek kezelése</h1>` and a
`<a mat-flat-button routerLink="/admin/hirek/uj">Új hír írása</a>`.

Columns (legacy order and labels):

| Header | Field | Notes |
|---|---|---|
| Kinek szól | `audience` | valueFormatter: `P` → "Mindenki", `A` → "Regisztrált felhasználók" |
| Cím | `title` | `wrapText`, `autoHeight` |
| Közzététel dátuma | `publishedAt` | `cellDataType: "date"`, `formatDisplayDateWithoutDay` |
| Olvasottság | `readerCount` | numeric |
| Olvasók | `readers` | `wrapText`, `autoHeight`, valueFormatter joins with `"; "` |
| Kezelés | — | `AdminActionsCellRendererComponent`, actions `["edit", "delete"]` |

Use `adminGridModules`, `adminGridAutoSizeStrategy`, `adminPaginationPanels`,
`adminGridLocaleText` from `shared/admin-grid.ts` and `zephyrGridTheme` from
`shared/ag-grid-theme.ts`.

Row actions:

- `edit` → `router.navigate(["/admin/hirek", row.id])`
- `delete` → open `ConfirmDialogComponent` with
  `title: "Hír törlése"`, `message: 'Biztosan törölni szeretnéd a(z) „<title>” című hírt?'`;
  on `true`, run the delete mutation. While it is pending show the progress bar; on failure show
  `<app-form-unexpected-error />` above the grid.

An unpublished item (publishedAt in the future) should be visually marked — add a
`cellClass` on the date column that applies a muted style, and state in the spec that a future
date renders with that class. Keep it subtle; contrast must stay AA.

### Retiring the admin landing page

Task 02 created `pages/admin/home/` purely so the guard had a positive case to assert before any
real admin screen existed. This task gives `/admin` a genuine destination, so the landing page
goes:

- delete `resources/frontend/src/app/pages/admin/home/` (component, styles and spec)
- replace the index entry in `admin.routes.ts`:

```ts
export const adminRoutes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "hirek" },
  {
    path: "hirek",
    async loadComponent() { … },
    title: "Admin - Hírek",
  },
];
```

- in `app.component.spec.ts`, replace the Task 02 assertion "an admin at `/admin` sees
  `admin-home-component`" with "an admin at `/admin` is redirected to `/admin/hirek` and sees
  `admin-news-component`". Keep every non-admin case exactly as it is — the guard still has to
  404 them at `/admin` and at `/admin/hirek`.
- `pathMatch: "full"` is required; without it the empty path would match every child URL.

## Steps

- [ ] **Step 1:** Write the mocks (`adminNewsRequest.ts` with `matchAdminNewsRequest()`,
      `matchAdminNewsItemRequest(id)`, `createGetAdminNewsOkResponse(overrides)`,
      `matchDeleteAdminNewsRequest(id)`), copying the shape of `src/mocks/news/*`.
- [ ] **Step 2:** Write `admin-news.component.spec.ts` first, with a `renderAdminNews()` helper
      returning `{ ...renderResult, httpTesting }` (see
      `pages/integra/integra.component.spec.ts`). Cases listed below. Run `npx ng test` → red.
- [ ] **Step 3:** Add the query keys and implement `admin-news.query.service.ts`.
- [ ] **Step 4:** Implement the component/template/styles until the spec is green.
- [ ] **Step 5:** Register the route in `admin.routes.ts`:
      `{ path: "hirek", loadComponent: …, title: "Admin - Hírek" }`.
- [ ] **Step 6:** Retire the landing page: delete `pages/admin/home/`, add the
      `{ path: "", pathMatch: "full", redirectTo: "hirek" }` index entry, and update the Task 02
      routing assertions in `app.component.spec.ts` (see "Retiring the admin landing page").
- [ ] **Step 7:** Add the `app.component.spec.ts` cases: an admin session at `/admin/hirek`
      renders `admin-news-component`; an admin at `/admin` lands on the same component through
      the redirect; a non-admin gets `not-found-component` at both URLs.
- [ ] **Step 8:** Verify (full FE set — `knip` must now be clean again, including the Task 03
      shared exports and with no leftovers from the deleted landing page), self review, journal,
      tick Task 05.

## Tests to write

`admin-news.component.spec.ts`:

- shows a progress bar while loading
- renders every news item, including an unpublished one
- shows the readers and the reader count
- shows the empty-state sentence when the API returns `[]`
- shows the unexpected-error card when the request fails (500)
- clicking the edit action navigates to `/admin/hirek/:id`
  (assert with a `provideRouter` spy: `vi.spyOn(router, "navigate")`)
- clicking the delete action opens the confirm dialog, and confirming fires
  `DELETE /admin/news/:id` (flush it and `httpTesting.verify()`)
- cancelling the dialog fires no request

## Verification

```bash
cd resources/frontend
npx ng test
npx ng lint
npx tsc -p tsconfig.app.json
npx prettier . --check
npx knip
```

## Self review

- [ ] The grid page never mutates query data directly; it goes through the service's mutations.
- [ ] Public news queries are invalidated on delete, not just the admin ones.
- [ ] Every icon action has an aria-label containing the news title.
- [ ] The empty, error and loading branches are mutually exclusive and all reachable in the spec.
- [ ] No `ngClass`/`ngStyle`; native control flow only; no explicit `standalone`/`OnPush`.
- [ ] The page is capped at `$widescreen`, not `$desktop-width`.
- [ ] `pages/admin/home/` is gone, nothing imports `AdminHomeComponent`, and `/admin` redirects
      to `/admin/hirek` for an admin while still 404-ing for everyone else.

## Done when

Spec, lint, typecheck, prettier and knip are clean, the route renders for an admin and 404s for
everyone else, journal updated, work **left uncommitted**.
