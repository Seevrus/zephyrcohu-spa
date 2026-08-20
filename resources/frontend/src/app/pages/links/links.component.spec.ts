import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";

import { createGetLinksOkResponse } from "../../../mocks/links/createGetLinksOkResponse";
import getLinksErrorResponse from "../../../mocks/links/getLinksErrorResponse.json";
import { matchLinksRequest } from "../../../mocks/links/linksRequest";
import { testQueryClient } from "../../../mocks/testQueryClient";
import { LinksComponent } from "./links.component";

describe("LinksComponent", () => {
  test("renders an error message if the links cannot be loaded", async () => {
    const { httpTesting } = await renderLinks();

    const linksTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchLinksRequest()),
    );

    linksTestRequest.flush(getLinksErrorResponse, {
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("displays a message if there are no links to show", async () => {
    const { httpTesting } = await renderLinks();

    const linksTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchLinksRequest()),
    );

    linksTestRequest.flush(createGetLinksOkResponse([]));

    await expect(
      screen.findByTestId("no-links-available"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("renders the links grouped by category, in the order returned by the API", async () => {
    const { httpTesting } = await renderLinks();

    const linksTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchLinksRequest()),
    );

    linksTestRequest.flush(createGetLinksOkResponse());

    const categoryTitles = await screen.findAllByTestId("link-category-title");

    expect(categoryTitles.map((title) => title.textContent)).toStrictEqual([
      "Community",
      "Documentation",
    ]);

    const linkItems = screen.getAllByTestId("link-item");

    expect(linkItems).toHaveLength(4);
    expect(linkItems[0]).toHaveTextContent("GitHub");
    expect(linkItems[0]).toHaveAttribute("href", "https://github.com");
    expect(linkItems[0]).toHaveAttribute("target", "_blank");

    httpTesting.verify();
  });
});

async function renderLinks() {
  const renderResult = await render(LinksComponent, {
    initialRoute: "/tudasbazis/linkek",
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter([
        {
          path: "tudasbazis/linkek",
          component: LinksComponent,
          title: "Tudásbázis - Hasznos linkek",
        },
      ]),
      provideZonelessChangeDetection(),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
