# Task 16 — BE: Integra documents admin API (upload / replace / delete)

**Type:** Backend
**Depends on:** Task 01
**Legacy source:** `src/_integra/integra.GET.php`, `integra_uj.*`, `integra_modosit.*`, `integra_torol.*`
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

Let administrators upload, edit and delete the Integra documents that `/integra/:kategoria`
serves. This is the only admin area that touches the filesystem, so file handling is the risky
part: a failed upload must not leave a half-written row, and a delete must remove both the row
and the file.

## Files

- Create: `app/Http/Controllers/AdminDocumentController.php`
- Create: `app/Http/Requests/StoreDocumentRequest.php`, `UpdateDocumentRequest.php`
- Create: `app/Http/Resources/AdminDocumentResource.php`
- Modify: `routes/api.php`
- Create: `tests/Feature/AdminDocumentController/` — `GetAdminDocumentsTest.php`,
  `StoreDocumentTest.php`, `UpdateDocumentTest.php`, `DeleteDocumentTest.php`

## Existing behaviour to respect

`app/Models/Document.php` decides the disk per category:

```php
public function disk(): string {
    return $this->category === DocumentCategory::IntegraUpdate ? 'local' : 'public';
}
```

`DocumentController::downloadDocument` streams from `Storage::disk($document->disk())`, so the
admin side must write to the *same* disk and store a matching relative `path`.
`app/DocumentCategory.php` holds the five categories
(`integra-flyer`, `integra-trial`, `integra-update`, `integra-documentation`, `integra-other`).

## Contract

```php
Route::controller(AdminDocumentController::class)->prefix('documents')->group(function () {
    Route::get('/', 'getDocuments');
    Route::post('/', 'storeDocument');
    Route::get('/{document}', 'getDocument');
    Route::post('/{document}', 'updateDocument');   // POST, not PUT — decision D9
    Route::delete('/{document}', 'deleteDocument');
});
```

### `GET /api/admin/documents` → 200

All documents, every category, published or not, ordered by category then `display_name`:

```json
{ "data": [ { "id": 1, "category": "integra-flyer", "displayName": "…", "version": "1.2.3",
              "fileName": "integra-flyer-2026.pdf", "publishedAt": "…" } ] }
```

`fileName` is `basename($document->path)` — the admin list showed the stored file, and the FE
grid needs it to tell two same-named documents apart.

### `POST /api/admin/documents` → 201 (multipart/form-data)

```php
'category' => ['required', Rule::enum(DocumentCategory::class)],
'displayName' => ['required', 'string', 'max:255'],
'version' => ['required', 'string', 'max:255'],
'publishedAt' => ['required', 'date'],
'file' => ['required', 'file', 'max:51200'],   // 50 MB, matching the legacy uploads
```

Storage rules:

- target directory: `integra/{category}` on `Document::disk()`'s disk for that category
- file name: `Str::slug(pathinfo($originalName, PATHINFO_FILENAME)) . '.' . $extension`
  (the legacy `hyphenize()` did the same job)
- if that path already exists on the disk → **422** with a validation-shaped body for the `file`
  key and the message "Ez a fájl korábban már feltöltésre került!" (legacy wording). Do not
  silently overwrite.
- write the file first, then the row, inside a `try/catch`; if the insert fails, delete the file
  again before `abort(500)`

### `POST /api/admin/documents/{document}` → 200

Same rules, but `file` is `['nullable', 'file', 'max:51200']`. Behaviour, mirroring the legacy
`integra_modosit.POST.php`:

- metadata only (no file, same category) → update the row
- category changed, no new file → **move** the file to the new category directory (and possibly
  the other disk), then update `path` and `category`; if a file with that name already exists at
  the destination → 422 "Az új kategóriában ilyen nevű fájl már létezik."
- new file uploaded → store the new file, update the row, then delete the old file; if anything
  fails, leave the old file in place and `abort(500)`

### `DELETE /api/admin/documents/{document}` → 204

Delete the file from its disk, then the row. A missing file on disk must **not** block the row
deletion (log it and continue) — the legacy version failed hard here and left rows unreachable.

Guest / non-admin → 404. Unknown id → 404.

## Steps

- [ ] **Step 1:** `GetAdminDocumentsTest` — seed documents in three categories incl. a future
      `published_at`; assert ordering, `fileName`, guard cases. Red → implement → green.
- [ ] **Step 2:** `StoreDocumentTest` with `Storage::fake('public')` and `Storage::fake('local')`
      plus `UploadedFile::fake()->create('Integra Flyer 2026.pdf', 120)`. Cases below.
- [ ] **Step 3:** `UpdateDocumentTest` — metadata-only, category move (including the
      public→local move for `integra-update`), file replacement, duplicate-at-destination 422.
- [ ] **Step 4:** `DeleteDocumentTest` — row and file gone; missing file still deletes the row.
- [ ] **Step 5:** Pint, self review, journal, tick Task 16.

## Tests to write

| File | Cases |
|---|---|
| `GetAdminDocumentsTest` | lists every category incl. unpublished; ordering; `fileName`; guard cases |
| `StoreDocumentTest` | stores the file on the **public** disk for `integra-flyer`; stores on the **local** disk for `integra-update`; slugifies the filename; persists the row with the relative path; rejects a duplicate filename with 422; 422 on a missing file/category/version; guard cases |
| `UpdateDocumentTest` | metadata-only update leaves the file alone; category change moves the file (assert both disks); replacing the file deletes the old one; duplicate at destination → 422 and nothing changes; unknown id 404; guard cases |
| `DeleteDocumentTest` | deletes row + file; tolerates an already-missing file; unknown id 404; guard cases |

Add one regression test to the **public** side afterwards (or assert inside
`StoreDocumentTest`): a document uploaded through the admin API can be downloaded through
`GET /api/documents/integra/{document}/download` — that round trip is the whole point of getting
the disk/path right.

## Verification

```bash
php artisan test --compact --filter=AdminDocument
php artisan test --compact --filter=DocumentController   # public endpoints unchanged
vendor/bin/pint --dirty --format agent
```

## Self review

- [ ] `path` is stored **relative to the disk root**, exactly as `downloadDocument` expects
      (compare with a row created by the existing seed data or public test fixtures).
- [ ] `integra-update` files land on the `local` (private) disk — a public URL must never expose
      them.
- [ ] No orphan files after a failed insert; no orphan rows after a failed upload.
- [ ] Uploaded filenames are slugified, so spaces and accented characters cannot break the path.
- [ ] The 50 MB limit matches (or is deliberately different from) the PHP `upload_max_filesize`
      of the target environment — if it cannot be verified, note the assumption in the journal.

## Done when

All four test files plus the download round-trip pass, Pint is clean, journal updated, work
**left uncommitted**.
