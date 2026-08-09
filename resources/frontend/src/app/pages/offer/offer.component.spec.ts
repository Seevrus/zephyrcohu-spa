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

import { createGetOfferItemErrorResponse } from "../../../mocks/offers/createGetOfferItemErrorResponse";
import { createGetOfferItemOkResponse } from "../../../mocks/offers/createGetOfferItemOkResponse";
import { matchOfferItemRequest } from "../../../mocks/offers/offerItemRequest";
import { testQueryClient } from "../../../mocks/testQueryClient";
import { BreadcrumbService } from "../../services/breadcrumb.service";
import { OfferComponent } from "./offer.component";

describe("OfferComponent", () => {
  test("shows a progress bar while the offer item is loading", async () => {
    const { httpTesting } = await renderOffer();

    const offerItemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchOfferItemRequest(1)),
    );

    await expect(screen.findByRole("progressbar")).resolves.toBeInTheDocument();

    offerItemTestRequest.flush(createGetOfferItemOkResponse());

    httpTesting.verify();
  });

  test("renders an unexpected error message if the offer item cannot be loaded", async () => {
    const { httpTesting } = await renderOffer();

    const offerItemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchOfferItemRequest(1)),
    );

    offerItemTestRequest.flush(
      createGetOfferItemErrorResponse("INTERNAL_SERVER_ERROR"),
      { status: 500, statusText: "Internal Server Error" },
    );

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("renders a not found message if the offer item does not exist", async () => {
    const { httpTesting } = await renderOffer();

    const offerItemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchOfferItemRequest(1)),
    );

    offerItemTestRequest.flush(
      createGetOfferItemErrorResponse("GENERIC_NOT_FOUND"),
      { status: 404, statusText: "Not Found" },
    );

    await expect(
      screen.findByTestId("not-found-component"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("renders a registered-only message if the offer item requires authentication", async () => {
    const { httpTesting } = await renderOffer();

    const offerItemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchOfferItemRequest(1)),
    );

    offerItemTestRequest.flush(
      createGetOfferItemErrorResponse("GENERIC_UNAUTHORIZED"),
      { status: 401, statusText: "Unauthorized" },
    );

    await expect(
      screen.findByTestId("registered-only-component"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("renders the title and updated at date once loaded", async () => {
    const { httpTesting } = await renderOffer();

    const offerItemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchOfferItemRequest(1)),
    );

    offerItemTestRequest.flush(
      createGetOfferItemOkResponse({
        title: "Test title",
        updatedAt: "2026-02-08T18:23:00.000000Z",
      }),
    );

    await expect(screen.findByTestId("offer-title")).resolves.toHaveTextContent(
      "Test title",
    );

    expect(screen.getByTestId("offer-updated-at")).toHaveTextContent(
      "2026. február 8. vasárnap",
    );

    httpTesting.verify();
  });

  test("renders the main content", async () => {
    const { httpTesting } = await renderOffer();

    const offerItemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchOfferItemRequest(1)),
    );

    offerItemTestRequest.flush(
      createGetOfferItemOkResponse({ mainContent: "Some test offer" }),
    );

    await expect(
      screen.findByTestId("offer-main-content"),
    ).resolves.toHaveTextContent("Some test offer");

    httpTesting.verify();
  });

  test("renders the additional content when present", async () => {
    const { httpTesting } = await renderOffer();

    const offerItemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchOfferItemRequest(1)),
    );

    offerItemTestRequest.flush(
      createGetOfferItemOkResponse({ additionalContent: "Extra details" }),
    );

    await expect(
      screen.findByTestId("offer-additional-content"),
    ).resolves.toHaveTextContent("Extra details");

    httpTesting.verify();
  });

  test("does not render the additional content container when absent", async () => {
    const { httpTesting } = await renderOffer();

    const offerItemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchOfferItemRequest(1)),
    );

    offerItemTestRequest.flush(
      createGetOfferItemOkResponse({ additionalContent: null }),
    );

    await expect(
      screen.findByTestId("offer-main-content"),
    ).resolves.toBeInTheDocument();

    expect(
      screen.queryByTestId("offer-additional-content"),
    ).not.toBeInTheDocument();

    httpTesting.verify();
  });

  test("sets the breadcrumb and page title once the offer item loads", async () => {
    const titleSetTitleSpy = vi.spyOn(Title.prototype, "setTitle");
    const breadcrumbSetBreadcrumbSpy = vi.spyOn(
      BreadcrumbService.prototype,
      "setBreadcrumb",
    );

    const { httpTesting } = await renderOffer();

    const offerItemTestRequest = await waitFor(() =>
      httpTesting.expectOne(matchOfferItemRequest(1)),
    );

    offerItemTestRequest.flush(
      createGetOfferItemOkResponse({ title: "Test title" }),
    );

    await waitFor(() => {
      expect(titleSetTitleSpy).toHaveBeenCalledWith("Test title");
    });

    expect(breadcrumbSetBreadcrumbSpy).toHaveBeenCalledWith(
      "Ajánlatok - Test title",
    );

    titleSetTitleSpy.mockRestore();
    breadcrumbSetBreadcrumbSpy.mockRestore();

    httpTesting.verify();
  });

  test("redirects to /ajanlatok when the id route param is not a valid number", async () => {
    const navigateSpy = vi.spyOn(Router.prototype, "navigate");

    const { httpTesting } = await renderOffer("not-a-number");

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(["/ajanlatok"], {
        replaceUrl: true,
      });
    });

    navigateSpy.mockRestore();

    httpTesting.verify();
  });
});

async function renderOffer(id = "1") {
  const renderResult = await render(OfferComponent, {
    inputs: { id },
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter([{ path: "ajanlatok", children: [] }]),
      provideZonelessChangeDetection(),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
