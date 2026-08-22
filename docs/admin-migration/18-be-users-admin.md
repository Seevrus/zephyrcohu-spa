# Task 18 — BE: users admin API + notification mails

**Type:** Backend
**Depends on:** Task 01
**Legacy source:** `src/_felhasznalok/felhasznalok.GET.php`, `felhasznalo_modosit.*`,
`felhasznalo_torol.*`, `felhasznalo_email.*`, `src/_emailek/felhasznalo_*.html`
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

List users, edit them (email, forced new password, registration confirmation, newsletter flag),
delete them with a reason, and write them an ad-hoc email — each with the notification mail the
legacy admin sent.

## Files

- Create: `app/Http/Controllers/AdminUserController.php`
- Create: `app/Http/Requests/UpdateUserRequest.php`, `DeleteUserRequest.php`, `SendUserEmailRequest.php`
- Create: `app/Http/Resources/AdminUserResource.php`
- Create: `app/Mail/AdminUpdatedUser.php` (+ views `resources/views/mail/admin_updated_user/{html,text}.blade.php`)
- Create: `app/Mail/AdminDeletedUser.php` (+ views `resources/views/mail/admin_deleted_user/{html,text}.blade.php`)
- Create: `app/Mail/AdminMessage.php` (+ views `resources/views/mail/admin_message/{html,text}.blade.php`)
- Modify: `routes/api.php`
- Create: `tests/Feature/AdminUserController/` — `GetAdminUsersTest.php`, `UpdateUserTest.php`,
  `DeleteUserTest.php`, `SendUserEmailTest.php`

Look at `app/Mail/UserDeleted.php` and `resources/views/mail/user_deleted/` first — the new
mailables copy their structure (envelope subject + `html`/`text` views).

## Contract

```php
Route::controller(AdminUserController::class)->prefix('users')->group(function () {
    Route::get('/', 'getUsers');
    Route::put('/{user}', 'updateUser');
    Route::delete('/{user}', 'deleteUser');
    Route::post('/{user}/email', 'sendUserEmail');
});
```

### `GET /api/admin/users` → 200

All users ordered by email (legacy `ORDER BY email`):

```json
{
  "data": [
    {
      "id": 1,
      "email": "user001@example.com",
      "confirmed": true,
      "newsletter": false,
      "isAdmin": false,
      "passwordSetAt": "…",
      "lastActive": "…"
    }
  ]
}
```

`confirmed`/`newsletter` are booleans (the model already casts them), `isAdmin` is
`(bool) $user->admin` as in `UserResource`. Eager-load `admin` to avoid N+1.

### `PUT /api/admin/users/{user}` → 200

```php
'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($this->route('user'))],
'confirmed' => ['required', 'boolean'],
'newsletter' => ['required', 'boolean'],
'generatePassword' => ['required', 'boolean'],
```

Behaviour, mirroring `felhasznalo_modosit.POST.php`:

- if nothing changed and `generatePassword` is `false` → 422 with a validation-shaped error on
  `email` and the legacy message "Az űrlapon nem került semmi módosításra."
- `generatePassword: true` → generate a 10-character password
  (`Str::password(10, letters: true, numbers: true, symbols: false)`), `Hash::make` it, set
  `password_set_at = now()`, and include the plain password in the notification mail — this is
  how the legacy admin worked, and the admin hands it to the user over the phone.
  **This is a deliberate last-resort fallback (decision D15).** Self-service reset
  (`POST /users/profile/request_new_password`) is the preferred route; this exists for when
  nothing else helps. The mail must therefore also tell the user to change it: add a sentence
  after the password line — "Kérjük, jelentkezzen be, és a profil oldalon módosítsa a jelszavát."
  Task 20 puts the matching warning in the admin UI.
- `confirmed` flipping `false → true` also removes the pending `users_new` row (the registration
  is confirmed by fiat); flipping `true → false` is allowed and only touches the flag
- send **one** `AdminUpdatedUser` mail listing the changes (new email / new password / confirmed /
  newsletter on / off), using the legacy sentences from `src/_emailek/felhasznalo_modosit.html`
  and `felhasznalo_modosit.POST.php`:
  - `Új email: <email>`
  - `Új jelszó: <password>`
  - `Regisztrációját visszaigazoltuk, mostantól elérhető honlapunk teljes funkcionalitása. Köszönjük!`
  - `Felvettük hírlevelünk címzettjei közé.` / `Ön a továbbiakban nem fog hírlevelet kapni tőlünk.`
- if the email changed, send the same mail to **both** the new and the old address
- the DB write happens in a transaction; mail is sent after it commits. A mail failure must not
  roll the change back — catch it, log it, and still return 200 (the legacy admin behaved the
  same way, only louder)

Response: the updated `AdminUserResource`.

### `DELETE /api/admin/users/{user}` → 204

```php
'reason' => ['required', 'string', 'in:asked,custom'],
'customReason' => ['required_if:reason,custom', 'nullable', 'string', 'max:500'],
'subject' => ['required', 'string', 'max:255'],
```

Deletes the user (all pivot/`users_new*` rows cascade) and sends `AdminDeletedUser` with the
legacy body from `felhasznalo_torol_tajekoztato.php`:

- `asked` → "Kérésének megfelelően töröltük regisztrációját. A regisztráció során vagy később
  megadott **minden adatot töröltünk** adatbázisunkból."
- `custom` → "Regisztrációját töröltük adatbázisunkból. Indoklás: `<customReason>`."

`subject` is the admin-provided mail subject (the legacy form had that field).

**Guard:** an admin must not delete their own account through this endpoint, and must not delete
another admin — return 403 `GENERIC_FORBIDDEN` (the middleware's 404 is for non-admins; here the
caller legitimately reached the endpoint). This is a new safety rule, not legacy behaviour;
note it in the journal.

### `POST /api/admin/users/{user}/email` → 204

```php
'subject' => ['required', 'string', 'max:255'],
'body' => ['required', 'string'],
```

Sends `AdminMessage` (subject + rich-text body) to the user's address, wrapped in the standard
Zephyr mail layout the other mail views use. A mail failure here **is** reported: return 500
`INTERNAL_SERVER_ERROR`, since sending was the whole point of the request.

Guest / non-admin → 404 on every route. Unknown id → 404.

## Steps

- [ ] **Step 1:** `GetAdminUsersTest` first (ordering, flags, `isAdmin`, guard cases) →
      implement `getUsers` + `AdminUserResource`.
- [ ] **Step 2:** Write the three mailables and their views, modelled on `UserDeleted` /
      `resources/views/mail/user_deleted/`. Keep the Hungarian copy from the legacy templates.
- [ ] **Step 3:** `UpdateUserTest` with `Mail::fake()` — cases below → implement `updateUser`.
- [ ] **Step 4:** `DeleteUserTest` with `Mail::fake()` → implement `deleteUser`.
- [ ] **Step 5:** `SendUserEmailTest` with `Mail::fake()` → implement `sendUserEmail`.
- [ ] **Step 6:** Pint, self review, journal, tick Task 18.

## Tests to write

| File | Cases |
|---|---|
| `GetAdminUsersTest` | ordered by email; flags and `isAdmin` correct; no N+1 (assert with a query count if convenient); guest/non-admin 404 |
| `UpdateUserTest` | changes the email and mails **both** addresses; `generatePassword` sets a new hash, bumps `password_set_at` and includes the password in the mail; confirming removes the `users_new` row; newsletter toggle wording; "nothing changed" → 422; duplicate email → 422; a mail failure still returns 200 and persists the change (`Mail::shouldReceive`/exception); unknown id 404; guest/non-admin 404 |
| `DeleteUserTest` | deletes the user and dependent rows; `asked` mail body; `custom` mail body containing the reason; `custom` without `customReason` → 422; deleting yourself → 403; deleting another admin → 403; unknown id 404; guest/non-admin 404 |
| `SendUserEmailTest` | sends `AdminMessage` with the given subject and body to the user's address; 422 on a missing subject/body; 500 when the mailer throws; unknown id 404; guest/non-admin 404 |

Use `Mail::fake()` + `Mail::assertSent(AdminUpdatedUser::class, fn ($mail) => …)` for the
assertions, and `Hash::check()` to verify the generated password.

## Verification

```bash
php artisan test --compact --filter=AdminUser
php artisan test --compact --filter=UserController   # public user endpoints unchanged
vendor/bin/pint --dirty --format agent
```

## Self review

- [ ] The generated password is never logged and never returned in the HTTP response — only
      mailed.
- [ ] The notification mail tells the user to change the generated password after logging in.
- [ ] An admin cannot delete themselves or another admin.
- [ ] A mail failure on update does not roll back a committed change; a mail failure on the
      "write to user" endpoint *is* surfaced.
- [ ] Email uniqueness ignores the user being edited.
- [ ] The three mail views render in both `html` and `text` variants (Laravel will throw if a
      view is missing — a test proves each one renders).
- [ ] `UserResource`, `UserPolicy` and the public user endpoints are untouched.

## Done when

All four test files pass, Pint is clean, journal updated, work **left uncommitted**.
