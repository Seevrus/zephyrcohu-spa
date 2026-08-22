# Task 07 — BE: offers admin API

**Type:** Backend
**Depends on:** Task 01 (pattern: Task 04)
**Legacy source:** `src/_ajanlatok/ajanlatok.GET.php`, `ajanlat_uj.*`, `ajanlat_modosit.*`, `ajanlat_torol.*`
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

Full CRUD over offers for administrators, including unpublished ones. Offers have **no readers**
relation (`app/Models/Offer.php` has none, and the legacy list showed none), which is the only
structural difference from news.

## Files

- Create: `app/Http/Controllers/AdminOfferController.php`
- Create: `app/Http/Requests/StoreOfferRequest.php`, `app/Http/Requests/UpdateOfferRequest.php`
- Create: `app/Http/Resources/AdminOfferResource.php`
- Modify: `routes/api.php`
- Create: `tests/Feature/AdminOfferController/GetAdminOffersTest.php`,
  `GetAdminOfferItemTest.php`, `StoreOfferTest.php`, `UpdateOfferTest.php`, `DeleteOfferTest.php`

## Contract

```php
Route::controller(AdminOfferController::class)->prefix('offers')->group(function () {
    Route::get('/', 'getOffers');
    Route::post('/', 'storeOffer');
    Route::get('/{offer}', 'getOfferItem');
    Route::put('/{offer}', 'updateOffer');
    Route::delete('/{offer}', 'deleteOffer');
});
```

`GET /api/admin/offers` → all offers, published or not, `orderBy('published_at', 'desc')`:

```json
{ "data": [ { "id": 1, "audience": "P", "title": "…", "mainContent": "…",
              "additionalContent": null, "publishedAt": "…", "createdAt": "…", "updatedAt": "…" } ] }
```

Request rules for both store and update (identical to news):

```php
'audience' => ['required', 'string', 'in:A,P'],
'title' => ['required', 'string', 'max:255'],
'mainContent' => ['required', 'string'],
'additionalContent' => ['nullable', 'string'],
'publishedAt' => ['required', 'date'],
```

Responses: `POST` → 201 `{"data": …}`, `PUT` → 200 `{"data": …}`, `DELETE` → 204.
Unknown id → 404 `GENERIC_NOT_FOUND`. Guest / non-admin → 404 (middleware).

> The legacy offer form's audience select existed but `ajanlat_uj.POST.php` did not require it;
> the new API requires it, matching the news form and the `offers.audience` column. Note the
> tightening in the journal.

## Steps

- [ ] Follow Task 04 step-for-step, substituting `Offer`/`offers` and dropping everything about
      readers.
- [ ] Reuse the seeding style of `tests/Feature/OfferController/GetOffersTest.php` for the
      fixtures, and `Carbon::setTestNowAndTimezone(...)` in `beforeEach`.
- [ ] `vendor/bin/pint --dirty --format agent`, self review, journal, tick Task 07.

## Tests to write

| File | Cases |
|---|---|
| `GetAdminOffersTest` | lists all offers incl. unpublished; ordering; guest 404; non-admin 404 |
| `GetAdminOfferItemTest` | returns one offer; unknown id 404; guest 404; non-admin 404 |
| `StoreOfferTest` | creates and returns 201; persists all columns; 422 on missing title; 422 on bad audience; guest/non-admin 404 |
| `UpdateOfferTest` | updates every field; unknown id 404; 422; guest/non-admin 404 |
| `DeleteOfferTest` | deletes and returns 204; unknown id 404; guest/non-admin 404 |

## Verification

```bash
php artisan test --compact --filter=AdminOffer
php artisan test --compact --filter=OfferController   # public endpoints unchanged
vendor/bin/pint --dirty --format agent
```

## Self review

- [ ] `OfferController`, `OfferResource` and `OfferCollection` are untouched.
- [ ] The admin list is not paginated (the grid paginates client-side) and includes unpublished
      offers.
- [ ] Actions wrapped in `try/catch (Throwable) { abort(500); }`.
- [ ] Routes live inside the `admin` group.

## Done when

All five test files pass, Pint is clean, journal updated, work **left uncommitted**.
