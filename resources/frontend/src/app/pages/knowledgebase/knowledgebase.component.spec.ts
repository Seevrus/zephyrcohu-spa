import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter, withComponentInputBinding } from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor, within } from "@testing-library/angular";
import { type UserEvent, userEvent } from "@testing-library/user-event";

import { createGetKnowledgebaseOkResponse } from "../../../mocks/knowledgebase/createGetKnowledgebaseOkResponse";
import { createGetKnowledgebaseTagsOkResponse } from "../../../mocks/knowledgebase/createGetKnowledgebaseTagsOkResponse";
import getKnowledgebaseErrorResponse from "../../../mocks/knowledgebase/getKnowledgebaseErrorResponse.json";
import { matchKnowledgebaseRequest } from "../../../mocks/knowledgebase/knowledgebaseRequest";
import { matchKnowledgebaseTagsRequest } from "../../../mocks/knowledgebase/knowledgebaseTagsRequest";
import { testQueryClient } from "../../../mocks/testQueryClient";
import { KnowledgebaseComponent } from "./knowledgebase.component";

describe("KnowledgebaseComponent", () => {
  let user: UserEvent;

  beforeAll(() => {
    user = userEvent.setup();
  });

  test("renders an error message if the knowledgebase cannot be loaded", async () => {
    const { httpTesting } = await renderKnowledgebase();

    const knowledgebaseTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseRequest(1)),
    );

    knowledgebaseTestRequest.flush(getKnowledgebaseErrorResponse, {
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    await flushTagsRequest(httpTesting);

    httpTesting.verify();
  });

  test("displays no knowledgebase available if there is nothing to show", async () => {
    const { httpTesting } = await renderKnowledgebase();

    const knowledgebaseTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseRequest(1)),
    );

    knowledgebaseTestRequest.flush(
      createGetKnowledgebaseOkResponse({ isLoggedIn: false, total: 0 }),
    );

    await expect(
      screen.findByTestId("no-knowledgebase-available"),
    ).resolves.toBeInTheDocument();

    await flushTagsRequest(httpTesting);

    httpTesting.verify();
  });

  test("displays no public knowledgebase available if there are only articles for registered users", async () => {
    const { httpTesting } = await renderKnowledgebase();

    const knowledgebaseTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseRequest(1)),
    );

    knowledgebaseTestRequest.flush(
      createGetKnowledgebaseOkResponse({
        isLoggedIn: false,
        numberOfKnowledgebase: 0,
      }),
    );

    await expect(
      screen.findByTestId("no-public-knowledgebase-available"),
    ).resolves.toBeInTheDocument();

    await flushTagsRequest(httpTesting);

    httpTesting.verify();
  });

  test("displays a notice for additional articles if there are more for registered users", async () => {
    const { httpTesting } = await renderKnowledgebase();

    const knowledgebaseTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseRequest(1)),
    );

    knowledgebaseTestRequest.flush(
      createGetKnowledgebaseOkResponse({ isLoggedIn: false, total: 100 }),
    );

    await expect(
      screen.findByTestId("additional-knowledgebase-available"),
    ).resolves.toBeInTheDocument();

    await flushTagsRequest(httpTesting);

    httpTesting.verify();
  });

  test("displays the correct number of articles", async () => {
    const { httpTesting } = await renderKnowledgebase();

    const knowledgebaseTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseRequest(1)),
    );

    knowledgebaseTestRequest.flush(
      createGetKnowledgebaseOkResponse({ isLoggedIn: false }),
    );

    await expect(
      screen.findAllByTestId("knowledgebase-article-list-item"),
    ).resolves.toHaveLength(10);

    await flushTagsRequest(httpTesting);

    httpTesting.verify();
  });

  test("pagination works correctly", async () => {
    const { container, httpTesting } = await renderKnowledgebase();

    const knowledgebaseTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseRequest(1)),
    );

    knowledgebaseTestRequest.flush(
      createGetKnowledgebaseOkResponse({ isLoggedIn: false }),
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

    await waitFor(() => httpTesting.expectOne(matchKnowledgebaseRequest(2)));

    await flushTagsRequest(httpTesting);

    httpTesting.verify();
  });

  test("renders the tag cloud once the tags have loaded", async () => {
    const { httpTesting } = await renderKnowledgebase();

    const knowledgebaseTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseRequest(1)),
    );
    knowledgebaseTestRequest.flush(
      createGetKnowledgebaseOkResponse({ isLoggedIn: false }),
    );

    const tagsTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseTagsRequest()),
    );
    tagsTestRequest.flush(createGetKnowledgebaseTagsOkResponse());

    const items = await screen.findAllByTestId("tag-cloud-item");

    expect(items).toHaveLength(3);

    httpTesting.verify();
  });

  test("shows the active filter and clicking clear removes it", async () => {
    const { httpTesting } = await renderKnowledgebase(1, 1);

    const knowledgebaseTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseRequest(1, 1)),
    );
    knowledgebaseTestRequest.flush(
      createGetKnowledgebaseOkResponse({ isLoggedIn: false }),
    );

    const tagsTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchKnowledgebaseTagsRequest()),
    );
    tagsTestRequest.flush(createGetKnowledgebaseTagsOkResponse());

    const activeFilter = await screen.findByTestId("active-tag-filter");

    await waitFor(() => {
      expect(activeFilter).toHaveTextContent("Billing");
    });

    const clearFilterLink = screen.getByTestId("clear-tag-filter");

    expect(clearFilterLink).toHaveAttribute("href", "/tudasbazis/cikkek");

    httpTesting.verify();
  });
});

async function flushTagsRequest(httpTesting: HttpTestingController) {
  const tagsTestRequest = await waitFor(() =>
    httpTesting.expectOne(matchKnowledgebaseTagsRequest()),
  );
  tagsTestRequest.flush(createGetKnowledgebaseTagsOkResponse());
}

async function renderKnowledgebase(page = 1, tag?: number) {
  const queryParameters = new URLSearchParams();
  queryParameters.set("oldal", page.toString());
  if (tag !== undefined) {
    queryParameters.set("cimke", tag.toString());
  }

  const renderResult = await render(KnowledgebaseComponent, {
    initialRoute: `/tudasbazis/cikkek?${queryParameters.toString()}`,
    inputs: {
      oldal: page.toString(),
      cimke: tag?.toString(),
    },
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter(
        [
          {
            path: "tudasbazis/cikkek",
            component: KnowledgebaseComponent,
            title: "Tudásbázis - Cikkek",
          },
        ],
        withComponentInputBinding(),
      ),
      provideZonelessChangeDetection(),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
