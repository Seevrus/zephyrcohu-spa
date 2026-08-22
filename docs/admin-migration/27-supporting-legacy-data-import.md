# Task 27 — Supporting: legacy data import

**Type:** Supporting (BE + ops)
**Depends on:** Task 13 Part A (links schema), Task 16 (document storage layout), Task 22
(newsletter models). Run it **after** Task 26 so the import targets a verified schema, and before
the first deployment.
**Legacy source:** the production MySQL database behind `zephyrcohu-admin-ui`
(`src_check/.env` → `DB_NAME`), plus the `letoltesek/` upload tree on that host.
**Skills:** `superpowers:systematic-debugging`, `superpowers:verification-before-completion`

## Goal

Move the live content out of the legacy database into the new schema: users, news, offers,
knowledgebase articles and tags, links and categories, Integra documents and their files, sent
newsletters, and the "who read what" history.

## What the human has to provide first

The agent cannot reach the legacy host. Before this task can start, someone must:

1. **Dump the legacy database** (schema + data):
   ```bash
   mysqldump --single-transaction --routines=false --triggers=false \
     -u <user> -p <legacy_db_name> > legacy_dump.sql
   ```
2. **Restore it into a scratch schema on the same MySQL server** that hosts
   `zephyrco_fo_honlap`, e.g. `zephyr_legacy`. Cross-database `INSERT … SELECT` is what makes the
   import a single SQL script instead of an ETL program.
3. **Copy the upload tree** from the legacy host — `public_html/letoltesek/**` and
   `letoltesek/**` (the `programfrissites` directory lives outside `public_html`) — to somewhere
   the new app's storage can read from.
4. **Confirm the target is a fresh database.** This import assumes the new tables are empty. If
   anything has been entered by hand, decide per table whether to truncate or to offset ids —
   and write that decision into the journal before running anything.

## ⚠ The legacy schema in this document is *inferred*

Everything below was reconstructed from the SQL statements in the legacy PHP, not from a schema
dump. Column names are reliable (they appear in queries verbatim); **types, nullability, extra
columns and pivot timestamps are not.** So:

- [ ] **Step 1:** Run `SHOW CREATE TABLE <t>` for every legacy table listed below and paste the
      output into the journal entry for this task.
- [ ] **Step 2:** Reconcile it against the mapping table. Anything that does not match — an extra
      column, a different type, a pivot with a timestamp this document does not mention — gets
      resolved **before** a single INSERT is written, and the mapping table in this file gets
      corrected in the same change.

## Table mapping

| Legacy table | New table | Notes |
|---|---|---|
| `felhasznalok` | `users` | `azonosito`→`id`, `email`, `jelszo`→`password`, `jelszo_kor`→`password_set_at`, `megerositve`→`confirmed`, `hirlevel`→`newsletter`; `ip_address` and `last_active` → NULL |
| `felhasznalo_adminisztrator` | `user_admins` | `felhasznalo_azonosito`→`user_id` |
| `hirek` | `news` | see the content transform below |
| `hir_olvaso` | `users_news` | `felhasznalo_azonosito`→`user_id`, `hir_azonosito`→`news_id`, `read_at` ← the legacy timestamp if one exists, otherwise the import timestamp |
| `ajanlatok` | `offers` | same transform as `hirek`; no readers table in either schema |
| `tudasbazis` | `knowledgebase` | same transform as `hirek` |
| `tudasbazis_cimkek` | `tags` | `azonosito`→`id`, `cimke`→`tag_name` (entity-decode it) |
| `tudasbazis_cikk_cimke` | `knowledgebase_tags` | `cikk_azonosito`→`knowledgebase_id`, `cimke_azonosito`→`tag_id` |
| `tudasbazis_cikk_olvaso` | `users_knowledgebase` | as `hir_olvaso` |
| `linkek_kategoria` | `link_categories` | `azonosito`→`id`, `kategoria`→`category_name` |
| `linkek` | `links` | `cim`→`title`, `uri`→`url`, `kategoria`→`link_category_id` (nullable since Task 13 Part A — legacy nulls stay null and read back as "Egyéb"); `created_at`/`updated_at` ← import timestamp |
| `integra` | `documents` | category int → enum, `nev`→`display_name`, `verzio`→`version`, `ervenyes`→`published_at`, `path` computed — see below |
| `hirlevel` | `newsletters` | `targy`→`subject`, `szoveg`→`content` (entity-decode), `datum`→`created_at`/`updated_at` |
| `felhasznalo_hirlevel` | `users_newsletters` | **only rows with `elkuldve = 1`**; `probalkozasok`, `kod` and `datum` have no home in the new schema and are dropped |
| `felhasznalo_ujjelszo` | *(not imported)* | one-day password codes; pointless to carry over |
| `swagger` | *(not imported)* | the new SPA has no swagger token table |

Keep the legacy `azonosito` values as the new `id`s — that is what makes the pivot tables a
straight copy. Reset each table's `AUTO_INCREMENT` above the highest imported id afterwards.

## Content transforms

### 1. Un-escaping the rich text (the important one)

The legacy admin stored every text field through `htmlspecialchars($value)` with `ENT_QUOTES`,
so the database holds **escaped** HTML: `&lt;p&gt;Sz&amp;ouml;veg&lt;/p&gt;`. Inserted as-is, the
new pages would render literal tags. `htmlspecialchars` only ever produces five entities, so a
nested `REPLACE()` decodes it exactly:

```sql
REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  col, '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&#039;', ''''), '&amp;', '&')
```

**Order matters:** `&amp;` must be decoded **last**, otherwise `&amp;lt;` (a literal `&lt;` the
author typed) turns into `<`. Define this once as a SQL snippet and reuse it for every text
column: `hirek.cim`, `hirek.foszoveg`, `hirek.tovabbi` and the same fields on `ajanlatok`,
`tudasbazis`, `hirlevel.targy`, `hirlevel.szoveg`, `tudasbazis_cimkek.cimke`, `linkek.cim`,
`linkek.uri`, `linkek_kategoria.kategoria`, `integra.nev`.

Empty strings in `tovabbi` become `NULL` in `additional_content`
(`NULLIF(<decoded>, '')`).

### 2. Audience and dates

- `kiknek` 0 → `audience = 'P'` (Mindenki), 1 → `'A'` (Regisztrált felhasználók)
- `datum` is a DATE; `published_at` is a timestamp → `CONCAT(datum, ' 00:00:00')`
- `ervenyes` is **dropped** (decision D4)
- `created_at` and `updated_at` are NOT NULL in the new tables → set both to the same value as
  `published_at`

### 3. Integra documents and their files

Legacy `integra.kategoria` is an int; the order in `integra_uj.POST.php` is
`['tajekoztato','probaverzio','dokumentacio','programfrissites','egyeb_dokumentumok']`:

| Legacy int | `DocumentCategory` | Disk (`Document::disk()`) |
|---|---|---|
| 0 | `integra-flyer` | `public` |
| 1 | `integra-trial` | `public` |
| 2 | `integra-documentation` | `public` |
| 3 | `integra-update` | **`local`** (private) |
| 4 | `integra-other` | `public` |

For each row: copy `<utvonal>/<fajlnev>` from the legacy tree into
`storage/app/public/integra/<category>/<fajlnev>` — or `storage/app/private/integra/<category>/`
for `integra-update` — and set `documents.path = 'integra/<category>/<fajlnev>'`. The legacy
filenames were already hyphenised by the legacy `hyphenize()`, so they can be used unchanged.
`published_at` ← `ervenyes` when set, otherwise the import timestamp (the legacy list rendered a
null `ervenyes` as "Korlátlan"; the new schema has no such concept, and `published_at` in the past
means "visible").

The file copy is not SQL. Do it as a documented shell step (or a throwaway artisan command) and
have the verification below prove every row's file exists.

### 4. Passwords

Legacy hashes come from PHP's `password_hash($p, PASSWORD_DEFAULT)` — bcrypt, `$2y$…`. Laravel's
default hasher is bcrypt too, so `Hash::check()` accepts them unchanged. Confirm
`config/hashing.php` still says `'driver' => 'bcrypt'` before relying on this, and verify with one
real account after the import.

## Open question to settle during the task

**Unconfirmed legacy users.** Rows with `megerositve = 0` import as `confirmed = 0`, but the new
confirmation flow needs a `users_new` row holding an `email_code` — the legacy schema stores the
pending-registration state somewhere this document could not identify. Two options; pick one, do
not leave it dangling:

- generate a fresh `users_new` row (random `email_code`) for each unconfirmed user and re-send the
  confirmation mail, or
- import only confirmed users and let the handful of pending ones register again.

Whichever it is, count them first (`SELECT COUNT(*) FROM felhasznalok WHERE megerositve = 0`) —
if the number is tiny, the second option is obviously right.

## Deliverables

- `database/legacy-import/01_users.sql`, `02_content.sql`, `03_links.sql`,
  `04_integra.sql`, `05_newsletters.sql`, `06_readers.sql` — run in that order (parents before
  the pivots)
- `database/legacy-import/README.md` — the export/restore prerequisites, the file-copy step, the
  run order, and the rollback (`TRUNCATE` list, FK checks off/on)
- Each script wrapped in a transaction and safe to re-run after a full truncate; none of them
  touch the legacy schema

## Steps

- [ ] **Step 1–2:** Schema reconciliation (above).
- [ ] **Step 3:** Write `01_users.sql` (users → user_admins), run it against a **copy** of the new
      database, and check counts.
- [ ] **Step 4:** `02_content.sql` — news, offers, knowledgebase, tags, knowledgebase_tags.
- [ ] **Step 5:** `03_links.sql` — categories then links.
- [ ] **Step 6:** `04_integra.sql` plus the file copy.
- [ ] **Step 7:** `05_newsletters.sql` — newsletters, then `users_newsletters` filtered on
      `elkuldve = 1`.
- [ ] **Step 8:** `06_readers.sql` — `users_news`, `users_knowledgebase`.
- [ ] **Step 9:** `AUTO_INCREMENT` resets for every imported table.
- [ ] **Step 10:** Verification (below), then journal + tick Task 27.

## Verification

Row counts, legacy vs new:

```sql
SELECT (SELECT COUNT(*) FROM zephyr_legacy.hirek)       AS legacy_news,
       (SELECT COUNT(*) FROM zephyrco_fo_honlap.news)   AS new_news;
-- …repeat per table pair
```

Then, in the running app:

- [ ] `/hirek`, `/ajanlatok`, `/tudasbazis/cikkek` render imported content as **formatted HTML**,
      not as visible tags — this is the entity-decode working (or not)
- [ ] an article with accented characters (á, ő, ű) is intact end to end — the legacy connection
      is `utf8mb4` and the new one is `utf8mb4_hungarian_ci`; a mismatch shows up here first
- [ ] `/tudasbazis/linkek` shows every link, with legacy-uncategorised ones under "Egyéb"
- [ ] every `documents` row downloads through `GET /api/documents/integra/{document}/download`,
      including an `integra-update` one (private disk)
- [ ] one real legacy account can log in with its existing password
- [ ] the admin newsletter list shows the imported newsletters as fully sent
- [ ] `php artisan test --compact` still passes (the import must not have required schema changes)

## Self review

- [ ] The entity-decode chain decodes `&amp;` last, and a spot-check on an article containing a
      literal `&` proves it.
- [ ] No legacy row was silently dropped: every table pair's counts match, or the difference is
      explained in the journal (e.g. unsent newsletter recipients).
- [ ] Ids were preserved, so pivots point at the right rows — verify one reader row by email and
      article title, not by id alone.
- [ ] `integra-update` files landed on the **private** disk; nothing sensitive is under
      `storage/app/public`.
- [ ] The scripts are re-runnable from a truncated database and are not mixed into
      `database/migrations` (this is one-off data movement, not schema).
- [ ] The legacy database was only ever read from.

## Done when

The new database holds the legacy content, every verification item above passes, the scripts and
their README are in `database/legacy-import/`, the journal records the reconciled schema and the
unconfirmed-user decision, and the work is **left uncommitted** for review.
