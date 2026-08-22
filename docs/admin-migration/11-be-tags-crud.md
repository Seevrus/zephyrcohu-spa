# Task 11 — BE: tags admin API

**Type:** Backend
**Depends on:** Task 01
**Legacy source:** `src/_tudasbazis/_cimkek/cimkek.GET.php`, `cimke_modosit.*`, `cimke_torol.*`
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

List, rename and delete knowledgebase tags. Tags are *created* implicitly when an article is
saved (Task 09), so there is no create endpoint here — exactly like the legacy admin, where
`_cimkek` only offered edit and delete.

## Files

- Create: `app/Http/Controllers/AdminTagController.php`
- Create: `app/Http/Requests/UpdateTagRequest.php`
- Modify: `routes/api.php`
- Create: `tests/Feature/AdminTagController/GetAdminTagsTest.php`, `UpdateTagTest.php`,
  `DeleteTagTest.php`

## Contract

```php
Route::controller(AdminTagController::class)->prefix('tags')->group(function () {
    Route::get('/', 'getTags');
    Route::put('/{tag}', 'updateTag');
    Route::delete('/{tag}', 'deleteTag');
});
```

### `GET /api/admin/tags` → 200

Every tag ordered by name, with the number of articles using it. Reuse `TagResource`, which
already emits `count` via `whenCounted('knowledgebase')`:

```php
$tags = Tag::withCount('knowledgebase')->orderBy('tag_name')->get();

return TagResource::collection($tags);
```

```json
{ "data": [ { "id": 3, "name": "INTEGRA", "count": 4 } ] }
```

> `TagResource::$count` comes from `withCount('knowledgebase')` producing
> `knowledgebase_count`. Check that `whenCounted('knowledgebase')` picks it up with this model's
> relation name; if it does not, use `whenCounted('knowledgebase')`'s explicit form or add the
> attribute in the controller — and note whichever you did in the journal.

### `PUT /api/admin/tags/{tag}` → 200

```php
'name' => ['required', 'string', 'max:255'],
```

Renames `tag_name`. If another tag already carries that name, **merge** is out of scope: return
422 with Laravel's validation shape by adding `Rule::unique('tags', 'tag_name')->ignore($tag)` to
the rules. Response: `{"data": {"id": …, "name": …, "count": …}}`.

### `DELETE /api/admin/tags/{tag}` → 204

Deletes the tag; `knowledgebase_tags` rows go with it (the pivot FK is `cascadeOnDelete`).
Articles themselves are untouched.

Guest / non-admin → 404. Unknown id → 404.

## Steps

- [ ] **Step 1:** `GetAdminTagsTest` — seed three tags, two articles, pivot rows; assert
      alphabetical order and correct counts (including a zero-count tag); guest/non-admin 404.
      Red → implement → green.
- [ ] **Step 2:** `UpdateTagTest` — rename works; duplicate name → 422; unknown id → 404;
      guest/non-admin 404.
- [ ] **Step 3:** `DeleteTagTest` — tag row gone, pivot rows gone, articles still present;
      unknown id 404; guest/non-admin 404.
- [ ] **Step 4:** Pint, self review, journal, tick Task 11.

## Verification

```bash
php artisan test --compact --filter=AdminTag
php artisan test --compact --filter=GetKnowledgebaseTags   # public tag cloud unchanged
vendor/bin/pint --dirty --format agent
```

## Self review

- [ ] Deleting a tag never deletes an article.
- [ ] The unique rule ignores the tag being renamed (renaming to its own name must succeed).
- [ ] Counts come from `withCount`, not from loading the relation.
- [ ] `TagResource` is reused unchanged; the public tag-cloud response shape is identical to
      before (a public test proves it).

## Done when

The three test files pass, Pint is clean, journal updated, work **left uncommitted**.
