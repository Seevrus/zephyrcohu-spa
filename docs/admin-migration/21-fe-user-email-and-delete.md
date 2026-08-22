# Task 21 — FE: write to user + delete user flows

**Type:** Frontend
**Depends on:** Task 19 (and shares the success-message mechanism from Task 20)
**Legacy source:** `src/_felhasznalok/felhasznalo_email.html`, `felhasznalo_torol.html`,
`felhasznalo_torol.js`
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

The two remaining user actions from the legacy admin:

1. `/admin/felhasznalok/:id/email` — write a rich-text email to a single user.
2. delete a user with a mandatory reason, from the users grid.

## Files

- Create: `resources/frontend/src/app/pages/admin/user-email/admin-user-email.component.*` (+ spec)
- Create: `resources/frontend/src/app/components/delete-user-dialog/delete-user-dialog.component.*`
  (+ spec)
- Modify: `resources/frontend/src/app/pages/admin/users/admin-users.component.*` (+ spec) — wire
  the delete action
- Modify: `resources/frontend/src/app/admin.routes.ts`, `app.component.spec.ts`

## Design

### 1. Write to user (`/admin/felhasznalok/:id/email`)

Fields (legacy `felhasznalo_email.html`):

| Label | Control | Validation |
|---|---|---|
| Címzett email címe | `matInput`, **read-only**, prefilled from the user list | — |
| Tárgy | `matInput` | required, max 255 |
| Levél szövege | `app-rich-text-editor` | required |

The legacy form let the admin retype the recipient address; here the recipient is the user in the
URL and the backend ignores any address in the body, so showing it read-only removes a footgun.
Note the change in the journal.

Buttons: "Elküldés" (`app-button-loadable`) + "Mégsem".
Submit → `POST /admin/users/:id/email` with `{ subject, body }`; on 204 navigate back to the list
with the success message "Email küldése sikeres." (legacy wording), using the Task 20 mechanism.
On 500: `<app-form-unexpected-error />` with the legacy-flavoured message "Az email küldése nem
sikerült." Keep the form filled so the admin can retry.

Route: `{ path: "felhasznalok/:id/email", …, title: "Admin - Email írása" }` — register it
**before** `felhasznalok/:id` is irrelevant (different depth), but keep it next to it for
readability.

### 2. Delete user dialog

The delete needs a reason, so the shared `ConfirmDialogComponent` is not enough — build
`DeleteUserDialogComponent` (Material dialog + signal form):

| Label | Control | Validation |
|---|---|---|
| Tárgy | `matInput` | required, max 255, default: "Regisztrációja törlésre került" |
| Törlés oka | `mat-radio-group`: "Felhasználói kérés" (`asked`) / "Egyéb" (`custom`) | required |
| Indoklás | `matInput`, shown only when `custom` is selected | required when visible, max 500 |

Dialog title: `Felhasználó törlése`, plus a warning line naming the user:
`A(z) <email> felhasználó és minden hozzá tartozó adat véglegesen törlődik.`
Confirm button label: "Biztosan törölni szeretnéd?" (legacy), `color="warn"`.

`close()` returns `DeleteAdminUserRequest | undefined`. The users grid runs
`deleteAdminUser({ id, request })` on a returned value, shows the progress bar while pending,
and on success re-renders the grid with the success message "Felhasználó törlése sikeres."
A 403 (self-delete or another admin — Task 18's guard) renders
"Adminisztrátor fiók nem törölhető." A 500 renders the unexpected-error card.

## Steps

- [ ] **Step 1:** Spec + implementation for `DeleteUserDialogComponent`.
- [ ] **Step 2:** Wire the users grid's delete action to it; extend the grid spec.
- [ ] **Step 3:** Spec + implementation for the write-to-user page.
- [ ] **Step 4:** Route + `app.component.spec.ts` case for `/admin/felhasznalok/1/email`.
- [ ] **Step 5:** Verify, self review, journal, tick Task 21.

## Tests to write

`delete-user-dialog.component.spec.ts`:

- renders the warning with the user's email
- the reason input is hidden until "Egyéb" is selected, and required once visible
- confirming with `asked` closes with `{ subject, reason: "asked", customReason: null }`
- confirming with `custom` closes with the typed reason
- cancelling closes with `undefined`

`admin-users.component.spec.ts` (extended):

- confirming the dialog fires `DELETE /admin/users/1` with the reason body
- a 403 renders "Adminisztrátor fiók nem törölhető."
- a successful delete refreshes the list and shows the success message

`admin-user-email.component.spec.ts`:

- prefills the read-only recipient from the user list
- submit is blocked until subject and body are filled
- a valid submit fires `POST /admin/users/1/email` with `{ subject, body }` and navigates back
- a 500 keeps the form filled and shows the failure message
- an unknown user id renders the not-found message

## Verification

```bash
cd resources/frontend
npx ng test && npx ng lint && npx tsc -p tsconfig.app.json && npx prettier . --check && npx knip
```

## Self review

- [ ] The delete dialog cannot be confirmed without a reason, and `custom` cannot be submitted
      empty.
- [ ] The dialog's destructive button is visually and semantically marked as destructive.
- [ ] The rich text editor in the email page follows the Task 06 jsdom note.
- [ ] The 403 case is handled explicitly — an admin trying to delete an admin must not see a
      generic error.
- [ ] Success messages reuse the Task 20 mechanism.

## Done when

Both flows work against the Task 18 API, FE tooling is green, journal updated, work **left
uncommitted**.
