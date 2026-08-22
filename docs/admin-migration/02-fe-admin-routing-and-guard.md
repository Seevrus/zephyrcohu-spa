# Task 02 — FE: admin routing and guard

**Type:** Frontend
**Depends on:** Task 01
**Unblocks:** every other frontend task
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

Give the SPA an `/admin` branch that only administrators can reach. A non-admin (guest or plain
user) who types `/admin/...` must see the existing `NotFoundComponent`, with the URL they typed
left untouched — the admin area must not announce itself (decision D3).

## Files

- Create: `resources/frontend/src/app/guards/admin.guard.ts`
- Create: `resources/frontend/src/app/guards/admin.guard.spec.ts`
- Create: `resources/frontend/src/app/admin.routes.ts`
- Create: `resources/frontend/src/app/pages/admin/home/admin-home.component.ts` (inline template)
  — **temporary, deleted in Task 05**
- Create: `resources/frontend/src/app/pages/admin/home/admin-home.component.scss` — temporary
- Create: `resources/frontend/src/app/pages/admin/home/admin-home.component.spec.ts` — temporary
- Modify: `resources/frontend/src/app/app.routes.ts`
- Modify: `resources/frontend/src/app/app.component.spec.ts` (routing assertions)

## Design

### The guard

`canMatch`, not `canActivate`: when it returns `false` the router keeps matching and the `**`
route renders `NotFoundComponent` without a redirect. Model it on
`resources/frontend/src/app/guards/user.guard.ts` — same `QueryClient.ensureQueryData` +
`UsersQueryService.session()` pattern, so the session request is shared and cached.

```ts
import { inject } from "@angular/core";
import { type CanMatchFn } from "@angular/router";
import { QueryClient } from "@tanstack/angular-query-experimental";

import { queryKeys } from "../services/queryKeys";
import { UsersQueryService } from "../services/users.query.service";

export const adminGuard: CanMatchFn = async () => {
  const queryClient = inject(QueryClient);
  const usersQueryService = inject(UsersQueryService);

  try {
    const session = await queryClient.ensureQueryData({
      queryKey: queryKeys.session,
      queryFn: usersQueryService.session().queryFn,
    });

    return session?.isAdmin === true;
  } catch {
    return false;
  }
};
```

### The route tree

`app.routes.ts` gains one entry, placed **before** the `**` wildcard:

```ts
{
  path: "admin",
  canMatch: [adminGuard],
  async loadChildren() {
    const { adminRoutes } = await import("./admin.routes");
    return adminRoutes;
  },
},
```

`admin.routes.ts` starts with the temporary landing page only; later tasks add their screens to this same
array, keeping the ordering rule from the overview (`cimkek` before `:id`, `kategoriak` before
`:id`):

```ts
import { type Routes } from "@angular/router";

export const adminRoutes: Routes = [
  {
    path: "",
    async loadComponent() {
      const { AdminHomeComponent } =
        await import("./pages/admin/home/admin-home.component");
      return AdminHomeComponent;
    },
    title: "Admin",
  },
];
```

Route titles all start with `Admin - ` (for example `Admin - Hírek`). `AppTitleStrategy`
forwards unknown titles to `BreadcrumbService`, so the breadcrumb reads the same — no
`BreadcrumbService` change is needed.

### The landing page — deliberately temporary

Nothing in the SPA navigates to bare `/admin`: "Admin funkciók" in
`header/desktop-nav/desktop-nav.component.html` is a `(click)` toggle, not a link, and every
`app-admin-nav` item points at a section. `/admin` is only reachable by typing it.

This component exists so **this task can prove its own happy path**. A non-admin at `/admin`
renders `NotFoundComponent` — but so would an admin if no child route matched, which makes
"the guard denied" and "the route tree is empty" indistinguishable at the routing level. A page
under `/admin` removes that ambiguity for the duration of Task 02.

**Task 05 deletes it** and replaces the index route with
`{ path: "", pathMatch: "full", redirectTo: "hirek" }`, once the news grid gives `/admin` a real
destination. Do not build on it, and do not link to it.

Content, from the legacy admin index (`src/_kezdolap/index.GET.php`): one sentence,
"Ez az admin felület. Kérlek, ne felejts el kijelentkezni." Inline template (it is tiny),
`data-testid="admin-home-component"`, host class `app-admin-home`, and
`@include mixins.zephyr-main;` for layout. It stays on `zephyr-main` for its whole short life —
the wide `zephyr-admin-main` mixin arrives in Task 03 and this page is gone by Task 05.

## Steps

- [ ] **Step 1: Write `admin.guard.spec.ts` first.** Follow
      `resources/frontend/src/app/guards/integra-category.guard.spec.ts` for the
      `TestBed.runInInjectionContext` shape, but provide `provideHttpClient`,
      `provideHttpClientTesting` and `provideTanStackQuery(testQueryClient)` and flush the
      session request (mocks: `src/mocks/users/sessionRequest.ts`,
      `getSessionOkResponse.json`, `getSessionErrorResponse.json`). Cases: admin session → true,
      non-admin session → false, failing session request → false.
      `getSessionOkResponse.json` — check its `isAdmin` value and, if it is not `true`, build the
      admin session body inline in the spec instead of adding a new fixture.
- [ ] **Step 2: Run `npx ng test`** and see the new spec fail.
- [ ] **Step 3: Implement `admin.guard.ts`** as above; re-run until green.
- [ ] **Step 4: Write `admin-home.component.spec.ts`** — renders the sentence, has the testid.
- [ ] **Step 5: Implement `AdminHomeComponent`** and `admin.routes.ts`.
- [ ] **Step 6: Wire `app.routes.ts`** (entry before the wildcard).
- [ ] **Step 7: Extend `app.component.spec.ts`.** Add a `describe("Admin routes")` block that
      renders the app at `/admin` (reuse the file's existing `renderAppComponent` helper) and:
      - with an admin session flushed → `admin-home-component` testid is in the document
      - with a non-admin session flushed → `not-found-component` testid is in the document
      - with a failing session request → `not-found-component`
      Also assert one nested path (`/admin/hirek`) renders `not-found-component` for a non-admin,
      so the guard is proven to cover children.
- [ ] **Step 8: Verify** with the full FE command set below.
- [ ] **Step 9: Self review**, journal entry, tick Task 02 in `00-overview.md`.

## Tests to write

- `admin.guard.spec.ts` — 3 cases (admin / non-admin / session error).
- `admin-home.component.spec.ts` — renders the landing copy.
- `app.component.spec.ts` — 4 routing cases described in Step 7.

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

- [ ] The guard is `CanMatchFn`, not `CanActivateFn`; nothing redirects.
- [ ] A non-admin sees the 404 page **and** the URL bar still shows the admin path.
- [ ] The session query is fetched through `QueryClient.ensureQueryData` with
      `queryKeys.session`, so it shares the cache with `userGuard`/`HeaderComponent` and does
      not fire a second request.
- [ ] The admin route entry sits before the `**` wildcard in `app.routes.ts`.
- [ ] The header's existing admin navigation (`app-admin-nav`) now actually navigates: click
      through at least one menu item manually or assert one link's `routerLink` in a spec.
      Broken links are expected at this point — the target screens land in later tasks — but the
      URL must change and the 404 page must render, not the app crash.
- [ ] `knip` reports no unused exports for the new files.

## Done when

FE suite, lint, typecheck, prettier and knip are clean; `/admin` renders the landing page for an
admin and the 404 page for everyone else; the journal entry records that `AdminHomeComponent` is
scaffolding that Task 05 removes; work **left uncommitted**.
