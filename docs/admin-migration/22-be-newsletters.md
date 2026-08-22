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
- Modify: `routes/api.php`
- Create: `tests/Feature/AdminNewsletterController/` — `GetAdminNewslettersTest.php`,
  `StoreNewsletterTest.php`, `GetNewsletterRecipientsTest.php`, `SendNewsletterTest.php`

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
    ->withoutMiddleware([ThrottleRequests::class])
    ->middleware('throttle:newsletter');
```

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
        ->withoutMiddleware([ThrottleRequests::class])
        ->middleware('throttle:newsletter');
});
```

Eligible recipient = a user with `newsletter = 1` (the legacy query used exactly that, with no
`confirmed` check). Keep it, and say so in the journal.

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

`NewsletterSent` renders the newsletter's HTML `content` inside the standard Zephyr mail layout
(see `resources/views/mail/offer_requested/`), with the legacy footer adapted: the unsubscribe
sentence now points at the SPA profile page instead of the legacy `unsub` URL —

> "Amennyiben nem szeretné, hogy a Zephyr Bt. a továbbiakban hírlevelet küldjön az Ön részére,
> a [profil oldalon](…/profil) tud leiratkozni."

Use `config('app.url')` for the link. No per-user unsubscribe code table is introduced.

Guest / non-admin → 404 on every route.

## Steps

- [ ] **Step 1:** `php artisan make:model Newsletter --no-interaction` and the pivot model;
      add the `User::newsletters()` relation. No migration is needed.
- [ ] **Step 2:** `GetAdminNewslettersTest` first — seed 3 eligible users, 1 opted-out user, two
      newsletters, pivot rows for one of them; assert the counters and `isSentToEveryone`, plus
      guard cases. Red → implement → green.
- [ ] **Step 3:** `StoreNewsletterTest` → implement (assert `Mail::fake()` recorded **nothing**).
- [ ] **Step 4:** `GetNewsletterRecipientsTest` → implement.
- [ ] **Step 5:** `SendNewsletterTest` → implement; this is the important one, see the case list.
- [ ] **Step 6:** Write the mail views; assert both render.
- [ ] **Step 7:** Add the `newsletter` rate limiter, attach it to the send route, and record it in
      `.ai/rules/routes.md` (Boost `record-rule`, glob `routes/api.php`).
- [ ] **Step 8:** Pint, self review, journal, tick Task 22.

## Tests to write

| File | Cases |
|---|---|
| `GetAdminNewslettersTest` | newest first; counters correct; `isSentToEveryone` true only when every eligible user has a pivot row; opted-out users excluded from `recipientCount`; guest/non-admin 404 |
| `StoreNewsletterTest` | creates the row, sends no mail, returns 201 with counters; 422 on missing subject/content; guest/non-admin 404 |
| `GetNewsletterRecipientsTest` | lists only pending eligible users, ordered by email; empty array when everyone received it; unknown newsletter 404; guest/non-admin 404 |
| `SendNewsletterTest` | sends the mail and writes the pivot row; a second call for the same pair sends nothing and still returns 204; an opted-out user → 404; unknown user/newsletter → 404; a mailer exception → 500 **and no pivot row**; the mail contains the newsletter subject and content; **70 consecutive sends in one minute all succeed** (proves the endpoint escaped the 60/min `api` limiter — seed 70 eligible users and loop); guest/non-admin 404 |

## Verification

```bash
php artisan test --compact --filter=AdminNewsletter
vendor/bin/pint --dirty --format agent
```

## Self review

- [ ] Sending is idempotent per (newsletter, user) pair — proven by a test.
- [ ] `php artisan route:list --path=api/admin/newsletters` shows `throttle:newsletter` on the
      send route and **no** `throttle:api` — the whole point of D13.
- [ ] A failed mail leaves the recipient pending, so a resumed run retries them.
- [ ] `recipientCount` is one query, not one per newsletter (no N+1).
- [ ] The unsubscribe link points at the SPA profile page and renders in both mail views.
- [ ] Nothing in this task touches the public API or the users table.

## Done when

All four test files pass, Pint is clean, journal updated, work **left uncommitted**.
