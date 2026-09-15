# Task 26 — Supporting: final integration sweep

**Type:** Supporting
**Depends on:** every other task
**Skills:** `superpowers:verification-before-completion`, `superpowers:requesting-code-review`

## Goal

Close the migration: prove that every legacy admin functionality has a home in the SPA, that the
whole suite is green, and that nothing about the admin area leaks to non-admins.

## 1. Coverage audit

Walk the legacy source tree and tick every page off against its replacement. Write the table into
the journal entry for this task:

| Legacy path | Replacement | Task |
|---|---|---|
| `/` (`_kezdolap`) | `/admin` | 02 |
| `/login`, `/logout` | existing SPA login/logout | — (already shipped) |
| `/jelszo` | existing SPA profile password change | — (already shipped) |
| `/ajanlatok*` | `/admin/ajanlatok*` | 07, 08 |
| `/felhasznalok*` | `/admin/felhasznalok*` | 18–21 |
| `/hirek*` | `/admin/hirek*` | 04–06 |
| `/hirlevel*` | `/admin/hirlevel*` | 22–24 |
| `/integra*` | `/admin/integra*` | 16, 17 |
| `/linkek*`, `/linkek/kategoriak*` | `/admin/linkek*` | 13–15 |
| `/tudasbazis*`, `/tudasbazis/cimkek*` | `/admin/tudasbazis*` | 9–12 |
| `src_cron/send_reminders.php` | `zephyr:send-pending-registrations-reminder` | 25 |
| `src_cron/clean_db.php` | `zephyr:prune-expired-records` | 25 |
| the legacy database's content | imported into the new schema | 27 |
| API documentation node | **out of scope** (decision D11) | — |

Anything that turns out to be missing gets its own follow-up task file (`27-…`) rather than being
squeezed in here.

Nothing was missing — the walk added three rows the table above did not list (the legacy mail
templates in `src/_emailek`, the 404 page, and the `src_check` includes), all of which already
have homes. The completed table is in the journal entry.

## 2. Navigation wiring

- [x] Every link in `resources/frontend/src/app/header/admin-nav/admin-nav.component.html`
      resolves to a real route. (Automated instead of clicked: a new `admin-nav.component.spec.ts`
      case opens every menu, collects all 15 `routerLink`s and checks each against
      `adminRoutes`. Route ordering was checked too — every literal child (`uj`, `kategoriak`,
      `cimkek`) is declared before its sibling `:id`.)
- [x] The "API dokumentáció" item is inert by design — leave it, but make sure it is not a
      dangling `routerLink` that navigates to the 404 page. (It is absent altogether, which is
      correct: in the legacy header it was an **external** `<a href="{{api-address}}"
      target="_blank">` to the Swagger UI, never an internal page, and decision D11 drops it.
      Nothing to disable.)
- [x] `resources/frontend/src/app/pages/sitemap/sitemap.component.html` must **not** list any
      admin route. (16 links, all public.)
- [x] Breadcrumbs render sensibly on every admin page (they come from the route titles).
      (`AppTitleStrategy` feeds every route `title` to `BreadcrumbService`, and all 25 admin
      routes have one; the pages that need a record's name — newsletter send, user form — set a
      richer breadcrumb themselves.)

## 3. Guard sweep

- [x] `php artisan route:list --path=api/admin` — every row shows the `admin` middleware and
      none shows `auth:sanctum`. (All 40 rows carry `EnsureUserIsAdmin`; no row carries
      `auth:sanctum`. One row additionally carries `throttle:newsletter`, as designed.)
- [x] Add (or extend) `tests/Feature/Admin/AdminGuardTest.php` with a data-driven case that walks
      **every** admin route and asserts 404 for a guest and for a non-admin. Enumerate the routes
      from the router (`Route::getRoutes()` filtered by the `api/admin` prefix) so future
      endpoints are covered automatically. (Done; its teeth were checked by temporarily adding an
      unguarded `admin/leak` route and watching it fail.)
- [x] In the SPA, one `app.component.spec.ts` case per top-level admin route asserting
      `not-found-component` for a non-admin. A `test.each` over the route list is fine. (The
      non-admin sweep is now derived from the same list as the admin one, so it covers the five
      `:id` routes it used to miss, and a guest sweep was added alongside it.)

## 4. Full verification

```bash
# backend
php artisan test --compact
vendor/bin/pint --dirty --format agent

# frontend
cd resources/frontend
npx ng test
npx ng lint
npx tsc -p tsconfig.app.json
npx prettier . --check
npx knip
npx ng build            # the production build must succeed
```

Any pre-existing failure that is not caused by this migration goes in the journal as a known
issue with its cause, rather than being quietly fixed here.

All green: 389 backend tests, 638 frontend tests, Pint clean, lint clean, Prettier clean, knip
clean, `tsc` clean, production build succeeds. The build prints one warning — the initial bundle
is 751.51 kB raw against a 500 kB warning budget — which is **pre-existing** (751.41 kB on
`24d8abe`, measured by stashing this task's changes) and not a failure: the 1 MB error budget is
met and the transfer size is 193 kB. See the journal for its cause.

## 4b. Cache invalidation review

Not in the original plan — added because the sweep is the first point at which every mutation and
every query exists, so the mutation → query invalidation matrix can finally be checked as a whole.
Six gaps were found and closed; the matrix and the reasoning are in the journal entry.

- [x] Every mutation invalidates every query whose payload it can change, checked against the
      backend resources rather than by eye.
- [x] Ending a session (logout, `deleteProfile`) empties the cache instead of invalidating a
      hand-written list of content keys.
- [x] A delete drops the deleted record's cache entries rather than invalidating them.

## 5. Manual smoke test

**Still open — this needs a browser and a real admin account, so it is the one part of this task a
human has to do.** With `composer run dev` (or `npm run dev` in `resources/frontend` plus
`php artisan serve`) and a real admin account:

- [ ] create → edit → delete one news item, one offer, one knowledgebase article (with a new tag),
      one link (with a new category), one Integra document
- [ ] rename and delete a tag and a link category — after deleting the category, check that its
      links are still on `/tudasbazis/linkek`, grouped under "Egyéb" (decision D8)
- [ ] edit a user (new password + newsletter toggle) and check the mail in the log driver
- [ ] send a newsletter to at least two recipients, watch the progress, kill one send by stopping
      the mailer and confirm the retry only targets the failed recipient
- [ ] log in as a non-admin and confirm every `/admin/...` URL renders the 404 page
      (also covered automatically now — see section 3 — but worth seeing once)
- [ ] run both scheduled commands by hand (`php artisan zephyr:prune-expired-records` deletes
      rows, so it was left for you rather than run against your database;
      `php artisan schedule:list` shows both entries at 03:00 and 06:00)
- [ ] while logged in as an admin, open a few admin pages, log out, and confirm the app does not
      show any admin data again without a fresh login (the cache is now emptied on logout)

## 6. Review

- [ ] A review pass over the accumulated diff. Left to you: running it would mean dispatching
      review subagents, which this session is not allowed to do unprompted — `/code-review ultra`
      is the equivalent you can trigger.
- [x] Fix what it turns up, re-run section 4. (Section 4 was re-run after the lint and Prettier
      fixes this task's own review pass turned up.)

## Done when

The coverage table is complete, the full backend and frontend suites are green, the production
build succeeds, the manual smoke test passed, the journal has a closing entry summarising the
migration — and, as always, the work is **left uncommitted** for the human review that ends this
project.
