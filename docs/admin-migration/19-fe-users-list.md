# Task 19 — FE: users admin grid

**Type:** Frontend
**Depends on:** Task 03, Task 18
**Legacy source:** `src/_felhasznalok/felhasznalok.html`, `felhasznalo.html`
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

`/admin/felhasznalok` — the user list with the three legacy row actions: edit, write an email,
delete.

## Files

- Create: `resources/frontend/src/types/admin-users.ts`
- Create: `resources/frontend/src/app/services/admin-users.query.service.ts`
- Modify: `resources/frontend/src/app/services/queryKeys.ts`
- Create: `resources/frontend/src/mocks/admin/users/…`
- Create: `resources/frontend/src/app/pages/admin/users/admin-users.component.*` (+ spec)
- Modify: `resources/frontend/src/app/admin.routes.ts`, `app.component.spec.ts`

## Design

### Types

```ts
export type AdminUserResponse = {
  id: number;
  email: string;
  confirmed: boolean;
  newsletter: boolean;
  isAdmin: boolean;
  passwordSetAt: string;
  lastActive: string | null;
};

export type AdminUser = Omit<AdminUserResponse, "passwordSetAt" | "lastActive"> & {
  passwordSetAt: Date;
  lastActive: Date | null;
};

export type UpdateAdminUserRequest = {
  email: string;
  confirmed: boolean;
  newsletter: boolean;
  generatePassword: boolean;
};

export type DeleteAdminUserRequest = {
  subject: string;
  reason: "asked" | "custom";
  customReason: string | null;
};

export type SendAdminUserEmailRequest = { subject: string; body: string };
```

### Grid

| Header | Field | Notes |
|---|---|---|
| Email cím | `email` | wrap |
| Megerősítve | `confirmed` | "Igen" / "Nem" |
| Hírlevél | `newsletter` | "Igen" / "Nem" |
| Utolsó aktivitás | `lastActive` | `formatDisplayDateWithoutDay`, empty when `null` |
| Kezelés | — | actions `["edit", "email", "delete"]` |

The legacy list only showed email + confirmed; newsletter and last activity are cheap additions
that the admin previously had to open the edit form for. Keep them.

Header: `<h1>Felhasználók</h1>`. Empty state: "Még nincsenek felhasználók." (legacy
`nincs_felhasznalo.html`).

Row actions:

- `edit` → `/admin/felhasznalok/:id` (Task 20)
- `email` → `/admin/felhasznalok/:id/email` (Task 21)
- `delete` → opens the delete flow from Task 21. Until Task 21 lands, wire the action to a
  `TODO`-free stub that opens the shared confirm dialog and does nothing on confirm, and mark it
  in the journal as "delete completed in Task 21" — or simply do Tasks 19–21 in one sitting and
  wire it properly. Prefer the latter.

Admins should be visually distinguishable (the delete endpoint refuses them): add an
"Adminisztrátor" chip/text in the email cell when `isAdmin` is true, and hide the `delete`
action for those rows.

Service `AdminUsersQueryService`: `getAdminUsers()`, `updateAdminUser()`, `deleteAdminUser()`,
`sendAdminUserEmail()`. Mutations invalidate `queryKeys.adminUsers`; `updateAdminUser` also
invalidates `queryKeys.session` (an admin may have edited themselves).

Route: `{ path: "felhasznalok", …, title: "Admin - Felhasználók" }`.

## Steps

- [ ] **Step 1:** Types, mocks, spec, then service + grid.
- [ ] **Step 2:** Route + `app.component.spec.ts` case for `/admin/felhasznalok`.
- [ ] **Step 3:** Verify, self review, journal, tick Task 19.

## Tests to write

`admin-users.component.spec.ts`:

- loading spinner, then the user rows with their flags
- an admin row shows the "Adminisztrátor" marker and offers **no** delete action
- empty state
- error card on 500
- edit action navigates to `/admin/felhasznalok/1`
- email action navigates to `/admin/felhasznalok/1/email`
- delete action opens the confirm/delete flow (assert whatever Task 21 wires; if 21 is not done
  yet, assert the dialog opens)

## Verification

```bash
cd resources/frontend
npx ng test && npx ng lint && npx tsc -p tsconfig.app.json && npx prettier . --check && npx knip
```

## Self review

- [ ] The delete action is genuinely absent for admin rows, not just visually hidden.
- [ ] Each action's aria-label includes the user's email.
- [ ] `lastActive: null` renders as an empty cell, not "Invalid Date".
- [ ] The session query is invalidated after a user update.

## Done when

The grid lists users with working navigation, FE tooling is green, journal updated, work
**left uncommitted**.
