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

## ⚠ The legacy schema in this document is *inferred* — reconciled 2026-09-15

Everything below was reconstructed from the SQL statements in the legacy PHP, not from a schema
dump. Column names are reliable (they appear in queries verbatim); **types, nullability, extra
columns and pivot timestamps are not.** So:

- [x] **Step 1:** Run `SHOW CREATE TABLE <t>` for every legacy table listed below and paste the
      output into the journal entry for this task. (Done against a small, no-files sample dump
      restored into a scratch `zephyr_legacy` schema — see the journal for the full
      `SHOW CREATE TABLE` output and row counts.)
- [x] **Step 2:** Reconcile it against the mapping table. Anything that does not match — an extra
      column, a different type, a pivot with a timestamp this document does not mention — gets
      resolved **before** a single INSERT is written, and the mapping table in this file gets
      corrected in the same change. (Corrections below; full reasoning in the journal.)

## Table mapping

| Legacy table | New table | Notes |
|---|---|---|
| `felhasznalok` | `users` | `azonosito`→`id`, `email`, `jelszo`→`password` (bcrypt prefix rewrite needed — see "Passwords" below), `jelszo_kor`→`password_set_at` (NULL→import timestamp; NOT NULL, no legacy fallback), `megerositve`→`confirmed`, `hirlevel`→`newsletter`. **Correction:** `ip` and `utolso_bejelentkezes` DO exist in the real table (the original "→ NULL" note was a wrong guess) and map to `ip_address`/`last_active` — except `utolso_bejelentkezes = '0000-00-00 00:00:00'` (a real, occurring value), which must become NULL rather than being inserted as a zero-date. `suti` (cookie consent) has no home; the new schema's mirror column (`users.cookies`) was already dropped, so it is correctly not imported. |
| `felhasznalo_adminisztrator` | `user_admins` | `felhasznalo_azonosito`→`user_id` |
| `felhasznalo_uj` | `users_new` | **Added — missing from the original mapping.** This is exactly the pending-registration state the "Open question" section below could not locate: `felhasznalo_azonosito`→`user_id`, `email_kod`→`email_code` (CAST to string; compared with plain `!=` in `UserPolicy::confirmEmail()`, so it is plaintext in the new schema too, not hashed). See "Open question" below — resolved. |
| `felhasznalo_ujemail` | *(not imported)* | **Added — missing from the original mapping.** Same shape as `felhasznalo_uj` but for email changes; NOT imported, for a stronger version of the `felhasznalo_ujjelszo` reasoning below: `users_new_emails.email_code` is `Hash::check()`'d (not `!=`) and additionally rejected once `issued_at` is more than 30 minutes old (`UserPolicy::confirmNewEmail()`). A dump row is always older than that, so an imported row could never pass regardless of hashing it correctly — it would just be dead weight on a live account. |
| `hirek` | `news` | see the content transform below |
| `hir_olvaso` | `users_news` | `felhasznalo_azonosito`→`user_id`, `hir_azonosito`→`news_id`. **Correction:** the table has no timestamp column at all (bare two-column composite primary key) — `read_at` is always the import timestamp, never a legacy value. |
| `ajanlatok` | `offers` | same transform as `hirek`; no readers table in either schema |
| `tudasbazis` | `knowledgebase` | same transform as `hirek` |
| `tudasbazis_cimkek` | `tags` | `azonosito`→`id`, `cimke`→`tag_name` (entity-decode it) |
| `tudasbazis_cikk_cimke` | `knowledgebase_tags` | `cikk_azonosito`→`knowledgebase_id`, `cimke_azonosito`→`tag_id` |
| `tudasbazis_cikk_olvaso` | `users_knowledgebase` | as `hir_olvaso` — same correction: no timestamp column, always the import timestamp |
| `linkek_kategoria` | `link_categories` | `azonosito`→`id`, `kategoria`→`category_name` |
| `linkek` | `links` | `cim`→`title`, `uri`→`url`, `kategoria`→`link_category_id` (nullable since Task 13 Part A — legacy nulls stay null and read back as "Egyéb"); `created_at`/`updated_at` ← import timestamp. `title`/`url` are NOT NULL while `cim`/`uri` are nullable in legacy — none of the sample's rows hit this, so it is unverified; a real NULL will fail the INSERT outright rather than being silently coerced. |
| `integra` | `documents` | category int → enum — **correction below**, `nev`→`display_name`, `verzio`→`version`, `ervenyes`→`published_at`, `path` computed — see below |
| `hirlevel` | `newsletters` | `targy`→`subject`, `szoveg`→`content` (entity-decode), `datum`→`created_at`/`updated_at` |
| `felhasznalo_hirlevel` | `users_newsletters` | **only rows with `elkuldve = 1`**; `probalkozasok`, `kod` and `datum` have no home in the new schema and are dropped |
| `felhasznalo_ujjelszo` | *(not imported)* | one-day password codes, `Hash::check()`'d with the same 30-minute expiry as `felhasznalo_ujemail` above; pointless to carry over |
| `swagger` | *(not imported)* | the new SPA has no swagger token table |
| `personal_access_tokens`, `sikertelen_bejelentkezesek` | *(not imported)* | **Found during reconciliation, not in the original list.** The legacy schema already has both (Sanctum tokens for `src_check`'s API, and a `sikertelen_bejelentkezesek` failed-login-attempt table keyed by IP). Both are ephemeral session/rate-limit state — re-importing "IP X failed 3 times in 2023" into a live rate limiter makes no sense, and the new schema's mirror (`users_login_attempts`) is keyed by `user_id` with a single row per user, not per IP, so it is not even shape-compatible. |

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
`['tajekoztato','probaverzio','dokumentacio','programfrissites','egyeb_dokumentumok']`.

**Correction:** the table below originally listed `DocumentCategory`'s old `integra-*` values.
Decision D16 (recorded after this task file was written) changed the enum's *value* to the
Hungarian slug, so those cases no longer exist — `documents.category`'s cast would fail on them.
The int→category order is unchanged, only the string values are corrected (confirmed against
`app/DocumentCategory.php`):

| Legacy int | `DocumentCategory` case | value (slug) | Disk (`Document::disk()`) |
|---|---|---|---|
| 0 | `IntegraFlyer` | `tajekoztato` | `public` |
| 1 | `IntegraTrial` | `probaverzio` | `public` |
| 2 | `IntegraDocumentation` | `dokumentacio` | `public` |
| 3 | `IntegraUpdate` | `programfrissites` | **`local`** (private) |
| 4 | `IntegraOther` | `egyeb` | `public` |

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

**Correction — this was checked, not just assumed, and the original assumption was wrong.** The
task doc claimed legacy hashes are all `$2y$…` and that `Hash::check()` "accepts them unchanged."
A real sample shows a mix: `$2a$08$…` (the majority) and `$2y$10$…`. That distinction matters here:
this app's bcrypt hasher has `verify: true` by default (Laravel bakes that default in even with no
published `config/hashing.php`), and on this PHP/OpenSSL build `password_get_info()` reports
`$2a$` hashes as an unknown algorithm — so `Hash::check()` **throws**
`RuntimeException: This password does not use the Bcrypt algorithm.` for every `$2a$` hash instead
of returning `false`. Left as-is, every migrated user with a `$2a$` hash would get a 500 on their
first login attempt.

The fix is a straight prefix rewrite, not a re-hash: `$2a$` and `$2y$` are byte-compatible for any
password without high-bit characters (the only reason `$2y$` was introduced), so
`REPLACE(jelszo, '$2a$', '$2y$')` at import time is enough — confirmed with `password_verify()` and
`Hash::check()` against a hand-built `$2y$` hash of a known password before relying on it for real
data. `01_users.sql` does this for every row; it is a no-op on rows that are already `$2y$`. Users
whose hash was cost-8 (`$2y$08$`, weaker than this app's configured 12 rounds) will transparently
upgrade to cost-12 on their first successful login via the app's existing `rehash_on_login` setting
— no extra step needed for that.

Still verify with one real account's password after the actual import, since this was proven on a
synthetic hash, not a legacy user's real password.

## Open question to settle during the task — resolved 2026-09-15

**Unconfirmed legacy users.** Rows with `megerositve = 0` import as `confirmed = 0`. This document
originally could not find where the legacy schema stores pending-registration state and offered
two either/or fallbacks. The real dump has the table: `felhasznalo_uj` (added to the mapping table
above) is exactly `users_new`, so the resolution is a third, better option neither fallback
considered — **carry the existing row over as-is** rather than generating a fresh code or dropping
the user:

- A `megerositve = 0` user **with** a `felhasznalo_uj` row imports with a matching `users_new` row
  (existing `email_kod`, cast to string) — their old confirmation link keeps working, no mail
  needs re-sending.
- A `megerositve = 0` user **without** one (3 of the sample's 5 unconfirmed users had none — an
  older build's cleaned-up or already-consumed code) imports with no `users_new` row. They cannot
  complete confirmation via a stale link because there is none; they use the app's existing
  "resend confirmation" flow, which issues a fresh code. There is no safe way to fabricate one that
  would match a link the user might still have saved.

`felhasznalo_ujemail` (pending email changes) is excluded from the import entirely — see the
mapping table above; it is time-boxed to 30 minutes and hash-checked, so nothing from a static
dump could ever pass either check.

## Deliverables

- `database/legacy-import/01_users.sql` (also folds in `users_new`/`felhasznalo_uj` — see "Open
  question" above, added to this deliverable once the reconciliation found the table), `02_content.sql`,
  `03_links.sql`, `04_integra.sql`, `05_newsletters.sql`, `06_readers.sql` — run in that order
  (parents before the pivots)
- `database/legacy-import/README.md` — the export/restore prerequisites, the file-copy step, the
  run order, and the rollback (`TRUNCATE` list, FK checks off/on)
- Each script wrapped in a transaction and safe to re-run after a full truncate; none of them
  touch the legacy schema

All six exist and are written; status per step below.

## Steps

- [x] **Step 1–2:** Schema reconciliation (above).
- [x] **Step 3:** Write `01_users.sql` (users → user_admins → users_new), run it against a
      **copy** of the new database, and check counts. Done against a small no-files sample: 64/64
      users, 3/3 admins, 3/3 pending registrations matched.
- [x] **Step 4:** `02_content.sql` — news, offers, knowledgebase, tags, knowledgebase_tags. Done
      against the sample for news (20/20) and knowledgebase (2/2, tags 7/7, knowledgebase_tags
      6/6); `ajanlatok` was empty in the sample (0 legacy rows, 0 imported — consistent, not a
      failure, just untested with real content).
- [x] **Step 5:** `03_links.sql` — categories then links. Done against the sample: 3/3 categories,
      13/13 links.
- [ ] **Step 6:** `04_integra.sql` plus the file copy. Script written and runs without error, but
      the sample's `integra` table has 0 rows and no upload tree was provided this session
      (deliberately, to test the row-only approach first) — **unverified against real rows and
      files.**
- [ ] **Step 7:** `05_newsletters.sql` — newsletters, then `users_newsletters` filtered on
      `elkuldve = 1`. Script written and runs without error, but the sample's `hirlevel` and
      `felhasznalo_hirlevel` tables were both empty — **unverified against real rows.**
- [x] **Step 8:** `06_readers.sql` — `users_news`, `users_knowledgebase`. Done against the sample:
      1/1 each.
- [ ] **Step 9:** `AUTO_INCREMENT` resets for every imported table. Documented in the README;
      not run (no real import has happened yet to reset above).
- [ ] **Step 10:** Verification (below), then journal + tick Task 27. Row-count verification done
      for the sample (see the journal); the in-app checks below need a browser and, for the
      Integra/newsletter items, real content — neither happened this session.

**This session was a dry run against a small, no-files sample the user provided specifically to
test the approach before touching real data — not the production import.** Task 27 stays
unticked; re-run against the real dump (with the upload tree copied first) to close it out.

## Verification

Row counts, legacy vs new:

```sql
SELECT (SELECT COUNT(*) FROM zephyr_legacy.hirek)       AS legacy_news,
       (SELECT COUNT(*) FROM zephyrco_fo_honlap.news)   AS new_news;
-- …repeat per table pair
```

Then, in the running app:

- [ ] `/hirek`, `/ajanlatok`, `/tudasbazis/cikkek` render imported content as **formatted HTML**,
      not as visible tags — this is the entity-decode working (or not). Note: not every legacy row
      went through `htmlspecialchars` to begin with (a sample `hirek` row held raw, unescaped
      HTML pasted from Word) — `REPLACE()` is a no-op on text with no entities, so this check does
      not by itself prove decoding works on rows that need it; check one row that is known to be
      escaped in the source.
- [ ] an article with accented characters (á, ő, ű) is intact end to end. **Correction:** the real
      dump's tables are `utf8mb3`/`utf8mb3_hungarian_ci`, not `utf8mb4` as originally assumed
      (`SHOW CREATE TABLE` confirmed this) — irrelevant for Hungarian text either way (utf8mb3
      only loses 4-byte codepoints like emoji), but the new database is `utf8mb4_hungarian_ci`
      either way, so this check still matters.
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
      `database/migrations` (this is one-off data movement, not schema). Verified against the
      sample: same row counts after truncate + re-run.
- [ ] The legacy database was only ever read from.
- [ ] `news.main_content`/`knowledgebase.main_content`/etc. are `text` columns (65,535-byte limit),
      not `longtext` like the legacy `foszoveg`/`tovabbi`. The sample's largest row (a
      knowledgebase article) was ~57 KB — comfortably under, but close enough that a real admin
      article could exceed it; the INSERT would fail loudly (truncation error) rather than
      silently truncate, but check `MAX(LENGTH(foszoveg)), MAX(LENGTH(tovabbi))` per table against
      65535 on the real dump before running `02_content.sql` for real.
- [ ] Every migrated user's `password` hash starts with `$2y$`, not `$2a$`, after the import (see
      "Passwords" above) — `SELECT LEFT(password, 4), COUNT(*) FROM users GROUP BY 1` should show
      only `$2y$`.

## Done when

The new database holds the legacy content, every verification item above passes, the scripts and
their README are in `database/legacy-import/`, the journal records the reconciled schema and the
unconfirmed-user decision, and the work is **left uncommitted** for review.
