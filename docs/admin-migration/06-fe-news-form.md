# Task 06 — FE: news create / edit form

**Type:** Frontend
**Depends on:** Task 05
**Legacy source:** `src/_hirek/hir_urlap.html`, `hir_uj.GET.php`, `hir_modosit.GET.php`
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

`/admin/hirek/uj` and `/admin/hirek/:id` — one signal-forms component that creates a news item
or edits an existing one, with two rich text areas.

This is the **pattern task** for every other admin content form (offers, knowledgebase).

## Files

- Create: `resources/frontend/src/app/pages/admin/news-form/admin-news-form.component.ts`
  (+ `.html`, `.scss`, `.spec.ts`)
- Create: `resources/frontend/src/mocks/admin/news/createAdminNewsRequest.ts` (POST + PUT matchers)
- Create: `resources/frontend/src/mocks/admin/news/createGetAdminNewsItemOkResponse.ts`
- Modify: `resources/frontend/src/app/admin.routes.ts`
- Modify: `resources/frontend/src/app/app.component.spec.ts`

## Design

### One component, two modes

Routes (order matters — `uj` before `:id`):

```ts
{ path: "hirek/uj", loadComponent: …, title: "Admin - Új hír" },
{ path: "hirek/:id", loadComponent: …, title: "Admin - Hír szerkesztése" },
```

`withComponentInputBinding()` is already enabled in `app.config.ts`, so the component takes
`readonly id = input<string>();`. `id === undefined` → create mode.

In edit mode it runs `injectQuery(() => this.adminNewsQueryService.getAdminNewsItem(numericId()))`
and initialises the form model from the response — do it with a `linkedSignal` over the query
data (or an `effect` that only writes while the form is untouched) so a refetch never clobbers
what the admin is typing. Prefer `linkedSignal`; state the choice in the journal.

### Fields (legacy parity, with decision D4 applied)

| Label | Control | Validation |
|---|---|---|
| Kiknek szól | `mat-select`: "Mindenki" (`P`), "Regisztrált felhasználók" (`A`) | required |
| Cím | `matInput` | required, max 255 |
| Közzététel dátuma | `matInput` + `MatDatepicker` | required |
| Hír fő szövege | `app-rich-text-editor` | required (non-empty after trimming tags) |
| További szöveg (lenyitható) | `app-rich-text-editor` | optional |

The legacy "Érvényes" field is gone (D4). The legacy `min` attribute on the date (today for new
items) is **not** reproduced: admins must be able to backdate. Say so in the journal.

`MatDatepicker` needs `provideNativeDateAdapter()` (or the existing app-level date providers —
check `app.config.ts` first; if none exist, add `provideNativeDateAdapter()` to the component's
`providers` and set `MAT_DATE_LOCALE` to `"hu-HU"` there, not globally).

Form skeleton, following `pages/request-quote/request-quote.component.ts`:

```ts
private readonly newsModel = signal<SaveAdminNewsRequest>({
  audience: "P",
  title: "",
  mainContent: "",
  additionalContent: null,
  publishedAt: "",
});

protected readonly newsForm = form(this.newsModel, (schemaPath) => {
  required(schemaPath.audience);
  required(schemaPath.title);
  required(schemaPath.publishedAt);
  required(schemaPath.mainContent);
});
```

Submit via `submit(this.newsForm, async () => { … })`, calling `createAdminNews` or
`updateAdminNews`, then `router.navigate(["/admin/hirek"])` on success. On failure set an
`errorMessage` signal and render `<app-form-unexpected-error />` (or a specific message for
`INVALID_REQUEST_DATA`: "A megadott adatok nem megfelelőek.").

Submit button is `<app-button-loadable type="submit" [loading]="…isPending()" [disabled]="…">`
with the legacy labels: "Beküldés" (create) / "Hír módosítása" (edit).
Add a secondary `<a mat-button routerLink="/admin/hirek">Mégsem</a>`.

### Rich text

```html
<app-rich-text-editor [field]="newsForm.mainContent" />
```

The editor's toolbar is whatever decision **D14** (taken in Task 03) left it as. If D14 landed on
option (a), do not re-add the stripped buttons here because "the admin asked for colours" —
reopen D14 instead.

**TinyMCE does not boot under jsdom.** Specs assert the presence of
`data-testid="rich-text-editor"` and set content programmatically:
`newsForm.mainContent().value.set("<p>szöveg</p>")` through a test hook — expose the form as
`protected readonly` and reach it via the rendered component instance
(`renderResult.fixture.componentInstance`), or seed the value through the GET response in edit
mode. Do **not** try to drive TinyMCE with `userEvent`.

### Dates on the wire

The API expects `publishedAt` as a date string. Convert the datepicker `Date` with
`date-fns`' `formatISO` (already a dependency) or `toISOString()`. Keep one helper —
`resources/frontend/src/mappers/dates.ts` — and add `toApiDate(date: Date): string` there with
its own unit test in `dates.spec.ts`.

## Steps

- [ ] **Step 1:** Add `toApiDate` + spec to `mappers/dates.ts`. Red → green.
- [ ] **Step 2:** Write the mocks for `POST /admin/news`, `PUT /admin/news/:id` and the item GET.
- [ ] **Step 3:** Write `admin-news-form.component.spec.ts` (cases below). Run → red.
- [ ] **Step 4:** Implement the component in create mode until those cases pass.
- [ ] **Step 5:** Implement edit mode (query + `linkedSignal` prefill + PUT) until green.
- [ ] **Step 6:** Register both routes; add `app.component.spec.ts` cases for `/admin/hirek/uj`
      and `/admin/hirek/1` (admin renders the form; non-admin gets `not-found-component`).
- [ ] **Step 7:** Verify, self review, journal, tick Task 06.

## Tests to write

`admin-news-form.component.spec.ts`:

- renders empty fields in create mode and does not fire a GET
- the submit button is disabled while the form is invalid
- submitting a valid form fires `POST /admin/news` with the exact body
  (audience, title, mainContent, additionalContent, publishedAt) and navigates to `/admin/hirek`
- a 422 response renders the invalid-data message and stays on the page
- a 500 response renders the unexpected-error card
- edit mode fires `GET /admin/news/1` and prefills title, audience and date
- edit mode submit fires `PUT /admin/news/1` and navigates back
- edit mode with a 404 GET renders the unexpected-error card (or a "nem található" message —
  pick one and assert it)

## Verification

```bash
cd resources/frontend
npx ng test
npx ng lint
npx tsc -p tsconfig.app.json
npx prettier . --check
npx knip
```

## Self review

- [ ] Every control has a `<mat-label>`; error text is inside `<mat-error>` and is announced.
- [ ] The form uses signal forms (`form()`, `submit()`), not reactive or template-driven forms.
- [ ] A refetch in edit mode cannot overwrite user input mid-typing.
- [ ] `additionalContent` is sent as `null` (not `""`) when the second editor is empty.
- [ ] Create and edit share one component without a pile of `if (isEdit)` branches in the
      template — derive labels from a `computed`.
- [ ] Navigating away after success invalidates the admin *and* public news queries (the service
      does this; confirm the spec covers it at least once).

## Done when

The form creates and edits news items, all specs and the FE tooling are green, journal updated,
work **left uncommitted**.
