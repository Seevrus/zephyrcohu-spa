# Task 04 — BE: news admin API

**Type:** Backend
**Depends on:** Task 01
**Legacy source:** `src/_hirek/hirek.GET.php`, `hir_uj.*`, `hir_modosit.*`, `hir_torol.*`
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

Full CRUD over news items for administrators, including the unpublished ones and the "who read
it" information the legacy list showed.

This is the **pattern task** for the other content entities (offers, knowledgebase): get it
right, the siblings copy it.

## Files

- Create: `app/Http/Controllers/AdminNewsController.php`
- Create: `app/Http/Requests/StoreNewsRequest.php`
- Create: `app/Http/Requests/UpdateNewsRequest.php`
- Create: `app/Http/Resources/AdminNewsResource.php`
- Modify: `routes/api.php` (inside the `admin` group from Task 01)
- Delete: `app/Http/Controllers/AdminPingController.php` and its route (Task 01 placeholder)
- Modify: `tests/Feature/Admin/AdminGuardTest.php` — point it at `GET /api/admin/news`
- Create: `tests/Feature/AdminNewsController/GetAdminNewsTest.php`
- Create: `tests/Feature/AdminNewsController/GetAdminNewsItemTest.php`
- Create: `tests/Feature/AdminNewsController/StoreNewsTest.php`
- Create: `tests/Feature/AdminNewsController/UpdateNewsTest.php`
- Create: `tests/Feature/AdminNewsController/DeleteNewsTest.php`

## Contract

All five routes sit inside `Route::prefix('admin')->middleware('admin')`:

```php
Route::controller(AdminNewsController::class)->prefix('news')->group(function () {
    Route::get('/', 'getNews');
    Route::post('/', 'storeNews');
    Route::get('/{news}', 'getNewsItem');
    Route::put('/{news}', 'updateNews');
    Route::delete('/{news}', 'deleteNews');
});
```

### `GET /api/admin/news` → 200

Every news item, published or not, `orderBy('published_at', 'desc')`. No pagination — the grid
paginates client-side. Eager-load readers (`with('readers')`) to avoid N+1.

```json
{
  "data": [
    {
      "id": 1,
      "audience": "P",
      "title": "…",
      "mainContent": "<p>…</p>",
      "additionalContent": null,
      "publishedAt": "2026-02-08T20:31:00.000000Z",
      "createdAt": "…",
      "updatedAt": "…",
      "readerCount": 2,
      "readers": ["user001@example.com", "user002@example.com"]
    }
  ]
}
```

`readers` is the sorted list of reader emails (legacy ordered by email); `readerCount` is its
length. Both come from `AdminNewsResource` via `whenLoaded('readers')`; when the relation is not
loaded, omit both keys.

### `GET /api/admin/news/{news}` → 200

Single item in the same shape (readers included). Unknown id → 404 `GENERIC_NOT_FOUND`
(implicit route-model binding already produces this through the exception renderer).

### `POST /api/admin/news` → 201

`StoreNewsRequest` rules:

```php
return [
    'audience' => ['required', 'string', 'in:A,P'],
    'title' => ['required', 'string', 'max:255'],
    'mainContent' => ['required', 'string'],
    'additionalContent' => ['nullable', 'string'],
    'publishedAt' => ['required', 'date'],
];
```

Body → columns: `audience`, `title`, `main_content`, `additional_content`, `published_at`.
Response: `{"data": {…}}` with the created row (`readerCount: 0`, `readers: []`).
Validation failure → Laravel's 422; the FE maps it to `INVALID_REQUEST_DATA`
(`src/utils/throwHttpError.ts` already handles that shape).

### `PUT /api/admin/news/{news}` → 200

`UpdateNewsRequest` — same rules as store (a full replace, matching the legacy edit form which
always posted every field). Returns the updated resource.

### `DELETE /api/admin/news/{news}` → 204

Deletes the row. `users_news` rows go with it via the pivot's cascade
(`2026_02_08_181423_create_users_news`; verify the FK is `cascadeOnDelete` — if it is not,
delete the pivot rows explicitly inside a transaction and note it in the journal).

### Errors

- guest / non-admin → 404 `GENERIC_NOT_FOUND` (middleware)
- unknown id → 404 `GENERIC_NOT_FOUND`
- validation → 422 Laravel default
- anything unexpected → `abort(500)` inside `try/catch (Throwable)`, matching `NewsController`

## Steps

- [ ] **Step 1:** Write `GetAdminNewsTest.php` first. Seed (via `DB::table(...)->insert(...)`,
      there are no factories): two users (one plain id 1, one admin id 2 with a `user_admins`
      row), three news items — one published public, one published auth-only, one with
      `published_at` in the future — and two `users_news` rows for item 1.
      Assert: admin gets all three items, ordered by `published_at` desc; the unpublished one is
      present; `readerCount` is 2 and `readers` lists both emails sorted; guest → 404;
      non-admin → 404.
- [ ] **Step 2:** `php artisan test --compact --filter=GetAdminNewsTest` → fails (404 for the
      admin too).
- [ ] **Step 3:** `php artisan make:controller AdminNewsController --no-interaction`,
      `php artisan make:request StoreNewsRequest --no-interaction`,
      `php artisan make:request UpdateNewsRequest --no-interaction`,
      `php artisan make:resource AdminNewsResource --no-interaction`.
- [ ] **Step 4:** Implement `getNews` + the resource; register the route group; re-run until green.
- [ ] **Step 5:** Repeat the red/green cycle for `getNewsItem`, `storeNews`, `updateNews`,
      `deleteNews`, one test file at a time, each with its own guard cases.
- [ ] **Step 6:** Remove `AdminPingController` and its route; rewrite `AdminGuardTest` to hit
      `GET /api/admin/news` (keep the four cases from Task 01, including the 405 one — use
      `PATCH /api/admin/news/1` for that).
- [ ] **Step 7:** `vendor/bin/pint --dirty --format agent`.
- [ ] **Step 8:** Self review, journal entry, tick Task 04.

## Tests to write

| File | Cases |
|---|---|
| `GetAdminNewsTest` | lists all news incl. unpublished; ordering; readers + readerCount; guest 404; non-admin 404 |
| `GetAdminNewsItemTest` | returns one item with readers; unknown id 404; guest 404; non-admin 404 |
| `StoreNewsTest` | creates a news item and returns 201 with the row; persists `main_content`/`additional_content`; rejects a missing title (422); rejects an invalid `audience` (422); accepts a future `publishedAt`; guest 404; non-admin 404 |
| `UpdateNewsTest` | updates every field; unknown id 404; validation 422; guest 404; non-admin 404 |
| `DeleteNewsTest` | deletes the row and returns 204; removes the `users_news` rows; unknown id 404; guest 404; non-admin 404 |

Use `Carbon::setTestNowAndTimezone('2026-02-28 21:59:40', 'Europe/Budapest')` in `beforeEach`,
like the existing news tests, so `published_at` assertions are stable.

## Verification

```bash
php artisan test --compact --filter=AdminNews
php artisan test --compact --filter=AdminGuardTest
php artisan test --compact --filter=NewsController   # the public endpoints must be untouched
vendor/bin/pint --dirty --format agent
php artisan route:list --path=api/admin
```

## Self review

- [ ] The public `NewsController` and `NewsResource` were not modified.
- [ ] No N+1: `readers` is eager-loaded; check with `DB::listen` or by reading the query count in
      the test if unsure.
- [ ] `AdminNewsResource` omits `readers`/`readerCount` when the relation is not loaded, instead
      of triggering a lazy load.
- [ ] Request rules mirror the legacy required-field set (`kiknek`, `cim`, `datum`, `foszoveg`
      required; `tovabbi` optional).
- [ ] Controller actions are wrapped in `try/catch (Throwable) { abort(500); }` like the existing
      controllers, and every action has an explicit return type where the codebase uses one.
- [ ] All five routes are inside the `admin` group and none carries `auth:sanctum`.

## Done when

All five test files plus the rewritten guard test pass, Pint is clean, the ping placeholder is
gone, journal updated, work **left uncommitted**.
