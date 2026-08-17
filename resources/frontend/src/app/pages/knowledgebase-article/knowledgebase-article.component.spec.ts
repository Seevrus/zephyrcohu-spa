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

import { createGetKnowledgebaseItemErrorResponse } from "../../../mocks/knowledgebase/createGetKnowledgebaseItemErrorResponse";
import { createGetKnowledgebaseItemOkResponse } from "../../../mocks/knowledgebase/createGetKnowledgebaseItemOkResponse";
import { matchKnowledgebaseItemRequest } from "../../../mocks/knowledgebase/knowledgebaseItemRequest";
import { matchMarkKnowledgebaseItemAsReadRequest } from "../../../mocks/knowledgebase/markKnowledgebaseItemAsReadRequest";
import { testQueryClient } from "../../../mocks/testQueryClient";
import { BreadcrumbService } from "../../services/breadcrumb.service";
import { KnowledgebaseArticleComponent } from "./knowledgebase-article.component";

const markAsReadLinkText =
  "Erre a hivatkozásra kattintva Ön olvasottnak jelölheti ezt a cikket.";

describe("KnowledgebaseArticleComponent", () => {
  let user: UserEvent;

  beforeAll(() => {
    user = userEvent.setup();
  });

  test("shows a progress bar while the knowledgebase item is loading", async () => {
    const { httpTesting } = await renderKnowledgebaseArticle();

    const itemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseItemRequest(1)),
    );

    await expect(screen.findByRole("progressbar")).resolves.toBeInTheDocument();

    itemTestRequest.flush(createGetKnowledgebaseItemOkResponse());

    await waitFor(() => {
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });

    httpTesting.verify();
  });

  test("renders an unexpected error message if the item cannot be loaded", async () => {
    const { httpTesting } = await renderKnowledgebaseArticle();

    const itemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseItemRequest(1)),
    );

    itemTestRequest.flush(
      createGetKnowledgebaseItemErrorResponse("INTERNAL_SERVER_ERROR"),
      { status: 500, statusText: "Internal Server Error" },
    );

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("renders a not found message if the item does not exist", async () => {
    const { httpTesting } = await renderKnowledgebaseArticle();

    const itemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseItemRequest(1)),
    );

    itemTestRequest.flush(
      createGetKnowledgebaseItemErrorResponse("GENERIC_NOT_FOUND"),
      { status: 404, statusText: "Not Found" },
    );

    await expect(
      screen.findByTestId("not-found-component"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("renders a registered-only message if the item requires authentication", async () => {
    const { httpTesting } = await renderKnowledgebaseArticle();

    const itemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseItemRequest(1)),
    );

    itemTestRequest.flush(
      createGetKnowledgebaseItemErrorResponse("GENERIC_UNAUTHORIZED"),
      { status: 401, statusText: "Unauthorized" },
    );

    await expect(
      screen.findByTestId("registered-only-component"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("renders the title and main content once loaded", async () => {
    const { httpTesting } = await renderKnowledgebaseArticle();

    const itemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseItemRequest(1)),
    );

    itemTestRequest.flush(
      createGetKnowledgebaseItemOkResponse({
        title: "Test title",
        mainContent: "Some test content",
      }),
    );

    await expect(
      screen.findByTestId("knowledgebase-article-title"),
    ).resolves.toHaveTextContent("Test title");

    expect(
      screen.getByTestId("knowledgebase-article-main-content"),
    ).toHaveTextContent("Some test content");

    httpTesting.verify();
  });

  test("shows the mark-as-read link when unread and marks it as read when clicked", async () => {
    const { httpTesting } = await renderKnowledgebaseArticle();

    const itemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseItemRequest(1)),
    );

    itemTestRequest.flush(
      createGetKnowledgebaseItemOkResponse({ isRead: false }),
    );

    const markAsReadLink = await screen.findByText(markAsReadLinkText);

    await user.click(markAsReadLink);

    const markAsReadTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchMarkKnowledgebaseItemAsReadRequest(1)),
    );

    markAsReadTestRequest.flush(null);

    const refetchTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseItemRequest(1)),
    );

    refetchTestRequest.flush(
      createGetKnowledgebaseItemOkResponse({ isRead: true }),
    );

    await waitFor(() => {
      expect(screen.queryByText(markAsReadLinkText)).not.toBeInTheDocument();
    });

    httpTesting.verify();
  });

  test("does not render a tags block when there are no tags", async () => {
    const { httpTesting } = await renderKnowledgebaseArticle();

    const itemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseItemRequest(1)),
    );

    itemTestRequest.flush(createGetKnowledgebaseItemOkResponse({ tags: [] }));

    await expect(
      screen.findByTestId("knowledgebase-article-main-content"),
    ).resolves.toBeInTheDocument();

    expect(
      screen.queryByTestId("knowledgebase-article-detail-tags"),
    ).not.toBeInTheDocument();

    httpTesting.verify();
  });

  test("renders tags as non-clickable badges", async () => {
    const { httpTesting } = await renderKnowledgebaseArticle();

    const itemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseItemRequest(1)),
    );

    itemTestRequest.flush(
      createGetKnowledgebaseItemOkResponse({
        tags: [
          { id: 1, name: "Billing" },
          { id: 2, name: "Onboarding" },
        ],
      }),
    );

    const tagsBlock = await screen.findByTestId(
      "knowledgebase-article-detail-tags",
    );

    expect(tagsBlock).toHaveTextContent("Billing");
    expect(tagsBlock).toHaveTextContent("Onboarding");
    expect(tagsBlock.querySelectorAll("a")).toHaveLength(0);

    httpTesting.verify();
  });

  test("sets the breadcrumb and page title once the item loads", async () => {
    const titleSetTitleSpy = vi.spyOn(Title.prototype, "setTitle");
    const breadcrumbSetBreadcrumbSpy = vi.spyOn(
      BreadcrumbService.prototype,
      "setBreadcrumb",
    );

    const { httpTesting } = await renderKnowledgebaseArticle();

    const itemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseItemRequest(1)),
    );

    itemTestRequest.flush(
      createGetKnowledgebaseItemOkResponse({ title: "Test title" }),
    );

    await waitFor(() => {
      expect(titleSetTitleSpy).toHaveBeenCalledWith("Test title");
    });

    expect(breadcrumbSetBreadcrumbSpy).toHaveBeenCalledWith(
      "Tudásbázis - Cikkek - Test title",
    );

    titleSetTitleSpy.mockRestore();
    breadcrumbSetBreadcrumbSpy.mockRestore();

    httpTesting.verify();
  });

  test("redirects to /tudasbazis/cikkek when the id route param is not a valid number", async () => {
    const navigateSpy = vi.spyOn(Router.prototype, "navigate");

    const { httpTesting } = await renderKnowledgebaseArticle("not-a-number");

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(["/tudasbazis/cikkek"], {
        replaceUrl: true,
      });
    });

    navigateSpy.mockRestore();

    httpTesting.verify();
  });
});

async function renderKnowledgebaseArticle(id = "1") {
  const renderResult = await render(KnowledgebaseArticleComponent, {
    inputs: { id },
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter([{ path: "tudasbazis/cikkek", children: [] }]),
      provideZonelessChangeDetection(),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
