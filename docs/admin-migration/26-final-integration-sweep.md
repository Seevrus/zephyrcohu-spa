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

## 2. Navigation wiring

- [ ] Every link in `resources/frontend/src/app/header/admin-nav/admin-nav.component.html`
      resolves to a real route. Click through all of them manually with an admin session.
- [ ] The "API dokumentáció" item is inert by design — leave it, but make sure it is not a
      dangling `routerLink` that navigates to the 404 page. If it is, render it as disabled text
      and update `admin-nav.component.spec.ts`.
- [ ] `resources/frontend/src/app/pages/sitemap/sitemap.component.html` must **not** list any
      admin route.
- [ ] Breadcrumbs render sensibly on every admin page (they come from the route titles).

## 3. Guard sweep

- [ ] `php artisan route:list --path=api/admin` — every row shows the `admin` middleware and
      none shows `auth:sanctum`.
- [ ] Add (or extend) `tests/Feature/Admin/AdminGuardTest.php` with a data-driven case that walks
      **every** admin route and asserts 404 for a guest and for a non-admin. Enumerate the routes
      from the router (`Route::getRoutes()` filtered by the `api/admin` prefix) so future
      endpoints are covered automatically.
- [ ] In the SPA, one `app.component.spec.ts` case per top-level admin route asserting
      `not-found-component` for a non-admin. A `test.each` over the route list is fine.

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

## 5. Manual smoke test

With `composer run dev` (or `npm run dev` in `resources/frontend` plus `php artisan serve`) and a
real admin account:

- [ ] create → edit → delete one news item, one offer, one knowledgebase article (with a new tag),
      one link (with a new category), one Integra document
- [ ] rename and delete a tag and a link category — after deleting the category, check that its
      links are still on `/tudasbazis/linkek`, grouped under "Egyéb" (decision D8)
- [ ] edit a user (new password + newsletter toggle) and check the mail in the log driver
- [ ] send a newsletter to at least two recipients, watch the progress, kill one send by stopping
      the mailer and confirm the retry only targets the failed recipient
- [ ] log in as a non-admin and confirm every `/admin/...` URL renders the 404 page
- [ ] run both scheduled commands by hand

## 6. Review

- [ ] Use `superpowers:requesting-code-review` for a review pass over the accumulated diff.
- [ ] Fix what it turns up, re-run section 4.

## Done when

The coverage table is complete, the full backend and frontend suites are green, the production
build succeeds, the manual smoke test passed, the journal has a closing entry summarising the
migration — and, as always, the work is **left uncommitted** for the human review that ends this
project.
