# Task 24 — FE: newsletter compose + FE-governed sending

**Type:** Frontend
**Depends on:** Task 23
**Legacy source:** `src/_hirlevel/hirlevel_urlap.html`, `hirlevel.js`, `hirlevel_uj.POST.php`
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

`/admin/hirlevel/uj` — compose a newsletter and send it, one recipient per request, with live
progress and a per-recipient result list. The same screen resumes an unfinished newsletter
without re-sending anything (decision D6). This replaces the legacy PHP self-refresh loop.

## Files

- Create: `resources/frontend/src/app/pages/admin/newsletter-form/admin-newsletter-form.component.*`
  (+ spec) — compose
- Create: `resources/frontend/src/app/pages/admin/newsletter-send/admin-newsletter-send.component.*`
  (+ spec) — the sending run
- Create: `resources/frontend/src/app/services/delay.service.ts` (+ spec) — the pacing seam
- Modify: `resources/frontend/src/types/admin-newsletters.ts`, `src/types/errors.ts`,
  `src/mocks/admin/newsletters/…`
- Modify: `resources/frontend/src/app/admin.routes.ts`, `app.component.spec.ts`
- Modify: `resources/frontend/src/app/services/admin-newsletters.query.service.ts` — Task 23 shipped
  only `getAdminNewsletters()` and `getAdminNewsletter(id)`; the three methods this task drives are
  yours to add, together with their coverage:
  - `getAdminNewsletterRecipients(id)` → `GET /admin/newsletters/{id}/recipients`, **`staleTime: 0`**
    (the pending list shrinks as the run progresses)
  - `createAdminNewsletter()` → `POST /admin/newsletters`
  - `sendNewsletterToRecipient()` → `POST /admin/newsletters/{id}/recipients/{userId}`, **`retry: false`**
    so this task's loop stays in sole control of 429 handling. (The `app.config.ts` retry policy
    applies to `queries` only — TanStack mutations do not inherit it — so this is a guard against a
    future default, not a fix for current behaviour.)
  Also add the matching `mutationKeys` / `queryKeys` entries.
- Modify (only if Task 23's resume affordance needs it):
  `resources/frontend/src/app/pages/admin/newsletter-details/…`

## Design

### Two screens, not two phases (decided with the user)

This doc originally put compose and sending on one screen with a phase switch. **Superseded:** they
are two components on two routes, and sending happens in exactly one of them.

**Screen 1 — compose, `/admin/hirlevel/uj`** (`pages/admin/newsletter-form/`). Signal form:

| Label | Control | Validation |
|---|---|---|
| Tárgy | `matInput` | required, max 255 |
| Hírlevél szövege | `app-rich-text-editor` | `richTextRequiredValidator` |

Button "Elküldés" → `POST /admin/newsletters` → `router.navigate(["/admin/hirlevel", id, "kuldes"])`.
Creating a newsletter mails nobody, so this is not the irreversible step. On failure the model is
left untouched so nothing has to be retyped.

**Screen 2 — sending, `/admin/hirlevel/:id/kuldes`** (`pages/admin/newsletter-send/`). The only
place sends happen, reached identically from a fresh compose and from the details page's
"Kiküldés folytatása" link (a plain `routerLink`, decided during Task 23). Why the split:

- one sending code path instead of two entry paths into it
- the URL is always right while a run is in progress, so a reload mid-run lands back on the same
  screen and resumes against the server's pending list
- the newsletter is fetched and rendered read-only here, so the admin still sees what is going out

**Sending never auto-starts (decided with the user).** The screen loads, fetches the pending
recipients, shows "N címzett vár kiküldésre." and waits for a click on "Kiküldés indítása". A
reload, a stray deep link, or a tab the browser restored must not fire a mass mail — sending is
irreversible. When the pending list is empty it shows the completed sentence and offers no button.

### Backend contract for a failed recipient (verified before this task)

`sendToRecipient` mails exactly one recipient per request inside a `try`/`catch (Throwable)`. Any
mailer failure — SMTP down, or an address so malformed that Symfony refuses it
(`RfcComplianceException`) — is logged, returns **500**, and **leaves the pivot row uninserted**. So:

- a failure is confined to its own request; the next recipient sends normally
- the failed recipient stays in `GET /admin/newsletters/{id}/recipients`, so a resumed or retried
  run picks it up again — the retry path needs no FE bookkeeping
- covered by `SendNewsletterTest`: "an unsendable address fails only its own request and leaves the
  next recipient sendable" and "a failed recipient stays in the pending list, so a resumed run
  retries it"

**Deliberately not stateful (decided with the user):** a permanently unsendable address is *not*
recorded as bad anywhere. Consequence to accept, not to work around: such a newsletter never
reaches `sentCount >= recipientCount`, so `isSentToEveryone` stays false and the details page keeps
offering "Kiküldés folytatása" forever, re-attempting that recipient on every run. This is why the
FE loop must report per-recipient failures clearly in its results log — that list is the only place
an admin can see *which* address is the problem.

**The sending loop.**

```
recipients = the pending list, fetched before the admin pressed start
for (const recipient of recipients) {          // strictly sequential
  if (aborted) break;
  sendToRecipient(recipient)                   // records "ok" or "error", see the rules
  if (aborted) break;
  await delay(PACING_MS, abortedPromise);      // pacing, see below
}

sendToRecipient:                               // up to 1 + MAX_THROTTLE_RETRIES attempts
  try {
    await POST /admin/newsletters/{id}/recipients/{recipient.id}
    results.push({ email, status: "ok" }); return;
  } catch (error) {
    if (!isThrottled(error) || retries exhausted) {
      results.push({ email, status: "error" }); return;   // stays pending server-side
    }
    await delay(THROTTLE_WAIT_MS, abortedPromise);        // nothing recorded: nobody was mailed
    if (aborted) return;
  }
```

Rules:

- **sequential** — never fire two sends at once (the mailer is a shared SMTP account)
- **paced at ~1s per send** (decision D13). Two independent reasons: the legacy PHP did
  `sleep(1)` between sends to keep the shared SMTP account happy, and the backend's
  `throttle:newsletter` limiter allows 120/min — 1s pacing sits comfortably under it. The delay
  lives behind an injectable seam, `DelayService.wait(ms, abort?)` (`services/delay.service.ts`),
  whose own timing is covered with `vi.useFakeTimers()` in its spec; the page spec provides a stub
  that resolves at once, so the suite spends no real seconds. Fake timers were *not* used in the
  page spec: `waitFor`/`findBy*` are timer-driven and the repo has no precedent for mixing them.
- **429 is not a failure.** A throttled send means the recipient was *not* mailed, so it must not
  be recorded as failed or counted as sent — wait, then retry the same recipient, capped at 3
  consecutive retries (after which it is recorded as a failure and the loop moves on) so a
  misconfigured limiter cannot spin forever.

  **The wait is a fixed 60s, not `Retry-After` (decided with the user).** The header is
  unreachable from the SPA today, on both sides: `ErrorHandling::too_many_requests()` builds a
  fresh response and drops the `ThrottleRequestsException`'s headers (`bootstrap/app.php`), and
  `throwHttpError` keeps only `{status, code}` from the JSON body. Honouring it would take
  `->withHeaders($e->getHeaders())` in the backend plus a `ZephyrThrottledHttpError` subclass
  carrying `retryAfter` (following `ZephyrValidationHttpError`) — deliberately out of scope for a
  path that needs a second concurrent sender to be reachable at all, since 1s pacing is 60/min
  against a 120/min limiter. *Detecting* a 429 does work: the Laravel body carries `status: 429`,
  so `ZephyrHttpError.status === 429` is reliable. `GENERIC_TOO_MANY_REQUESTS` was missing from the
  FE `ApiError` union and was added.
- run it from the component, not from the service; use `await mutateAsync(...)` in a `for…of`
  loop over a plain array — no RxJS scheduling gymnastics
- a failure never aborts the run; it is recorded and the loop continues
- a "Megszakítás" button sets an `aborted` signal; the loop stops after the in-flight request,
  and it must also cut short a pacing or 429 wait rather than sitting out the full delay
- when the loop finishes: show a summary — `Kiküldve: N / M`, and when any failed,
  "Néhány címzett esetén nem sikerült a küldés. A hírlevél újra megnyitható és a küldés
  folytatható." plus an "Újrapróbálás" button that re-fetches the recipients and runs the loop
  again (it will only contain the ones still pending)
- guard against leaving mid-run: `window.confirm` is not available in this codebase's style —
  instead disable navigation affordances on the page while sending and show the warning text
  "A küldés folyamatban van, kérjük ne zárja be az oldalt."

UI:

- `mat-progress-bar mode="determinate" [value]="progressPercent()"` with an `aria-label`
  (`Kiküldés: 42 / 120`)
- a live results list (`role="log"`, `aria-live="polite"`) with one row per recipient: email plus
  a success/failure marker that is **not colour-only** (use `check` / `error` icons with text)
- keep the legacy heading "Hírlevelek küldése folyamatban..." with the percentage

State lives in component signals: `results`, `totalNumberOfRecipients`, `aborted`, `isSending`,
`hasRun`, with `numberOfProcessedRecipients` / `sentCount` / `failureCount` / `progressPercent` as
`computed()`.

Routes: `{ path: "hirlevel/uj", …, title: "Admin - Új hírlevél" }` — **before** `hirlevel/:id`,
which Task 23 already registered — and `{ path: "hirlevel/:id/kuldes", …, title: "Admin - Hírlevél kiküldése" }`
for the sending screen.

After a completed run, invalidate `queryKeys.adminNewsletters` so the list page shows the new
counters, and `queryKeys.adminNewsletterItem(id)` with **`refetchType: "none"`** — this page is that
query's own observer and does not display its counters, so a refetch here would be a request nobody
reads; marked stale is enough for the next visit. Nothing is invalidated *per send*: a run is one
request per recipient, and refetching after each would be hundreds of pointless requests.

**Trap found while building the retry path:** after `await recipientsQuery.refetch()` the query's
`data()` signal can still hold the previous list — TanStack batches observer notifications — so the
retry uses the value the refetch promise resolves with, not the signal.

## Steps

- [x] **Step 1:** Types (`AdminNewsletterRecipient`, `SaveAdminNewsletterRequest`, the recipient
      envelope, `GENERIC_TOO_MANY_REQUESTS`), keys, mocks, and the three service methods.
- [x] **Step 2:** `DelayService` + spec (the injectable pacing seam).
- [x] **Step 3:** Compose spec, then the compose screen.
- [x] **Step 4:** Sending spec — the loop cases are the heart of this task — then the sending screen.
      Drive them with `HttpTestingController`: expect the POST for recipient 1, flush it, then expect
      the POST for recipient 2, and so on, asserting with `expectNone` that request *k+1* is not
      issued before request *k* is flushed (that is what "sequential" means in a spec).
- [x] **Step 5:** Routes + `app.component.spec.ts` cases for `/admin/hirlevel/uj` and
      `/admin/hirlevel/1/kuldes`. The details page needed no change — its link already pointed here.
- [x] **Step 6:** Verify, self review, journal, tick Task 24.

## Tests to write

`admin-newsletter-form.component.spec.ts`: submit is blocked until subject and body are filled;
submitting posts the newsletter and continues to `/admin/hirlevel/9/kuldes` with the list
invalidated; 422 → the invalid-data message; 500 → the unexpected-error card with the form still
filled in; the cancel link goes back to the list.

`admin-newsletter-send.component.spec.ts`:

- the newsletter is rendered read-only, so the admin sees what is going out
- nothing is sent on load — the run waits for "Kiküldés indítása"
- with three recipients, exactly three sends fire **one at a time**, in list order
- the progress bar and its aria-label advance after each send
- a 429 retries the **same** recipient and that recipient ends up counted once, as a success
- a recipient that 429s repeatedly is recorded as a failure after the retry cap, and the loop
  moves on
- a failing send (500) is recorded as a failure and the loop continues with the next recipient
- the summary shows the sent/total counts when the run finished
- with at least one failure, the retry button re-fetches the recipients and runs again
- aborting stops the run without waiting the pacing delay out, and issues no further POST
- the mid-run warning is shown and the navigation link is withheld while sending
- an empty pending list shows "A hírlevél minden címzettnek kiküldésre került." and no start button
- an unknown newsletter shows the not-found message; a non-numeric id redirects to the list

**Spec trap worth remembering:** the summary renders on the run's final tick, so assertions on the
per-recipient rows must come *after* awaiting the summary — waiting on a row first and then reading
the summary synchronously races the loop.

## Verification

```bash
cd resources/frontend
npx ng test && npx ng lint && npx tsc -p tsconfig.app.json && npx prettier . --check && npx knip
```

## Self review

- [x] Sends are strictly sequential, paced, and the spec proves both (`expectNone` between flushes,
      and an abort test whose delay stub only resolves through the abort promise).
- [x] A 429 never counts as a delivery **or** as a failure — it retries the same recipient. Verified
      by mutation: forcing `isThrottled` to `false` fails exactly the two throttle tests.
- [x] The pacing delay is injectable/stubbable, so the suite does not spend real seconds waiting.
- [x] A failure never aborts the run and never marks a recipient as sent.
- [x] The retry path relies on the server's pending list, not on FE bookkeeping — so it can never
      double-send.
- [x] The results log is announced to screen readers (`role="log"`, `aria-live="polite"`) and pairs
      every icon with text, so it does not rely on colour alone.
- [x] Leaving the page mid-run is discouraged in the UI and does not corrupt server state
      (it cannot — the server records each send as it happens).
- [x] `queryKeys.adminNewsletters` is invalidated when the run ends.
- [x] The send mutation carries `retry: false` and the recipients query `staleTime: 0` (inherited
      from Task 23's self review — the methods themselves landed here).
- [x] The details page's "Kiküldés folytatása" link resolves to a real screen now, not the 404 page.
- [x] Sending cannot start without an explicit click, so no reload or deep link can mail anyone.

## Done when

Composing and sending a newsletter works end to end against the Task 22 API, including resume and
retry, FE tooling is green, journal updated, work **left uncommitted**.
