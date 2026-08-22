# Task 09 — BE: knowledgebase admin API

**Type:** Backend
**Depends on:** Task 01 (pattern: Task 04)
**Legacy source:** `src/_tudasbazis/tudasbazis.GET.php`, `tudasbazis_uj.*`, `tudasbazis_modosit.*`, `tudasbazis_torol.*`
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

Full CRUD over knowledgebase articles, including unpublished ones, their readers, and their
tags — where tags are created on the fly by name (decision D7).

## Files

- Create: `app/Http/Controllers/AdminKnowledgebaseController.php`
- Create: `app/Http/Requests/StoreKnowledgebaseRequest.php`, `UpdateKnowledgebaseRequest.php`
- Create: `app/Http/Resources/AdminKnowledgebaseResource.php`
- Modify: `routes/api.php`
- Create: `tests/Feature/AdminKnowledgebaseController/` — `GetAdminKnowledgebaseTest.php`,
  `GetAdminKnowledgebaseItemTest.php`, `StoreKnowledgebaseTest.php`,
  `UpdateKnowledgebaseTest.php`, `DeleteKnowledgebaseTest.php`

## Contract

```php
Route::controller(AdminKnowledgebaseController::class)->prefix('knowledgebase')->group(function () {
    Route::get('/', 'getKnowledgebase');
    Route::post('/', 'storeKnowledgebaseItem');
    Route::get('/{knowledgebase}', 'getKnowledgebaseItem');
    Route::put('/{knowledgebase}', 'updateKnowledgebaseItem');
    Route::delete('/{knowledgebase}', 'deleteKnowledgebaseItem');
});
```

### `GET /api/admin/knowledgebase` → 200

All articles, published or not, `orderBy('published_at', 'desc')`, with `tags` and `readers`
eager-loaded:

```json
{
  "data": [
    {
      "id": 1,
      "audience": "A",
      "title": "…",
      "mainContent": "…",
      "additionalContent": null,
      "tags": [{ "id": 3, "name": "INTEGRA" }],
      "publishedAt": "…",
      "createdAt": "…",
      "updatedAt": "…",
      "readerCount": 1,
      "readers": ["user001@example.com"]
    }
  ]
}
```

Tags are serialised with the existing `TagResource` (`id`, `name`, and `count` only when
counted) — reuse it, do not write a second tag resource.

### `POST` / `PUT`

```php
'audience' => ['required', 'string', 'in:A,P'],
'title' => ['required', 'string', 'max:255'],
'mainContent' => ['required', 'string'],
'additionalContent' => ['nullable', 'string'],
'publishedAt' => ['required', 'date'],
'tags' => ['array'],
'tags.*' => ['string', 'max:255'],
```

Tag handling (both actions), inside a `DB::transaction`:

```php
$tagIds = collect($request->validated('tags', []))
    ->map(fn (string $name) => trim($name))
    ->filter()
    ->unique()
    ->map(fn (string $name) => Tag::firstOrCreate(['tag_name' => $name])->id);

$knowledgebase->tags()->sync($tagIds);
```

`sync` also removes de-selected tags, which is exactly what the legacy update did the hard way.
Tags that end up orphaned are **not** deleted here — the tags admin screen (Tasks 11/12) is where
they get cleaned up.

`POST` → 201 with the article (tags loaded, `readerCount: 0`, `readers: []`).
`PUT` → 200. `DELETE` → 204 (pivot rows cascade; verify `knowledgebase_tags` and
`users_knowledgebase` are `cascadeOnDelete` — they are, per their migrations).

## Steps

- [ ] **Step 1:** `GetAdminKnowledgebaseTest` first — seed a plain user, an admin, three articles
      (published public, published auth, future), two tags with pivot rows, one read row. Assert
      the full shape including tags and readers. Red.
- [ ] **Step 2:** Implement `getKnowledgebase` + resource + route; green.
- [ ] **Step 3:** `GetAdminKnowledgebaseItemTest` → implement.
- [ ] **Step 4:** `StoreKnowledgebaseTest` — include the tag cases below → implement with the
      transaction + `firstOrCreate` + `sync`.
- [ ] **Step 5:** `UpdateKnowledgebaseTest` → implement.
- [ ] **Step 6:** `DeleteKnowledgebaseTest` → implement.
- [ ] **Step 7:** Pint, self review, journal, tick Task 09.

## Tests to write

| File | Cases |
|---|---|
| `GetAdminKnowledgebaseTest` | lists all articles incl. unpublished; tags serialised; readers + readerCount; ordering; guest/non-admin 404 |
| `GetAdminKnowledgebaseItemTest` | single article with tags; unknown id 404; guest/non-admin 404 |
| `StoreKnowledgebaseTest` | creates an article; **creates missing tags** and attaches them; **reuses an existing tag by name** instead of duplicating it; trims and de-duplicates tag names; accepts an empty `tags` array; 422 on missing title / bad audience; guest/non-admin 404 |
| `UpdateKnowledgebaseTest` | updates fields; **adds and removes** tags through `sync`; leaves other articles' tag links alone; unknown id 404; 422; guest/non-admin 404 |
| `DeleteKnowledgebaseTest` | deletes the article, its `knowledgebase_tags` rows and its `users_knowledgebase` rows; the `tags` rows themselves survive; unknown id 404; guest/non-admin 404 |

## Verification

```bash
php artisan test --compact --filter=AdminKnowledgebase
php artisan test --compact --filter=KnowledgebaseController   # public endpoints unchanged
vendor/bin/pint --dirty --format agent
```

## Self review

- [ ] Tag creation is idempotent — two articles submitting the same new tag name end up sharing
      one row (a test proves it).
- [ ] Everything that writes both the article and its tags runs inside one transaction.
- [ ] `TagResource` is reused; no duplicate tag serialisation.
- [ ] The public `KnowledgebaseController`, its resources and the tag-cloud endpoint are
      untouched.
- [ ] No N+1 on tags/readers in the list action.

## Done when

All five test files pass, Pint is clean, journal updated, work **left uncommitted**.
