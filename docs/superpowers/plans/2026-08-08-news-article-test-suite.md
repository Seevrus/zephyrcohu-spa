# News Article Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `NewsArticleComponent` (`resources/frontend/src/app/pages/news-article`) up to the same test-coverage standard as its sibling pages, and confirm the `/hirek/:id` route is exercised at the routing level.

**Architecture:** No production code changes are expected. This plan adds the missing HTTP mock helpers for the `GET /news/:id` and `POST /news/:id/read` endpoints (following the existing `mocks/news/*` conventions), then replaces the current one-assertion `news-article.component.spec.ts` with a full suite that renders the component through `@testing-library/angular`'s `render()` (matching `news.component.spec.ts`, `login.component.spec.ts`, `profile.component.spec.ts`) and drives it via `HttpTestingController`. Routing coverage for `/hirek/:id` is verified to already exist in `app.component.spec.ts`; no new route-level test is needed there.

**Tech Stack:** Angular 22 (standalone components, signals), `@tanstack/angular-query-experimental` (TanStack Query), Vitest 4, `@testing-library/angular`, `@testing-library/user-event`, `HttpTestingController`.

## Global Constraints

- Follow `resources/frontend/angular-guideline.md`: standalone components (default), no explicit `OnPush`, signals-based state — this plan only touches specs/mocks so these mostly constrain what NOT to change.
- Follow established test conventions found in `news.component.spec.ts`, `login.component.spec.ts`, `profile.component.spec.ts`, `header.component.spec.ts`: a `renderX()` helper returning `{ ...renderResult, httpTesting }`, `HttpTestingController` for HTTP assertions, `waitFor`/`findBy*` from `@testing-library/angular`, one `httpTesting.verify()` per test.
- `testQueryClient` (`src/mocks/testQueryClient.ts`) is a shared singleton; `vitest.setup.ts` already calls `testQueryClient.clear()` in a global `afterEach`, so no manual clearing is needed in the new spec.
- Do not create documentation files beyond this plan; do not modify application dependencies.
- Run tests from `resources/frontend`: `npx ng test` (the project's `test` script; there is no way to filter to a single spec file with the `@angular/build:unit-test` builder in this project, so the full suite is the verification command throughout).

---

### Task 1: Add HTTP mock helpers for the news item and mark-as-read endpoints

**Files:**
- Create: `resources/frontend/src/mocks/news/createGetNewsItemOkResponse.ts`
- Create: `resources/frontend/src/mocks/news/newsItemRequest.ts`
- Create: `resources/frontend/src/mocks/news/markNewsItemAsReadRequest.ts`

**Interfaces:**
- Consumes: `NewsItemResponse`, `NewsResponse` from `resources/frontend/src/types/news.ts`; `environment` from `resources/frontend/src/environments/environment.ts`; `RequestMatch` from `@angular/common/http/testing`.
- Produces: `createGetNewsItemOkResponse(overrides?: Partial<NewsResponse>): NewsItemResponse`, `matchNewsItemRequest(id: number): RequestMatch`, `matchMarkNewsItemAsReadRequest(id: number): RequestMatch` — consumed by Task 2.

- [ ] **Step 1: Create the OK response factory**

`resources/frontend/src/mocks/news/createGetNewsItemOkResponse.ts`:

```ts
import { type NewsItemResponse, type NewsResponse } from "../../types/news";

export function createGetNewsItemOkResponse(
  overrides: Partial<NewsResponse> = {},
): NewsItemResponse {
  return {
    data: {
      id: 1,
      audience: "P",
      isRead: false,
      title: "Test title",
      mainContent: "Test main content",
      additionalContent: null,
      createdAt: "2026-02-08T18:25:00.000000Z",
      updatedAt: "2026-02-08T18:25:00.000000Z",
      ...overrides,
    },
  };
}
```

- [ ] **Step 2: Create the `GET /news/:id` request matcher**

`resources/frontend/src/mocks/news/newsItemRequest.ts`:

```ts
import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../environments/environment";

export function matchNewsItemRequest(id: number): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/news/${id}`,
  };
}
```

- [ ] **Step 3: Create the `POST /news/:id/read` request matcher**

`resources/frontend/src/mocks/news/markNewsItemAsReadRequest.ts`:

```ts
import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../environments/environment";

export function matchMarkNewsItemAsReadRequest(id: number): RequestMatch {
  return {
    method: "POST",
    url: `${environment.apiUrl}/news/${id}/read`,
  };
}
```

- [ ] **Step 4: Typecheck the new files**

Run: `cd resources/frontend && npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors referencing the three new files (pre-existing unrelated errors, if any, are out of scope).

- [ ] **Step 5: Commit**

```bash
git add resources/frontend/src/mocks/news/createGetNewsItemOkResponse.ts resources/frontend/src/mocks/news/newsItemRequest.ts resources/frontend/src/mocks/news/markNewsItemAsReadRequest.ts
git commit -m "test(news-article): add news item HTTP mock helpers"
```

---

### Task 2: Rewrite the News Article component test suite

**Files:**
- Modify (full rewrite): `resources/frontend/src/app/pages/news-article/news-article.component.spec.ts`

**Interfaces:**
- Consumes: `createGetNewsItemOkResponse`, `matchNewsItemRequest`, `matchMarkNewsItemAsReadRequest` (Task 1); `testQueryClient` from `../../../mocks/testQueryClient`; `BreadcrumbService` from `../../services/breadcrumb.service`; `NewsArticleComponent` (unchanged, `resources/frontend/src/app/pages/news-article/news-article.component.ts`).
- Produces: nothing consumed by later tasks — this is the terminal deliverable for the component's own coverage.

- [ ] **Step 1: Replace the spec file**

Overwrite `resources/frontend/src/app/pages/news-article/news-article.component.spec.ts` with:

```ts
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Title } from "@angular/platform-browser";
import { provideRouter, Router } from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";
import { type UserEvent, userEvent } from "@testing-library/user-event";

import { createGetNewsItemOkResponse } from "../../../mocks/news/createGetNewsItemOkResponse";
import { matchMarkNewsItemAsReadRequest } from "../../../mocks/news/markNewsItemAsReadRequest";
import { matchNewsItemRequest } from "../../../mocks/news/newsItemRequest";
import { testQueryClient } from "../../../mocks/testQueryClient";
import { BreadcrumbService } from "../../services/breadcrumb.service";
import { NewsArticleComponent } from "./news-article.component";

const markAsReadLinkText =
  "Erre a hivatkozásra kattintva Ön olvasottnak jelölheti ezt a hírt.";

describe("NewsArticleComponent", () => {
  let user: UserEvent;

  beforeAll(() => {
    user = userEvent.setup();
  });

  test("shows a progress bar while the news item is loading", async () => {
    const { httpTesting } = await renderNewsArticle();

    const newsItemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsItemRequest(1)),
    );

    await expect(screen.findByRole("progressbar")).resolves.toBeInTheDocument();

    newsItemTestRequest.flush(createGetNewsItemOkResponse());

    httpTesting.verify();
  });

  test("renders the title and updated at date once loaded", async () => {
    const { httpTesting } = await renderNewsArticle();

    const newsItemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsItemRequest(1)),
    );

    newsItemTestRequest.flush(
      createGetNewsItemOkResponse({
        title: "Test title",
        updatedAt: "2026-02-08T18:23:00.000000Z",
      }),
    );

    await expect(
      screen.findByTestId("news-article-title"),
    ).resolves.toHaveTextContent("Test title");

    expect(screen.getByTestId("news-article-updated-at")).toHaveTextContent(
      "2026. február 8. vasárnap",
    );

    httpTesting.verify();
  });

  test("renders the main content", async () => {
    const { httpTesting } = await renderNewsArticle();

    const newsItemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsItemRequest(1)),
    );

    newsItemTestRequest.flush(
      createGetNewsItemOkResponse({ mainContent: "Some test news" }),
    );

    await expect(
      screen.findByTestId("news-article-main-content"),
    ).resolves.toHaveTextContent("Some test news");

    httpTesting.verify();
  });

  test("renders the additional content when present", async () => {
    const { httpTesting } = await renderNewsArticle();

    const newsItemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsItemRequest(1)),
    );

    newsItemTestRequest.flush(
      createGetNewsItemOkResponse({ additionalContent: "Extra details" }),
    );

    await expect(
      screen.findByTestId("news-article-additional-content"),
    ).resolves.toHaveTextContent("Extra details");

    httpTesting.verify();
  });

  test("does not render the additional content container when absent", async () => {
    const { httpTesting } = await renderNewsArticle();

    const newsItemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsItemRequest(1)),
    );

    newsItemTestRequest.flush(
      createGetNewsItemOkResponse({ additionalContent: null }),
    );

    await expect(
      screen.findByTestId("news-article-main-content"),
    ).resolves.toBeInTheDocument();

    expect(
      screen.queryByTestId("news-article-additional-content"),
    ).not.toBeInTheDocument();

    httpTesting.verify();
  });

  test("shows an 'Új' chip when the news item is unread", async () => {
    const { httpTesting } = await renderNewsArticle();

    const newsItemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsItemRequest(1)),
    );

    newsItemTestRequest.flush(createGetNewsItemOkResponse({ isRead: false }));

    await expect(screen.findByText("Új")).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("does not show the chip when the news item is read", async () => {
    const { httpTesting } = await renderNewsArticle();

    const newsItemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsItemRequest(1)),
    );

    newsItemTestRequest.flush(createGetNewsItemOkResponse({ isRead: true }));

    await expect(
      screen.findByTestId("news-article-main-content"),
    ).resolves.toBeInTheDocument();

    expect(screen.queryByText("Új")).not.toBeInTheDocument();

    httpTesting.verify();
  });

  test("shows the mark-as-read link when unread", async () => {
    const { httpTesting } = await renderNewsArticle();

    const newsItemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsItemRequest(1)),
    );

    newsItemTestRequest.flush(createGetNewsItemOkResponse({ isRead: false }));

    await expect(
      screen.findByText(markAsReadLinkText),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("does not show the mark-as-read link when read", async () => {
    const { httpTesting } = await renderNewsArticle();

    const newsItemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsItemRequest(1)),
    );

    newsItemTestRequest.flush(createGetNewsItemOkResponse({ isRead: true }));

    await expect(
      screen.findByTestId("news-article-main-content"),
    ).resolves.toBeInTheDocument();

    expect(screen.queryByText(markAsReadLinkText)).not.toBeInTheDocument();

    httpTesting.verify();
  });

  test("marks the news item as read when the link is clicked", async () => {
    const { httpTesting } = await renderNewsArticle();

    const newsItemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsItemRequest(1)),
    );

    newsItemTestRequest.flush(createGetNewsItemOkResponse({ isRead: false }));

    const markAsReadLink = await screen.findByText(markAsReadLinkText);

    await user.click(markAsReadLink);

    const markAsReadTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchMarkNewsItemAsReadRequest(1)),
    );

    markAsReadTestRequest.flush(null);

    const refetchTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsItemRequest(1)),
    );

    refetchTestRequest.flush(createGetNewsItemOkResponse({ isRead: true }));

    await waitFor(() => {
      expect(screen.queryByText("Új")).not.toBeInTheDocument();
    });

    expect(screen.queryByText(markAsReadLinkText)).not.toBeInTheDocument();

    httpTesting.verify();
  });

  test("marks the news item as read via keyboard activation", async () => {
    const { httpTesting } = await renderNewsArticle();

    const newsItemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsItemRequest(1)),
    );

    newsItemTestRequest.flush(createGetNewsItemOkResponse({ isRead: false }));

    const markAsReadLink = await screen.findByText(markAsReadLinkText);

    markAsReadLink.focus();
    await user.keyboard("{Enter}");

    const markAsReadTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchMarkNewsItemAsReadRequest(1)),
    );

    markAsReadTestRequest.flush(null);

    const refetchTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsItemRequest(1)),
    );

    refetchTestRequest.flush(createGetNewsItemOkResponse({ isRead: true }));

    httpTesting.verify();
  });

  test("sets the breadcrumb and page title once the news item loads", async () => {
    const titleSetTitleSpy = vi.spyOn(Title.prototype, "setTitle");
    const breadcrumbSetBreadcrumbSpy = vi.spyOn(
      BreadcrumbService.prototype,
      "setBreadcrumb",
    );

    const { httpTesting } = await renderNewsArticle();

    const newsItemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsItemRequest(1)),
    );

    newsItemTestRequest.flush(
      createGetNewsItemOkResponse({ title: "Test title" }),
    );

    await waitFor(() => {
      expect(titleSetTitleSpy).toHaveBeenCalledWith("Test title");
    });

    expect(breadcrumbSetBreadcrumbSpy).toHaveBeenCalledWith(
      "Hírek - Test title",
    );

    titleSetTitleSpy.mockRestore();
    breadcrumbSetBreadcrumbSpy.mockRestore();

    httpTesting.verify();
  });

  test("redirects to /hirek when the id route param is not a valid number", async () => {
    const navigateSpy = vi.spyOn(Router.prototype, "navigate");

    await render(NewsArticleComponent, {
      inputs: { id: "not-a-number" },
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(testQueryClient),
        provideRouter([{ path: "hirek", children: [] }]),
        provideZonelessChangeDetection(),
      ],
    });

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(["/hirek"], {
        replaceUrl: true,
      });
    });

    navigateSpy.mockRestore();
  });
});

async function renderNewsArticle(id = "1") {
  const renderResult = await render(NewsArticleComponent, {
    inputs: { id },
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter([{ path: "hirek", children: [] }]),
      provideZonelessChangeDetection(),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
```

- [ ] **Step 2: Run the full test suite**

Run: `cd resources/frontend && npx ng test`
Expected: all tests pass, including every `NewsArticleComponent` test listed above. If `httpTesting.verify()` fails anywhere, it means a request was expected but not made (or vice versa) — check the corresponding `waitFor`/`flush` pairing before changing production code.

- [ ] **Step 3: Lint and format the new spec**

Run: `cd resources/frontend && npx eslint src/app/pages/news-article/news-article.component.spec.ts src/mocks/news/createGetNewsItemOkResponse.ts src/mocks/news/newsItemRequest.ts src/mocks/news/markNewsItemAsReadRequest.ts && npx prettier --check src/app/pages/news-article/news-article.component.spec.ts src/mocks/news/createGetNewsItemOkResponse.ts src/mocks/news/newsItemRequest.ts src/mocks/news/markNewsItemAsReadRequest.ts`
Expected: no lint errors, no formatting diffs. If prettier reports a diff, run `npx prettier --write` on the same file list and re-check.

- [ ] **Step 4: Commit**

```bash
git add resources/frontend/src/app/pages/news-article/news-article.component.spec.ts
git commit -m "test(news-article): cover loading, content, mark-as-read and invalid id redirect"
```

---

### Task 3: Confirm `/hirek/:id` routing is covered at the routes level

**Files:**
- Read only: `resources/frontend/src/app/app.component.spec.ts`
- Read only: `resources/frontend/src/app/app.routes.ts`

**Interfaces:**
- Consumes: nothing new — this task verifies existing coverage rather than adding code.
- Produces: nothing consumed by later tasks.

`app.component.spec.ts` already renders the whole `routes` array (imported from `app.routes.ts`) through `provideRouter(routes, withComponentInputBinding())` and asserts, at `resources/frontend/src/app/app.component.spec.ts:122-129`:

```ts
test("News Article Component is rendered on /hirek/:id route", async () => {
  const { renderResult } = renderAppComponent("/hirek/6");
  await renderResult;

  await expect(
    screen.findByTestId("news-article"),
  ).resolves.toBeInTheDocument();
});
```

This proves the `hirek/:id` route entry in `app.routes.ts` correctly lazy-loads `NewsArticleComponent` and binds the `id` route param. No route is currently untested for this feature, so **no new test is required** — this task is a verification checkpoint, not a code change.

- [ ] **Step 1: Re-confirm the existing route test still passes**

Run: `cd resources/frontend && npx ng test`
Expected: the `App Component > News Article Component is rendered on /hirek/:id route` test (already run as part of Task 2's full-suite run) passes.

- [ ] **Step 2: No commit needed**

This task makes no file changes. If Step 1 had failed, that would indicate a regression in `app.routes.ts` or `app.component.ts` outside the scope of this plan — stop and report it rather than editing routing code speculatively.

---

## Self-Review

**Spec coverage:**
- Loading state (progress bar) — Task 2, test 1.
- Title + formatted updated-at date — Task 2, test 2.
- Main content rendering (sanitized HTML) — Task 2, test 3.
- Additional content shown/hidden — Task 2, tests 4–5.
- "Új" chip shown/hidden based on `isRead` — Task 2, tests 6–7.
- Mark-as-read link shown/hidden based on `isRead` — Task 2, tests 8–9.
- Mark-as-read mutation via click, including the invalidate-triggered refetch and resulting UI update — Task 2, test 10.
- Mark-as-read mutation via keyboard (`(keydown)` handler) — Task 2, test 11.
- Breadcrumb + page title side effect — Task 2, test 12.
- Invalid `id` redirect effect — Task 2, test 13.
- Routing coverage for `/hirek/:id` — Task 3 (confirmed pre-existing, no gap found).

**Placeholder scan:** No "TBD"/"handle edge cases"/"similar to Task N" placeholders — every step has literal file content or a runnable command.

**Type consistency:** `createGetNewsItemOkResponse(overrides?: Partial<NewsResponse>): NewsItemResponse`, `matchNewsItemRequest(id: number): RequestMatch`, and `matchMarkNewsItemAsReadRequest(id: number): RequestMatch` (Task 1) are imported and used with matching names and signatures throughout Task 2's spec file.