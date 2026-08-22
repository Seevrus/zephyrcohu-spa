# Task 13 — BE: link category fallback + links admin API

**Type:** Backend
**Depends on:** Task 01
**Legacy source:** `src/_linkek/linkek.GET.php`, `link_uj.*`, `link_modosit.*`, `link_torol.*`,
`src/_linkek/_kategoriak/*`
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

Two parts, in order:

- **Part A — the "Egyéb" fallback (decision D8).** Make `links.link_category_id` nullable with
  `nullOnDelete`, and make the public read path treat a null category as "Egyéb". This touches
  already-shipped code and is worth reviewing (and committing) on its own.
- **Part B — the admin API.** CRUD over links, plus rename/delete for their categories.

Part A must land first: without it, the delete-category endpoint in Part B would destroy links.

---

# Part A — link category fallback

## Why this is a prerequisite, not a nice-to-have

The shipped schema has `links.link_category_id` NOT NULL with `cascadeOnDelete`, and
`LinkController::getLinks` **inner-joins** `link_categories`. Nobody has hit this because there is
no UI to delete a category yet. The moment Part B ships one, the current schema turns a category
deletion into silent link deletion — and if the column were merely made nullable without fixing
the query, the orphaned links would quietly disappear from `/tudasbazis/linkek` instead, which is
worse (invisible data loss rather than loud data loss).

## Files (Part A)

- Create: `database/migrations/<timestamp>_update_links_table.php`
- Modify: `app/Models/Link.php` — the fallback constant and a nullable relation
- Modify: `app/Http/Controllers/LinkController.php` — left join + fallback ordering
- Modify: `app/Http/Resources/LinkResource.php` — fallback category name
- Modify: `tests/Feature/LinkController/GetLinksTest.php` — a null-category case

## Migration

Both the app and the test suite run on MySQL (`phpunit.xml` points at
`zephyrco_fo_honlap_test`), so dropping and re-adding the foreign key is straightforward — no
SQLite table-rebuild caveats.

```php
public function up(): void {
    Schema::table('links', function (Blueprint $table) {
        $table->dropForeign(['link_category_id']);
        $table->foreignId('link_category_id')->nullable()->change();
        $table->foreign('link_category_id')
            ->references('id')->on('link_categories')
            ->cascadeOnUpdate()
            ->nullOnDelete();
    });
}
```

The `down()` direction is lossy — going back to NOT NULL cannot invent categories for rows that
have none. Write it so that it deletes links whose `link_category_id` is null before restoring
the constraint, and put a comment on it saying exactly that.

## Read path

`app/Models/Link.php`:

```php
public const UNCATEGORISED_NAME = 'Egyéb';
```

`LinkController::getLinks` — inner join becomes a left join, and the sort falls back to the same
string so uncategorised links land alphabetically among the real categories (the legacy query did
`IFNULL(lk.kategoria, 'Egyéb') as kategoria ORDER BY kategoria`):

```php
$links = Link::query()
    ->leftJoin('link_categories', 'link_categories.id', '=', 'links.link_category_id')
    ->orderByRaw('COALESCE(link_categories.category_name, ?)', [Link::UNCATEGORISED_NAME])
    ->orderBy('links.title')
    ->select('links.*')
    ->with('category')
    ->get();
```

`LinkResource` — `whenLoaded` currently dereferences the relation and would fatal on a null
category:

```php
'category' => $this->category?->category_name ?? Link::UNCATEGORISED_NAME,
```

The public JSON contract is unchanged: `category` is still always a string, so
`resources/frontend/src/types/links.ts` and `pages/links/links.component.ts` (which groups by that
string) need **no** changes. Confirm that by running the links FE spec, not by assuming it.

## Reserved category name

Because "Egyéb" is now a virtual group, an actual category with that name would be
indistinguishable from it on the public page (the FE's `reduce` would merge both into one
heading). Reject it in the admin API: `Rule::notIn([Link::UNCATEGORISED_NAME])` on create and
rename, with the message "Ez a kategórianév foglalt." This is a small deliberate addition, not
legacy behaviour — note it in the journal.

## Tests (Part A)

Extend `tests/Feature/LinkController/GetLinksTest.php`:

- a link with `link_category_id = null` is returned with `"category": "Egyéb"`
- it is **not** dropped from the response (the left-join regression)
- it sorts into the right place: with categories "Community", "Documentation" and a null-category
  link, the order is Community → **Egyéb** → Documentation
- deleting a `link_categories` row leaves its links in place with a null category
  (a direct `DB::table('link_categories')->delete()` test proving `nullOnDelete` is live)

## Verification (Part A)

```bash
php artisan migrate
php artisan test --compact --filter=GetLinksTest
cd resources/frontend && npx ng test    # the public links page must be untouched and green
```

Only once Part A is green, start Part B.

---

# Part B — admin API

## Files

- Create: `app/Http/Controllers/AdminLinkController.php`
- Create: `app/Http/Controllers/AdminLinkCategoryController.php`
- Create: `app/Http/Requests/StoreLinkRequest.php`, `UpdateLinkRequest.php`,
  `UpdateLinkCategoryRequest.php`
- Create: `app/Http/Resources/AdminLinkResource.php`, `AdminLinkCategoryResource.php`
- Modify: `routes/api.php`
- Create: `tests/Feature/AdminLinkController/` — `GetAdminLinksTest.php`, `StoreLinkTest.php`,
  `UpdateLinkTest.php`, `DeleteLinkTest.php`
- Create: `tests/Feature/AdminLinkCategoryController/` — `GetAdminLinkCategoriesTest.php`,
  `UpdateLinkCategoryTest.php`, `DeleteLinkCategoryTest.php`

## Contract

```php
Route::controller(AdminLinkController::class)->prefix('links')->group(function () {
    Route::get('/', 'getLinks');
    Route::post('/', 'storeLink');
    Route::get('/{link}', 'getLink');
    Route::put('/{link}', 'updateLink');
    Route::delete('/{link}', 'deleteLink');
});

Route::controller(AdminLinkCategoryController::class)->prefix('link-categories')->group(function () {
    Route::get('/', 'getLinkCategories');
    Route::put('/{linkCategory}', 'updateLinkCategory');
    Route::delete('/{linkCategory}', 'deleteLinkCategory');
});
```

### `GET /api/admin/links` → 200

All links with their category, ordered by category name (nulls sorting as "Egyéb", exactly like
the public endpoint) then title:

```json
{ "data": [ { "id": 1, "title": "…", "url": "https://…",
              "category": { "id": 2, "name": "Hasznos oldalak" } },
            { "id": 4, "title": "…", "url": "https://…",
              "category": null } ] }
```

`category` is `null` for an uncategorised link — the admin UI needs to tell "genuinely
uncategorised" apart from "a category that happens to be called Egyéb", so the admin resource
does **not** apply the fallback string. The public `LinkResource` still does (Part A).

### `POST /api/admin/links` → 201, `PUT /api/admin/links/{link}` → 200

```php
'title' => ['required', 'string', 'max:500'],
'url' => ['required', 'string', 'max:500', 'url'],
'categoryName' => ['nullable', 'string', 'max:255', Rule::notIn([Link::UNCATEGORISED_NAME])],
```

`categoryName` replaces the legacy "pick an existing category **or** type a new one" pair:
the controller does `LinkCategory::firstOrCreate(['category_name' => trim($name)])` and stores
its id. A `null` (or omitted) `categoryName` stores `link_category_id = null`, i.e. the link shows
up under "Egyéb" on the public page. `"Egyéb"` itself is rejected with 422 and the message
"Ez a kategórianév foglalt." (Part A, reserved name). The legacy hint "Kötelezően a protokollal
együtt! (pl.: „https://”)" is enforced by the `url` rule.

### `DELETE /api/admin/links/{link}` → 204

### `GET /api/admin/link-categories` → 200

```json
{ "data": [ { "id": 2, "name": "Hasznos oldalak", "linkCount": 5 } ] }
```

Ordered by name, `withCount('links')`.

### `PUT /api/admin/link-categories/{linkCategory}` → 200

```php
'name' => [
    'required', 'string', 'max:255',
    Rule::notIn([Link::UNCATEGORISED_NAME]),
    Rule::unique('link_categories', 'category_name')->ignore($this->route('linkCategory')),
],
```

### `DELETE /api/admin/link-categories/{linkCategory}` → 204

Deletes the category; its links **survive** with `link_category_id = null` and read back as
"Egyéb" (Part A's `nullOnDelete`), which restores the legacy behaviour. The FE dialog says where
the links end up, with the count (Task 15). Assert the null-out in a test rather than assuming
the FK does it.

Guest / non-admin → 404 everywhere. Unknown id → 404.

## Steps

- [ ] **Step 0:** Finish Part A (migration, read path, its tests) and confirm both the PHP and the
      FE links specs are green before touching the admin API.
- [ ] **Step 1:** `GetAdminLinksTest` — seed two categories, three categorised links and one
      uncategorised one; assert ordering (the null one sorting as "Egyéb"), the embedded category
      object, `category: null` for the uncategorised link, guard cases. Red → implement → green.
- [ ] **Step 2:** `StoreLinkTest` — creates with an existing category name (no new category row);
      creates with a brand-new category name (category row created); creates with
      `categoryName: null` (link stored with a null category); rejects `"Egyéb"` with 422;
      422 on a missing protocol (`example.com`); 422 on missing title; guard cases.
- [ ] **Step 3:** `UpdateLinkTest` — moves a link to another existing category; creates a category
      when a new name is given; clears the category with `categoryName: null`; 404 unknown id;
      422; guard cases.
- [ ] **Step 4:** `DeleteLinkTest` — 204, row gone, category untouched; guard cases.
- [ ] **Step 5:** `GetAdminLinkCategoriesTest` — ordering, `linkCount` (including a zero-link
      category); guard cases.
- [ ] **Step 6:** `UpdateLinkCategoryTest` — rename; duplicate name 422; renaming to `"Egyéb"`
      422; renaming to its own name succeeds; 404; guard cases.
- [ ] **Step 7:** `DeleteLinkCategoryTest` — category gone, **its links still exist with a null
      category** and read back as "Egyéb" through the public endpoint; other categories' links
      untouched; 404; guard cases.
- [ ] **Step 8:** Pint, self review, journal, tick Task 13.

## Verification

```bash
php artisan migrate
php artisan test --compact --filter=AdminLink
php artisan test --compact --filter=GetLinksTest       # public endpoint: fallback + no dropped rows
cd resources/frontend && npx ng test                    # public links page untouched
vendor/bin/pint --dirty --format agent
```

## Self review

- [ ] Deleting a category never deletes a link — proven by a test that reads the links back
      afterwards, not by reading the migration.
- [ ] The public endpoint returns uncategorised links (the left-join regression has a test).
- [ ] `firstOrCreate` trims the category name, so `"Hasznos "` does not create a twin of
      `"Hasznos"`.
- [ ] Category ids are never accepted from the client for creation (only names) — one code path,
      no ambiguity.
- [ ] `"Egyéb"` cannot be created or renamed to, in either endpoint.
- [ ] The public `LinkResource` JSON shape is unchanged (`category` is still always a string), so
      no FE type or page needed touching.
- [ ] The migration's `down()` documents its lossiness.
- [ ] `url` validation accepts `https://` and rejects a bare host.

## Done when

Part A's migration and read-path tests pass alongside all seven Part B test files, the FE links
spec is still green, Pint is clean, journal updated, work **left uncommitted**.
