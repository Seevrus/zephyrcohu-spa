# Task 03 — FE: admin UI kit (confirm dialog, grid actions, rich text field, layout)

**Type:** Frontend (supporting)
**Depends on:** Task 02
**Unblocks:** every admin screen (05, 06, 08, 10, 12, 14, 15, 17, 19, 20, 21, 23, 24)
**Skills:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`

## Goal

Build the four shared pieces every admin screen needs, once, with their own specs — so the
feature tasks stay small:

1. a wide page layout mixin,
2. a reusable confirm dialog for destructive actions (decision D5),
3. an ag-grid cell renderer with the row action icons (`edit`, `delete_forever`, `email`, `info`),
4. a rich text editor that can be bound to a signal form field.

…and, **before any of that**, run the rich-text sanitisation spike (D14) and get its answer
signed off. It decides how the editor is configured, so doing it after the fact means redoing
work.

---

## ⚠ Step 0 (blocking): the rich-text sanitisation spike — decision D14

**The problem.** Every public page renders admin HTML through Angular's sanitizer:

```ts
// pages/news-article/news-article.component.ts
this.sanitizer.sanitize(SecurityContext.HTML, mainContent)
```

Angular's HTML allow-list keeps `class`, `align`, `color`, `face` — but **strips `style`**.
TinyMCE 8 expresses colours, font sizes and text alignment as inline `style` attributes. So an
admin can format a news item, save it, and watch the formatting silently disappear on the public
site, with no error anywhere. This affects the toolbar already configured in
`components/rich-text-editor/rich-text-editor.component.ts` (`forecolor`, `backcolor`,
`fontfamily`, `fontsize`, `alignleft/center/right/justify`).

**Prove it first — no admin UI needed.** Insert a formatted row straight into the database and
look at the public page:

```bash
php artisan tinker --execute 'App\Models\News::create([
  "audience" => "P",
  "title" => "Sanitizer spike",
  "main_content" => "<p style=\"text-align: center;\"><span style=\"color: rgb(224, 62, 45); font-size: 24px;\">Színes, középre zárt</span></p><p><strong>Félkövér</strong>, <em>dőlt</em>, <a href=\"https://example.com\">link</a></p><ul><li>lista</li></ul><table><tr><td>cella</td></tr></table>",
  "additional_content" => null,
  "published_at" => now()->subDay(),
]);'
```

Then open `/hirek` and `/hirek/<id>` in the running app and record, in the journal, exactly which
of these survived: text colour, background colour, font family, font size, alignment, bold/italic,
lists, links, tables, images.

**Then choose (this is D14 in `00-overview.md` — write the answer there):**

- **(a) Trim the toolbar** to what survives, so the editor cannot produce formatting that will be
  thrown away. Cheapest, no new dependency, and the admin never sees a lie. Loses colours and
  alignment.
- **(b) DOMPurify.** Add `dompurify` as an FE dependency, sanitise the stored HTML with it and
  hand the result to `bypassSecurityTrustHtml` instead of Angular's sanitizer. Keeps the full
  editor. Costs: a new dependency (**needs explicit sign-off** — `laravel-guideline.md` forbids
  changing dependencies without approval), a change to already-shipped public components
  (news article, news list item, knowledgebase article and their specs), and it moves the XSS
  boundary onto DOMPurify's configuration. Content is admin-authored only, which makes the risk
  small but not zero.
- **(c) Accept the loss** and document it for whoever writes the content.

Whichever is chosen, update D14 in `00-overview.md` from "open" to the decision plus one line of
reasoning, and note in the journal which public components (if any) changed. **Do not tune the
TinyMCE toolbar until this is decided.**

---

## Files

- Modify: `resources/frontend/src/shared/mixins.scss` — add `zephyr-admin-main`
- Create: `resources/frontend/src/app/components/confirm-dialog/confirm-dialog.component.ts`
  (+ `.html`, `.scss`, `.spec.ts`)
- Create: `resources/frontend/src/app/components/ag-grid/admin-actions-cell-renderer/admin-actions-cell-renderer.component.ts`
  (+ `.html`, `.scss`, `.spec.ts`)
- Create: `resources/frontend/src/shared/admin-grid.ts` — shared ag-grid config for admin grids
- Modify: `resources/frontend/src/app/components/rich-text-editor/rich-text-editor.component.ts`
  (+ `.html`, and a new `.spec.ts`)
*(No page consumes the new layout mixin yet — the Task 02 landing page stays on `zephyr-main`
because Task 05 deletes it. The news grid in Task 05 is the first consumer.)*

## Design

### 1. Layout mixin

`mixins.scss` currently caps pages at `variables.$desktop-width` (`zephyr-main`). Admin screens
may grow to `variables.$widescreen`:

```scss
@mixin zephyr-admin-main {
  @include zephyr-main;

  max-width: variables.$widescreen;
}
```

### 2. `ConfirmDialogComponent`

Angular Material dialog (`MatDialog`, `MatDialogRef`, `MAT_DIALOG_DATA`), opened by the grid
pages. Data contract — put the type next to the component and export it:

```ts
export type ConfirmDialogData = {
  title: string;        // e.g. "Hír törlése"
  message: string;      // e.g. "Biztosan törölni szeretnéd a(z) „Cím” című hírt?"
  warning?: string;     // optional red note, e.g. the link-cascade warning from D8
  confirmLabel?: string; // default: "Törlés"
  cancelLabel?: string;  // default: "Mégsem"
};
```

`MatDialogRef.close(true)` on confirm, `close(false)`/backdrop on cancel. Requirements:
`mat-dialog-title` for the accessible name, the confirm button is the initially focused element
(`cdkFocusInitial`), `Escape` cancels (Material default), and the destructive button carries
`color="warn"`.

### 3. `AdminActionsCellRendererComponent`

An ag-grid cell renderer (implements `ICellRendererAngularComp`, exactly like
`components/ag-grid/integra-document-link-cell-renderer/`), rendering up to four icon buttons.
Which buttons appear is driven by the column definition's `cellRendererParams`:

```ts
export type AdminActionsParams<TRow> = {
  actions: readonly AdminRowAction[];        // order is respected
  labels?: Partial<Record<AdminRowAction, string>>; // aria-labels; sensible Hungarian defaults
  onAction: (action: AdminRowAction, row: TRow) => void;
};

export type AdminRowAction = "info" | "edit" | "email" | "delete";
```

- icons: `info` → `info`, `edit` → `edit`, `email` → `email`, `delete` → `delete_forever`
- every button is a `<button mat-icon-button [attr.aria-label]="…">` — icon-only buttons **must**
  carry an aria-label including the row's identity where available
  (e.g. `Szerkesztés: {{ title }}`), otherwise AXE fails and the specs cannot address them
- the renderer never mutates data; it calls `onAction` and lets the page decide

### 4. Rich text editor bound to signal forms

`RichTextEditorComponent` currently renders a bare TinyMCE editor with no value binding. Give it
a required `field` input and forward it to the underlying `<editor>` element, which registers
itself as an `NG_VALUE_ACCESSOR` — the signal-forms `[formField]` directive picks CVAs up:

```ts
readonly field = input.required<FieldTree<string>>();
```

```html
<div data-testid="rich-text-editor">
  <editor [formField]="field()" [init]="init" licenseKey="gpl" />
</div>
```

`FieldTree` is exported from `@angular/forms/signals`. Usage from a page:

```html
<app-rich-text-editor [field]="newsForm.mainContent" />
```

Keep the existing `init` config untouched. Add `height: 400` only if the editor collapses in the
admin layout — check visually before changing it.

> **In specs, TinyMCE does not boot under jsdom.** Do not try to type into the editor. Assert
> that `app-rich-text-editor` is rendered (`data-testid="rich-text-editor"`), and drive the
> underlying value in form specs by setting the model signal directly
> (`form.mainContent().value.set("…")`). Every form task repeats this note.

### 5. `admin-grid.ts`

Small shared module so ten grids do not each re-declare the same constants:

```ts
export const adminGridModules: Module[] = [
  ColumnAutoSizeModule,
  LocaleModule,
  PaginationModule,
  RowAutoHeightModule,
];

export const adminGridAutoSizeStrategy: AutoSizeStrategy = { type: "fitGridWidth" };

export const adminPaginationPanels: PaginationPanel[] = [
  { type: "pageSummary", suppressPageInput: true },
  "rowSummary",
  { type: "pageSize", paginationPageSize: 25 },
];

export const adminGridLocaleText = AG_GRID_LOCALE_HU;
```

(The values are lifted from `pages/integra/integra.component.ts`; import
`zephyrGridTheme` from `shared/ag-grid-theme` in the pages as that file already does.)

## Steps

- [ ] **Step 0 (blocking):** Run the D14 sanitisation spike above, record what survived, get the
      answer signed off, and write it into `00-overview.md`. Everything else in this task waits
      on it, because option (b) changes shipped public components and option (a) changes the
      editor config.
- [ ] **Step 1:** Add `zephyr-admin-main` to `mixins.scss`. Run `npx ng test` — nothing should
      break. Leave the Task 02 landing page on `zephyr-main`: Task 05 deletes it, so restyling it
      is throwaway work. The mixin's first real consumer is the news grid in Task 05.
- [ ] **Step 2:** Write `confirm-dialog.component.spec.ts` first: renders title/message/warning,
      confirm click closes with `true`, cancel click closes with `false`, the dialog has an
      accessible name. Render it with `@testing-library/angular`'s `render()` plus
      `provideNoopAnimations()` and a `MatDialogRef` stub
      (`{ provide: MatDialogRef, useValue: { close: vi.fn() } }`) and `MAT_DIALOG_DATA`.
- [ ] **Step 3:** Implement `ConfirmDialogComponent` until green.
- [ ] **Step 4:** Write `admin-actions-cell-renderer.component.spec.ts`: renders only the
      requested actions in order, each button has the expected aria-label, clicking a button
      calls `onAction` with the action and the row. Drive it by calling `agInit()` with a fake
      `ICellRendererParams` object, as the Integra renderer's own spec does.
- [ ] **Step 5:** Implement the renderer until green.
- [ ] **Step 6:** Create `shared/admin-grid.ts`.
- [ ] **Step 7:** Add the `field` input to `RichTextEditorComponent` and write
      `rich-text-editor.component.spec.ts`: rendering the component inside a tiny host with a
      `form()` model does not throw, and the testid is present. Keep it modest — jsdom cannot
      run TinyMCE.
- [ ] **Step 8:** Apply the D14 decision: trim the toolbar (a), wire DOMPurify into the public
      renderers and their specs (b), or leave everything as-is and document the loss (c). Delete
      the spike news row from the database when you are done with it.
- [ ] **Step 9:** Verify (full FE command set), self review, journal entry, tick Task 03.

## Tests to write

- `confirm-dialog.component.spec.ts` — 4 cases.
- `admin-actions-cell-renderer.component.spec.ts` — 3 cases.
- `rich-text-editor.component.spec.ts` — 1–2 smoke cases.

## Verification

```bash
cd resources/frontend
npx ng test
npx ng lint
npx tsc -p tsconfig.app.json
npx prettier . --check
npx knip     # new shared exports are unused until Task 05 — see note
```

> `knip` will flag `admin-grid.ts`, the dialog and the renderer as unused until the first grid
> page lands in Task 05. Note it in the journal rather than adding knip ignores; re-run knip at
> the end of Task 05 and make sure the warnings are gone.

## Self review

- [ ] Every icon-only button has a meaningful `aria-label`; run one spec assertion by role+name.
- [ ] The dialog traps focus, has an accessible name, and `Escape` cancels.
- [ ] `RichTextEditorComponent` keeps working for any existing usage (search the repo — at the
      time of writing it is not used anywhere yet).
- [ ] Nothing in the kit imports from a feature page (dependencies point one way).
- [ ] `zephyr-admin-main` composes `zephyr-main` instead of duplicating it.
- [ ] D14 in `00-overview.md` is no longer marked open: it records the decision, the reasoning,
      and what the spike actually observed.
- [ ] The spike's database row is gone.

## Done when

The kit is implemented with specs, D14 is decided and written down, the FE suite is green,
journal updated, work **left uncommitted**.
