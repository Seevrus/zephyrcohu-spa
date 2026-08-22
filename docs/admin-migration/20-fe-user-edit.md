# Task 20 — FE: user edit form

**Type:** Frontend
**Depends on:** Task 19
**Legacy source:** `src/_felhasznalok/felhasznalo_modosit.html`, `felhasznalo_modosit.GET.php`
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

`/admin/felhasznalok/:id` — edit one user: email, forced password regeneration, registration
confirmation, newsletter subscription. Every change triggers a notification mail from the backend
(Task 18), so the screen must make that consequence obvious.

## Files

- Create: `resources/frontend/src/app/pages/admin/user-form/admin-user-form.component.*` (+ spec)
- Modify: `resources/frontend/src/app/services/admin-users.query.service.ts` — add
  `getAdminUser(id)` if the list cache is not enough (see below)
- Modify: `resources/frontend/src/app/admin.routes.ts`, `app.component.spec.ts`

## Design

### Where the user data comes from

Task 18 deliberately has **no** `GET /api/admin/users/{user}` endpoint — the list response
carries everything the form needs. Read the user from the list query:

```ts
private readonly usersQuery = injectQuery(() => this.adminUsersQueryService.getAdminUsers());
protected readonly user = computed(() =>
  this.usersQuery.data()?.find((candidate) => candidate.id === this.numericId()),
);
```

A deep link therefore costs one list request, which is fine at this scale. If the user is not
found once the query has settled, render the not-found message
("A felhasználó nem található.") plus a link back to the list.

### Fields (legacy parity)

| Label | Control | Notes |
|---|---|---|
| Címzett email címe | `matInput` | required, email format |
| Új jelszó generálása az ügyfél számára | `mat-checkbox` | unchecked by default; see the warning block below |
| Ügyfélregisztráció visszaigazolása | `mat-checkbox` | disabled when the user is already confirmed *and* the legacy form disabled it — here: keep it enabled, but pre-checked and explained ("A regisztráció már visszaigazolt.") |
| Kér hírlevelet | `mat-radio-group` Igen/Nem | required |

Legacy hint above the form (keep it): "Ha valamit módosítani szeretnénk, írjuk át. Ha nem
szeretnénk, hagyjuk úgy. Email cím nem törölhető."

### Password generation is a last resort (decision D15)

The checkbox stays — it is the fallback for when nothing else works — but the UI has to say what
it costs. Directly under the checkbox, render a warning block (`mat-icon warning` + text, not
colour alone, AA contrast):

> **Végső megoldás.** Elsődlegesen kérjük meg a felhasználót, hogy az „Elfelejtett jelszó"
> funkcióval maga állítsa vissza a jelszavát. Ha ez nem járható út, a rendszer új jelszót generál,
> és azt **emailben, olvasható formában** küldi el neki.

Show the block always (so the consequence is visible before the admin ticks the box), and make it
visually stronger — e.g. a bordered callout — while the checkbox is checked. The generated
password is never displayed in the admin UI; only the user receives it.

Buttons: "Módosítás" (`app-button-loadable`) + "Mégsem" back to the list.

### Submitting

`PUT /admin/users/:id` with `{ email, confirmed, newsletter, generatePassword }`.
On success: navigate to `/admin/felhasznalok` and show a success message there — the simplest
mechanism that fits the codebase is a signal on the users page fed by
`router.getCurrentNavigation()?.extras.state`; if that turns out clumsy, render the success card
on the form itself before navigating after a short delay. **Pick one, implement it once, and
reuse it for Task 21** (which needs the same "went back with a message" behaviour). Record the
choice in the journal.

Error handling:

- 422 whose body mentions "nem került semmi módosítása" (the backend's "nothing changed" case) →
  show "Az űrlapon nem került semmi módosításra." above the form
- other 422 → "A megadott adatok nem megfelelőek." (e.g. duplicate email)
- 500 → `<app-form-unexpected-error />`

As in Task 17, read `error.error.errors` in the component for the specific message; do not change
`throwHttpError`.

Route: `{ path: "felhasznalok/:id", …, title: "Admin - Felhasználó szerkesztése" }` — must come
**after** `felhasznalok` and before nothing else (there is no `uj` route: admins are created
through normal registration).

## Steps

- [ ] **Step 1:** Spec first (cases below).
- [ ] **Step 2:** Implement the component.
- [ ] **Step 3:** Implement the "back with a success message" mechanism and cover it in the users
      grid spec too.
- [ ] **Step 4:** Route + `app.component.spec.ts` case for `/admin/felhasznalok/1`.
- [ ] **Step 5:** Verify, self review, journal, tick Task 20.

## Tests to write

`admin-user-form.component.spec.ts`:

- loads the user list and prefills email, confirmed, newsletter
- an unknown id renders the not-found message
- the last-resort warning about password generation is visible before the checkbox is ticked
- toggling the password checkbox sends `generatePassword: true`
- submitting sends the exact `PUT /admin/users/1` body and navigates back to the list
- the "nothing changed" 422 renders the legacy sentence and stays on the page
- a duplicate-email 422 renders the invalid-data message
- a 500 renders the unexpected-error card
- the submit button is disabled while the mutation is pending

## Verification

```bash
cd resources/frontend
npx ng test && npx ng lint && npx tsc -p tsconfig.app.json && npx prettier . --check && npx knip
```

## Self review

- [ ] Checkbox and radio controls have visible labels and are reachable by keyboard.
- [ ] The password-generation warning names self-service reset as the preferred route and says
      the password is mailed in readable form; it does not rely on colour alone.
- [ ] The generated password is never rendered in the admin UI.
- [ ] The form never sends a partial body — the backend requires all four keys.
- [ ] The success-message mechanism is shared with Task 21, not duplicated.

## Done when

Editing a user works end to end against the Task 18 API, FE tooling is green, journal updated,
work **left uncommitted**.
