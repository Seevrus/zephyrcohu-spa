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
