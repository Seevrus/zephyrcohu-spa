import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  provideRouter,
  Router,
  withComponentInputBinding,
} from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor, within } from "@testing-library/angular";
import { type UserEvent, userEvent } from "@testing-library/user-event";

import { createGetOffersOkResponse } from "../../../mocks/offers/createGetOffersOkResponse";
import getOffersErrorResponse from "../../../mocks/offers/getOffersErrorResponse.json";
import { matchOffersRequest } from "../../../mocks/offers/offersRequest";
import { testQueryClient } from "../../../mocks/testQueryClient";
import { OffersComponent } from "./offers.component";

describe("OffersComponent", () => {
  let user: UserEvent;

  beforeAll(() => {
    user = userEvent.setup();
  });

  test("renders an error message if the offers cannot be loaded", async () => {
    const { httpTesting } = await renderOffers();

    const offersTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchOffersRequest(1)),
    );

    offersTestRequest.flush(getOffersErrorResponse, {
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("displays no offers available if, well, no offers are available", async () => {
    const { httpTesting } = await renderOffers();

    const offersTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchOffersRequest(1)),
    );

    offersTestRequest.flush(
      createGetOffersOkResponse({ isLoggedIn: false, total: 0 }),
    );

    await expect(
      screen.findByTestId("no-offers-available"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("displays no public offers available if there are only offers for registered users", async () => {
    const { httpTesting } = await renderOffers();

    const offersTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchOffersRequest(1)),
    );

    offersTestRequest.flush(
      createGetOffersOkResponse({
        isLoggedIn: false,
        numberOfOffers: 0,
      }),
    );

    await expect(
      screen.findByTestId("no-public-offers-available"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("displays a notice for additional offers if there are more offers for registered users", async () => {
    const { httpTesting } = await renderOffers();

    const offersTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchOffersRequest(1)),
    );

    offersTestRequest.flush(
      createGetOffersOkResponse({
        isLoggedIn: false,
        total: 100,
      }),
    );

    await expect(
      screen.findByTestId("additional-offers-available"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("does not display notice for additional offers on the second page", async () => {
    const { httpTesting } = await renderOffers(2);

    const offersTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchOffersRequest(2)),
    );

    offersTestRequest.flush(
      createGetOffersOkResponse({
        isLoggedIn: false,
        page: 2,
        total: 100,
      }),
    );

    await expect(
      screen.findAllByTestId("offer-article-list-item"),
    ).resolves.toHaveLength(2);

    expect(
      screen.queryByTestId("additional-offers-available"),
    ).not.toBeInTheDocument();

    httpTesting.verify();
  });

  test("displays a progress bar if the offers are fetching", async () => {
    const { httpTesting } = await renderOffers();

    const offersTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchOffersRequest(1)),
    );

    await expect(screen.findByRole("progressbar")).resolves.toBeInTheDocument();

    offersTestRequest.flush(
      createGetOffersOkResponse({ isLoggedIn: false, total: 0 }),
    );

    httpTesting.verify();
  });

  test("displays the correct number of offers", async () => {
    const { httpTesting } = await renderOffers();

    const offersTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchOffersRequest(1)),
    );

    offersTestRequest.flush(
      createGetOffersOkResponse({
        isLoggedIn: false,
      }),
    );

    await expect(
      screen.findAllByTestId("offer-article-list-item"),
    ).resolves.toHaveLength(10);

    httpTesting.verify();
  });

  test("displays offers for registered users", async () => {
    const { httpTesting } = await renderOffers();

    const offersTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchOffersRequest(1)),
    );

    offersTestRequest.flush(
      createGetOffersOkResponse({
        isLoggedIn: true,
      }),
    );

    await expect(
      screen.findAllByTestId("offer-article-list-item"),
    ).resolves.toHaveLength(10);

    expect(
      screen.queryByTestId("additional-offers-available"),
    ).not.toBeInTheDocument();

    expect(screen.getByText("Offer 3")).toBeInTheDocument();

    httpTesting.verify();
  });

  test("pagination works correctly", async () => {
    const { container, httpTesting, rerender, router } = await renderOffers();

    const offersTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchOffersRequest(1)),
    );

    offersTestRequest.flush(
      createGetOffersOkResponse({
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
    await waitFor(() => expect(router.url).toBe("/ajanlatok?oldal=2"));

    // Simulate the route -> component input binding that
    // withComponentInputBinding() performs in the real router outlet,
    // which this render setup does not exercise on its own.
    await rerender({ inputs: { oldal: "2" } });

    await waitFor(() => httpTesting.expectOne(matchOffersRequest(2)));

    httpTesting.verify();
  });
});

async function renderOffers(page = 1) {
  const renderResult = await render(OffersComponent, {
    initialRoute: `/ajanlatok?oldal=${page}`,
    inputs: { oldal: page.toString() },
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter(
        [
          {
            path: "ajanlatok",
            component: OffersComponent,
            title: "Ajánlatok",
          },
        ],
        withComponentInputBinding(),
      ),
      provideZonelessChangeDetection(),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);
  const router = TestBed.inject(Router);

  return {
    ...renderResult,
    httpTesting,
    router,
  };
}
