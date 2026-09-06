---
paths:
  - 'app/Http/{Controllers,Requests}/**'
---

# Controllers Requests

## User confirmation is one-way
A confirmed user can never be un-confirmed. `AdminUserController::updateUser` ignores a `confirmed: false` on an already confirmed account (`$user->confirmed = $user->confirmed || $request->boolean('confirmed')`), and `UpdateUserRequest`'s "nothing changed" guard treats that ignored `false` as no change. The admin UI also disables the checkbox once the user is confirmed.

Why: confirming deletes the user's `users_new` row and nothing recreates it. An un-confirmed account without that row cannot log in (`UserPolicy::login`), 500s on `resendConfirmEmail` (null relation), and lets `confirmEmail` accept *any* code, because the guard skips a null `email_code`.

Do not "fix" this by allowing the transition without first recreating `users_new` with a fresh code.
