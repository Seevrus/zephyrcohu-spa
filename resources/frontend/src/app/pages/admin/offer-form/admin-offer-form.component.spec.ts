import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import {
  provideTanStackQuery,
  QueryClient,
} from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";
import { userEvent } from "@testing-library/user-event";

import { matchAdminOfferItemRequest } from "../../../../mocks/admin/offers/adminOffersRequest";
import { createGetAdminOfferItemOkResponse } from "../../../../mocks/admin/offers/createGetAdminOfferItemOkResponse";
import {
  matchCreateAdminOfferRequest,
  matchUpdateAdminOfferRequest,
} from "../../../../mocks/admin/offers/saveAdminOfferRequest";
import { testQueryClient } from "../../../../mocks/testQueryClient";
import { queryKeys } from "../../../services/queryKeys";
import { AdminOfferFormComponent } from "./admin-offer-form.component";

describe("AdminOfferFormComponent", () => {
  test("renders empty fields in create mode and does not fire a GET", async () => {
    const { httpTesting } = await renderAdminOfferForm();

    expect(screen.getByLabelText<HTMLInputElement>("Cím").value).toBe("");

    expect(httpTesting.match(matchAdminOfferItemRequest(1))).toHaveLength(0);

    httpTesting.verify();
  });

  test("the submit button is disabled while the form is invalid", async () => {
    await renderAdminOfferForm();

    expect(screen.getByRole("button", { name: "Beküldés" })).toBeDisabled();
  });

  test("submitting a valid form fires POST /admin/offers with the exact body and navigates back", async () => {
    const user = userEvent.setup();
    const { httpTesting, fixture } = await renderAdminOfferForm();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");

    const queryClient = TestBed.inject(QueryClient);
    queryClient.setQueryData(queryKeys.adminOffers, []);
    queryClient.setQueryData(queryKeys.offers(), []);

    await user.type(screen.getByLabelText("Cím"), "Nyári akció");

    // TinyMCE and the Material datepicker calendar don't render usable
    // controls under jsdom (see rich-text-editor.component.spec.ts) — set
    // their form values directly through the component instance instead.
    fixture.componentInstance.offerForm
      .publishedAt()
      .value.set(new Date(2026, 1, 10));
    fixture.componentInstance.offerForm
      .mainContent()
      .value.set("<p>Tartalom</p>");

    await user.click(screen.getByRole("button", { name: "Beküldés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminOfferRequest()),
    );

    expect(request.request.body).toStrictEqual({
      audience: "P",
      title: "Nyári akció",
      mainContent: "<p>Tartalom</p>",
      additionalContent: null,
      publishedAt: "2026-02-10",
    });

    request.flush(createGetAdminOfferItemOkResponse({ id: 9 }));

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(["/admin/ajanlatok"]);
    });

    expect(
      queryClient.getQueryState(queryKeys.adminOffers)?.isInvalidated,
    ).toBe(true);
    expect(queryClient.getQueryState(queryKeys.offers())?.isInvalidated).toBe(
      true,
    );

    httpTesting.verify();
  });

  test("a 422 response renders the invalid-data message and stays on the page", async () => {
    const user = userEvent.setup();
    const { httpTesting, fixture } = await renderAdminOfferForm();

    await user.type(screen.getByLabelText("Cím"), "Nyári akció");
    fixture.componentInstance.offerForm
      .publishedAt()
      .value.set(new Date(2026, 1, 10));
    fixture.componentInstance.offerForm
      .mainContent()
      .value.set("<p>Tartalom</p>");

    await user.click(screen.getByRole("button", { name: "Beküldés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminOfferRequest()),
    );
    request.flush(
      { message: "The given data was invalid.", errors: {} },
      { status: 422, statusText: "Unprocessable Content" },
    );

    await expect(
      screen.findByTestId("invalid-data-message"),
    ).resolves.toBeInTheDocument();

    expect(
      screen.getByTestId("admin-offer-form-component"),
    ).toBeInTheDocument();

    httpTesting.verify();
  });

  test("a 500 response renders the unexpected-error card", async () => {
    const user = userEvent.setup();
    const { httpTesting, fixture } = await renderAdminOfferForm();

    await user.type(screen.getByLabelText("Cím"), "Nyári akció");
    fixture.componentInstance.offerForm
      .publishedAt()
      .value.set(new Date(2026, 1, 10));
    fixture.componentInstance.offerForm
      .mainContent()
      .value.set("<p>Tartalom</p>");

    await user.click(screen.getByRole("button", { name: "Beküldés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchCreateAdminOfferRequest()),
    );
    request.flush(
      { status: 500, code: "INTERNAL_SERVER_ERROR" },
      { status: 500, statusText: "Internal Server Error" },
    );

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("edit mode fires GET /admin/offers/1 and prefills title, audience and date", async () => {
    const { httpTesting, fixture } = await renderAdminOfferForm("1");

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminOfferItemRequest(1)),
    );
    request.flush(
      createGetAdminOfferItemOkResponse({
        id: 1,
        audience: "A",
        title: "Szerkesztendő ajánlat",
        publishedAt: "2026-03-01T00:00:00.000000Z",
      }),
    );

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>("Cím").value).toBe(
        "Szerkesztendő ajánlat",
      );
    });

    await expect(
      screen.findByText("Regisztrált felhasználók"),
    ).resolves.toBeInTheDocument();

    expect(
      fixture.componentInstance.offerForm.publishedAt().value(),
    ).toStrictEqual(new Date("2026-03-01T00:00:00.000000Z"));

    httpTesting.verify();
  });

  test("edit mode submit fires PUT /admin/offers/1 and navigates back", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminOfferForm("1");

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");

    const getRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminOfferItemRequest(1)),
    );
    getRequest.flush(
      createGetAdminOfferItemOkResponse({ id: 1, title: "Régi cím" }),
    );

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>("Cím").value).toBe(
        "Régi cím",
      );
    });

    await user.click(
      screen.getByRole("button", { name: "Ajánlat módosítása" }),
    );

    const putRequest = await waitFor(() =>
      httpTesting.expectOne(matchUpdateAdminOfferRequest(1)),
    );
    putRequest.flush(createGetAdminOfferItemOkResponse({ id: 1 }));

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(["/admin/ajanlatok"]);
    });

    // The update invalidates `adminOfferItem(1)`, and this component's own
    // item query is still an active observer for that key, so it refetches.
    const refetchRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminOfferItemRequest(1)),
    );
    refetchRequest.flush(createGetAdminOfferItemOkResponse({ id: 1 }));

    httpTesting.verify();
  });

  test("edit mode with a 404 GET renders the unexpected-error card", async () => {
    const { httpTesting } = await renderAdminOfferForm("1");

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminOfferItemRequest(1)),
    );
    request.flush(
      { status: 404, code: "GENERIC_NOT_FOUND" },
      { status: 404, statusText: "Not Found" },
    );

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("a non-numeric route id redirects to the offers grid without firing a GET", async () => {
    const navigateSpy = vi.spyOn(Router.prototype, "navigate");

    const { httpTesting } = await renderAdminOfferForm("ujjjj");

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(["/admin/ajanlatok"], {
        replaceUrl: true,
      });
    });

    navigateSpy.mockRestore();

    expect(
      httpTesting.match(matchAdminOfferItemRequest(Number.NaN)),
    ).toHaveLength(0);

    httpTesting.verify();
  });
});

async function renderAdminOfferForm(id?: string) {
  const renderResult = await render(AdminOfferFormComponent, {
    inputs: { id },
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter([]),
      provideZonelessChangeDetection(),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
