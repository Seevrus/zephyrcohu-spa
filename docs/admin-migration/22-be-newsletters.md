# Task 22 — BE: newsletters API + mail

**Type:** Backend
**Depends on:** Task 01
**Legacy source:** `src/_hirlevel/hirlevel.GET.php`, `hirlevel_uj.POST.php`, `hirlevel.js`,
`src/_emailek/hirlevel.html`
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

Back the FE-governed newsletter sending (decision D6): store newsletters, expose who still has to
receive one, and send a newsletter to exactly one recipient per request — recording that fact so
a resumed run never sends twice.

## Existing schema

Migrations already in place (commit "BE: added tables for newsletters"):

```
newsletters:        id, subject, content, timestamps
users_newsletters:  user_id, newsletter_id, unique(user_id, newsletter_id)
```

There is **no** `sent_at` and no attempt counter: a pivot row means "this user has received this
newsletter". That is exactly the state the FE loop needs, so do not extend the schema.

## Files

- Create: `app/Models/Newsletter.php`
- Create: `app/Models/UserNewsletter.php` (pivot, mirroring `app/Models/UserNews.php`)
- Modify: `app/Models/User.php` — add a `newsletters(): BelongsToMany` relation
- Create: `app/Http/Controllers/AdminNewsletterController.php`
- Create: `app/Http/Requests/StoreNewsletterRequest.php`
- Create: `app/Http/Resources/AdminNewsletterResource.php`, `AdminNewsletterRecipientResource.php`
- Create: `app/Mail/NewsletterSent.php` (+ views `resources/views/mail/newsletter_sent/{html,text}.blade.php`)
- Create: `resources/views/components/mail/layout.blade.php` — shared wrapper, decided with the
  user beyond the doc's original scope (see "Mail" below)
- Modify: the 8 existing `resources/views/mail/*/html.blade.php` views to use it (pure refactor)
- Modify: `routes/api.php`, `.ai/rules/routes.md`
- Create: `tests/Feature/AdminNewsletterController/` — `GetAdminNewslettersTest.php` (covers both
  the list and the single-item `getNewsletter` view), `StoreNewsletterTest.php`,
  `GetNewsletterRecipientsTest.php`, `SendNewsletterTest.php`

## Rate limiting — do not skip this (decision D13)

`AppServiceProvider::boot()` defines the `api` limiter as **60 requests per minute per user**, and
`bootstrap/app.php` applies it to the entire api group with `$middleware->throttleApi()`. The
FE-governed loop makes **one request per recipient**, so without a dedicated limiter a newsletter
with more than 60 recipients starts returning 429 partway through and the FE marks every
remaining recipient as failed.

Give the send endpoint its own limiter and take it out of the global one. Adding a second
`throttle:` middleware is not enough — the `api` limiter would still apply, and the stricter of
the two wins:

```php
// AppServiceProvider::boot()
RateLimiter::for('newsletter', function (Request $request) {
    return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
});
```

```php
// routes/api.php, inside the admin group
Route::post('/{newsletter}/recipients/{user}', 'sendToRecipient')
    ->withoutMiddleware('throttle:api')
    ->middleware('throttle:newsletter');
```

> **Gotcha found while implementing:** `->withoutMiddleware([ThrottleRequests::class])` (the bare
> middleware class) does not exclude the inherited `throttle:api` — confirmed by a real 429 on the
> 70-sends test below. This isn't newsletter-specific; it's a general trap with excluding any
> parameterised middleware. See `.ai/rules/routes.md` ("Opting a route out of the group-applied
> `api` limiter") for the mechanism and the fix (`->withoutMiddleware('throttle:api')`, the exact
> string).

120/min leaves headroom above the FE's ~1s pacing (Task 24) while still capping a runaway loop.
Update `.ai/rules/routes.md` with the new named limiter — that file documents the limiter
inventory and is the first thing the next agent reads when touching `routes/api.php`.

## Contract

```php
Route::controller(AdminNewsletterController::class)->prefix('newsletters')->group(function () {
    Route::get('/', 'getNewsletters');
    Route::post('/', 'storeNewsletter');
    Route::get('/{newsletter}', 'getNewsletter');
    Route::get('/{newsletter}/recipients', 'getRecipients');
    Route::post('/{newsletter}/recipients/{user}', 'sendToRecipient')
        ->withoutMiddleware('throttle:api')
        ->middleware('throttle:newsletter');
});
```

Eligible recipient = a user with `newsletter = 1` **and** `confirmed = 1`. **Deviation from the
original plan, decided with the user during implementation:** the legacy query used only
`newsletter = 1`, and this doc originally said to keep that parity. The user chose to move off it
here — an unconfirmed registration should not receive a newsletter — so every eligibility check
(`getNewsletters`' `recipientCount`, `getRecipients`, `sendToRecipient`'s guard) filters on both
columns. Journaled as a deliberate deviation.

### `GET /api/admin/newsletters` → 200

Newest first (`created_at desc`):

```json
{
  "data": [
    {
      "id": 1,
      "subject": "…",
      "createdAt": "…",
      "recipientCount": 120,
      "sentCount": 118,
      "isSentToEveryone": false
    }
  ]
}
```

`recipientCount` = current number of eligible users, `sentCount` = pivot rows for that
newsletter, `isSentToEveryone` = no eligible user is missing a pivot row. Compute
`recipientCount` once per request, not per row.

### `POST /api/admin/newsletters` → 201

```php
'subject' => ['required', 'string', 'max:255'],
'content' => ['required', 'string'],
```

Creates the row **without sending anything** and returns the same shape plus `content`.

### `GET /api/admin/newsletters/{newsletter}` → 200

The full newsletter including `content` and the three counters — this backs the read-only
"Hírlevél megtekintése" screen and the resume flow.

### `GET /api/admin/newsletters/{newsletter}/recipients` → 200

The users who are eligible **and** have no pivot row yet, ordered by email:

```json
{ "data": [ { "id": 7, "email": "user007@example.com" } ] }
```

An empty array means the newsletter is fully sent.

### `POST /api/admin/newsletters/{newsletter}/recipients/{user}` → 204

- 404 if the newsletter or the user does not exist
- 404 if the user is not eligible (`newsletter = 0`) — the FE should never ask
- **204 without sending** if a pivot row already exists (idempotent: a retried request must not
  double-send)
- otherwise: send `NewsletterSent` to the user, then `insertOrIgnore` the pivot row. Send first,
  record second — a mail that failed must stay pending.
- a mailer exception → `abort(500)`; the FE marks that recipient as failed and moves on

### Mail

`NewsletterSent` renders the newsletter's HTML `content` inside the shared `<x-mail.layout>`
Blade component, with the legacy footer adapted: the unsubscribe sentence now points at the SPA
profile page instead of the legacy `unsub` URL —

> "Amennyiben nem szeretné, hogy a Zephyr Bt. a továbbiakban hírlevelet küldjön az Ön részére,
> a [profil oldalon](…/profil) tud leiratkozni."

**Deviation, decided with the user:** the link is hardcoded to `https://zephyr.co.hu/profil`,
matching every other mail view's link convention, rather than the `config('app.url')` this doc
originally specified — `config('app.url')` is not used anywhere else in this codebase, and
introducing it was judged out of scope for this task. No per-user unsubscribe code table is
introduced; "unsubscribing" is just the existing self-service `newsletter` toggle on the profile
page, unrelated to this migration.

**Also decided with the user, beyond the doc's original scope:** every one of the 8 pre-existing
mail views repeated the exact same header/body wrapper markup inline (no shared layout existed in
this codebase before). All 8 were refactored onto the new `resources/views/components/mail/
layout.blade.php` anonymous Blade component (`<x-mail.layout>…</x-mail.layout>`) in the same pass
`NewsletterSent`'s own view was written against — a pure refactor, content byte-for-byte
unchanged, verified against the full Pest suite before and after (no existing mail-assertion test
needed a single change).

Guest / non-admin → 404 on every route.

## Steps

- [x] **Step 0** *(added — decided with the user beyond the doc's original scope)*: extract the
      shared `<x-mail.layout>` component and refactor the 8 pre-existing mail views onto it;
      full Pest suite green before and after, byte-identical rendered output.
- [x] **Step 1:** `php artisan make:model Newsletter --no-interaction` and the pivot model;
      add the `User::newsletters()` relation. No migration is needed.
- [x] **Step 2:** `GetAdminNewslettersTest` first — seed eligible/opted-out/**unconfirmed** users,
      two newsletters, pivot rows for one of them; assert the counters and `isSentToEveryone`,
      plus guard cases; the single-item `getNewsletter` view added in the same file. Red →
      implement → green.
- [x] **Step 3:** `StoreNewsletterTest` → implement (assert `Mail::fake()` recorded **nothing**).
- [x] **Step 4:** `GetNewsletterRecipientsTest` → implement.
- [x] **Step 5:** `SendNewsletterTest` → implement; this is the important one, see the case list.
- [x] **Step 6:** Write the mail views; assert both render.
- [x] **Step 7:** Add the `newsletter` rate limiter, attach it to the send route, and record it in
      `.ai/rules/routes.md`.
- [x] **Step 8:** Pint, self review, journal, tick Task 22.

## Tests to write

| File | Cases |
|---|---|
| `GetAdminNewslettersTest` | newest first; counters correct; `isSentToEveryone` true only when every eligible user has a pivot row; opted-out **and unconfirmed** users excluded from `recipientCount`; single-item `getNewsletter` includes `content`; unknown id 404; guest/non-admin 404 |
| `StoreNewsletterTest` | creates the row, sends no mail, returns 201 with counters; 422 on missing subject/content; guest/non-admin 404 |
| `GetNewsletterRecipientsTest` | lists only pending eligible users, ordered by email; empty array when everyone received it; unknown newsletter 404; guest/non-admin 404 |
| `SendNewsletterTest` | sends the mail and writes the pivot row; a second call for the same pair sends nothing and still returns 204; an opted-out user → 404; **an unconfirmed user → 404**; unknown user/newsletter → 404; a mailer exception → 500 **and no pivot row**; the mail contains the newsletter subject and content, plus the unsubscribe link in both formats; **70 consecutive sends in one minute all succeed** (proves the endpoint escaped the 60/min `api` limiter — seed 70 eligible users and loop); guest/non-admin 404 |

## Verification

```bash
php artisan test --compact --filter=AdminNewsletter
php artisan test --compact   # full suite — step 0 touches 8 already-shipped mail views
vendor/bin/pint --dirty --format agent
php artisan route:list --path=api/admin/newsletters -vv
```

Actual result: 376 passed (was 349 before this task; +27 new), Pint clean, route list confirms
`throttle:newsletter` alone on the send route (see the gotcha under "Rate limiting" above).

## Self review

- [x] Sending is idempotent per (newsletter, user) pair — proven by a test.
- [x] `php artisan route:list --path=api/admin/newsletters -vv` shows `throttle:newsletter` on the
      send route and **no** `throttle:api` — the whole point of D13. (Note: `-v` alone is not
      enough to verify this — it prints the `api` group name without expanding it.)
- [x] A failed mail leaves the recipient pending, so a resumed run retries them.
- [x] `recipientCount` is one query, not one per newsletter (no N+1) — computed once in the
      controller and assigned as a plain per-row attribute, `withCount` for `sentCount`.
- [x] The unsubscribe link points at the SPA profile page (hardcoded URL, see "Mail" deviation
      above) and renders in both mail views — asserted in `SendNewsletterTest`.
- [x] Nothing in this task touches the public API or the users table.

## Done when

All four test files pass, Pint is clean, journal updated, work **left uncommitted** — though the
user asked to commit at the end of Task 21; confirm the same preference before committing here.
