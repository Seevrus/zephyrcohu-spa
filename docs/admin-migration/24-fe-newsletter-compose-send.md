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

- Create: `resources/frontend/src/app/pages/admin/newsletter-compose/admin-newsletter-compose.component.*`
  (+ spec)
- Modify: `resources/frontend/src/app/admin.routes.ts`, `app.component.spec.ts`
- Modify (only if Task 23's resume affordance needs it):
  `resources/frontend/src/app/pages/admin/newsletter-view/…`

## Design

### Two phases on one screen

**Phase 1 — compose.** Signal form:

| Label | Control | Validation |
|---|---|---|
| Tárgy | `matInput` | required, max 255 |
| Hírlevél szövege | `app-rich-text-editor` | required |

Button "Elküldés". On submit: `POST /admin/newsletters` → the response's `id` becomes the active
newsletter and the screen switches to phase 2. The compose form becomes read-only (do not unmount
it — the admin should still see what is going out).

**Resuming.** If the screen is entered with an existing newsletter id (router state from the view
page — keep it consistent with what Task 23 built), skip phase 1: load the newsletter with
`getAdminNewsletter(id)`, show it read-only, and go straight to phase 2.

**Phase 2 — sending loop.**

```
recipients = await GET /admin/newsletters/{id}/recipients
total      = recipients.length
for (const recipient of recipients) {          // strictly sequential
  if (aborted) break;
  try {
    await POST /admin/newsletters/{id}/recipients/{recipient.id}
    results.push({ email, status: "ok" });
    sent += 1;
  } catch (error) {
    if (error.status === 429) {                // throttled: wait and retry the same recipient
      await delay(retryAfterMs(error) ?? 60_000);
      continue;                                // no result recorded, no sent++
    }
    results.push({ email, status: "error" });  // stays pending server-side, retryable
    sent += 1;
  }
  await delay(1_000);                          // pacing, see below
}
```

Rules:

- **sequential** — never fire two sends at once (the mailer is a shared SMTP account)
- **paced at ~1s per send** (decision D13). Two independent reasons: the legacy PHP did
  `sleep(1)` between sends to keep the shared SMTP account happy, and the backend's
  `throttle:newsletter` limiter allows 120/min — 1s pacing sits comfortably under it. Put the
  delay in one named helper so the spec can stub it (`vi.useFakeTimers()`), otherwise a
  10-recipient test takes 10 real seconds.
- **429 is not a failure.** A throttled send means the recipient was *not* mailed, so it must not
  be recorded as failed or counted as sent — wait out the `Retry-After` header (fall back to
  60s when it is absent) and retry the same recipient. Cap the consecutive 429 retries per
  recipient (3 is plenty) so a misconfigured limiter cannot spin forever; after that, record it
  as a failure and move on.
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

State lives in component signals: `newsletterId`, `recipients`, `results`, `sentCount`,
`aborted`, `isSending`. Derive `progressPercent` with `computed()`.

Route: `{ path: "hirlevel/uj", …, title: "Admin - Új hírlevél" }` — before `hirlevel/:id`.

After a completed run, invalidate `queryKeys.adminNewsletters` so the list page shows the new
counters.

## Steps

- [ ] **Step 1:** Spec first — the loop cases below are the heart of this task. Drive them with
      `HttpTestingController`: expect the POST for recipient 1, flush it, then expect the POST
      for recipient 2, and so on. Assert that request *k+1* is not issued before request *k* is
      flushed (that is what "sequential" means in a spec).
- [ ] **Step 2:** Implement phase 1 (create) until its cases pass.
- [ ] **Step 3:** Implement phase 2 (loop, progress, results, abort, retry).
- [ ] **Step 4:** Implement the resume entry point and make sure it matches Task 23's affordance.
- [ ] **Step 5:** Route + `app.component.spec.ts` case for `/admin/hirlevel/uj`.
- [ ] **Step 6:** Verify, self review, journal, tick Task 24.

## Tests to write

`admin-newsletter-compose.component.spec.ts`:

- submit is blocked until subject and body are filled
- submitting fires `POST /admin/newsletters` and then `GET /admin/newsletters/1/recipients`
- with three recipients, the component fires exactly three sends **one at a time**, in list order
- progress text and the aria-label update after each send
- a 429 response retries the **same** recipient after the wait, and that recipient ends up
  counted once, as a success, not as a failure (use `vi.useFakeTimers()` and flush the delay)
- a recipient that 429s repeatedly is recorded as a failure after the retry cap, and the loop
  moves on
- aborting during a pacing delay stops the run without waiting the delay out
- a failing send (500) is recorded as a failure and the loop continues with the next recipient
- when every send finished, the summary shows the sent/total counts
- with at least one failure, the retry button re-fetches the recipients and runs again
- the abort button stops the loop: no further POST is issued after the in-flight one resolves
- resuming with an existing newsletter id skips the create request and fetches recipients
  immediately
- an empty recipients list finishes immediately with "A hírlevél minden címzettnek kiküldésre
  került."

## Verification

```bash
cd resources/frontend
npx ng test && npx ng lint && npx tsc -p tsconfig.app.json && npx prettier . --check && npx knip
```

## Self review

- [ ] Sends are strictly sequential, paced, and the spec proves both.
- [ ] A 429 never counts as a delivery **or** as a failure — it retries the same recipient.
- [ ] The pacing delay is injectable/stubbable, so the suite does not spend real seconds waiting.
- [ ] A failure never aborts the run and never marks a recipient as sent.
- [ ] The retry path relies on the server's pending list, not on FE bookkeeping — so it can never
      double-send.
- [ ] The results log is announced to screen readers and does not rely on colour alone.
- [ ] Leaving the page mid-run is discouraged in the UI and does not corrupt server state
      (it cannot — the server records each send as it happens).
- [ ] `queryKeys.adminNewsletters` is invalidated when the run ends.

## Done when

Composing and sending a newsletter works end to end against the Task 22 API, including resume and
retry, FE tooling is green, journal updated, work **left uncommitted**.
