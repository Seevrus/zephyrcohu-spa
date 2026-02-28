import { provideHttpClient, withFetch } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor, within } from "@testing-library/angular";
import { type UserEvent, userEvent } from "@testing-library/user-event";

import { createGetNewsOkResponse } from "../../../mocks/news/createGetNewsOkResponse";
import getNewsErrorResponse from "../../../mocks/news/getNewsErrorResponse.json";
import { matchNewsRequest } from "../../../mocks/news/newsRequest";
import { testQueryClient } from "../../../mocks/testQueryClient";
import { NewsComponent } from "./news.component";

describe("NewsComponent", () => {
  let user: UserEvent;

  beforeAll(() => {
    user = userEvent.setup();
  });

  test("renders an error message if the news cannot be loaded", async () => {
    const { httpTesting } = await renderNews();

    const newsTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsRequest(1)),
    );

    newsTestRequest.flush(getNewsErrorResponse, {
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("displays no news available if, well, no news are available", async () => {
    const { httpTesting } = await renderNews();

    const newsTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsRequest(1)),
    );

    newsTestRequest.flush(
      createGetNewsOkResponse({ isLoggedIn: false, total: 0 }),
    );

    await expect(
      screen.findByTestId("no-news-available"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("displays no public news available of there are only news for registered users", async () => {
    const { httpTesting } = await renderNews();

    const newsTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsRequest(1)),
    );

    newsTestRequest.flush(
      createGetNewsOkResponse({
        isLoggedIn: false,
        numberOfNews: 0,
      }),
    );

    await expect(
      screen.findByTestId("no-public-news-available"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("displays a notice for additional news if there are more news for registered users", async () => {
    const { httpTesting } = await renderNews();

    const newsTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsRequest(1)),
    );

    newsTestRequest.flush(
      createGetNewsOkResponse({
        isLoggedIn: false,
        total: 100,
      }),
    );

    await expect(
      screen.findByTestId("additional-news-available"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("does not display notice for additional news on the second page", async () => {
    const { httpTesting } = await renderNews(2);

    const newsTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsRequest(2)),
    );

    newsTestRequest.flush(
      createGetNewsOkResponse({
        isLoggedIn: false,
        page: 2,
        total: 100,
      }),
    );

    await expect(
      screen.findAllByTestId("news-article-expandable"),
    ).resolves.toHaveLength(2);

    expect(
      screen.queryByTestId("additional-news-available"),
    ).not.toBeInTheDocument();

    httpTesting.verify();
  });

  test("displays a progress bar if the news are fetching", async () => {
    const { httpTesting } = await renderNews();

    const newsTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsRequest(1)),
    );

    await expect(screen.findByRole("progressbar")).resolves.toBeInTheDocument();

    newsTestRequest.flush(
      createGetNewsOkResponse({ isLoggedIn: false, total: 0 }),
    );

    httpTesting.verify();
  });

  test("displays the correct number of news", async () => {
    const { httpTesting } = await renderNews();

    const newsTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsRequest(1)),
    );

    newsTestRequest.flush(
      createGetNewsOkResponse({
        isLoggedIn: false,
      }),
    );

    await expect(
      screen.findAllByTestId("news-article-expandable"),
    ).resolves.toHaveLength(10);

    httpTesting.verify();
  });

  test("displays news for registered users", async () => {
    const { httpTesting } = await renderNews();

    const newsTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsRequest(1)),
    );

    newsTestRequest.flush(
      createGetNewsOkResponse({
        isLoggedIn: true,
      }),
    );

    await expect(
      screen.findAllByTestId("news-article-expandable"),
    ).resolves.toHaveLength(10);

    expect(
      screen.queryByTestId("additional-news-available"),
    ).not.toBeInTheDocument();

    expect(screen.getByText("News 3")).toBeInTheDocument();

    httpTesting.verify();
  });

  test("pagination works correctly", async () => {
    const { container, httpTesting } = await renderNews();

    const newsTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchNewsRequest(1)),
    );

    newsTestRequest.flush(
      createGetNewsOkResponse({
        isLoggedIn: false,
      }),
    );

    const paginator = container.querySelector<HTMLElement>("app-paginator-hu")!;

    await waitFor(() => {
      expect(within(paginator).getByRole("status")).toHaveTextContent(
        "1 / 2 oldal",
      );
    });

    const nextButton = container.querySelector(
      'button[aria-label="Következő"]',
    )!;

    await user.click(nextButton);

    await waitFor(() => httpTesting.expectOne(matchNewsRequest(2)));

    httpTesting.verify();
  });
});

async function renderNews(page = 1) {
  const renderResult = await render(NewsComponent, {
    initialRoute: `/hirek?oldal=${page}`,
    providers: [
      provideHttpClient(withFetch()),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter([
        {
          path: "hirek",
          component: NewsComponent,
          title: "Hírek",
        },
      ]),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
