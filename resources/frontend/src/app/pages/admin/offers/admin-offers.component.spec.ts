import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { MatDialogModule } from "@angular/material/dialog";
import { provideRouter, Router } from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";
import { userEvent } from "@testing-library/user-event";

import { matchAdminOffersRequest } from "../../../../mocks/admin/offers/adminOffersRequest";
import { createGetAdminOffersOkResponse } from "../../../../mocks/admin/offers/createGetAdminOffersOkResponse";
import { matchDeleteAdminOfferRequest } from "../../../../mocks/admin/offers/deleteAdminOfferRequest";
import { testQueryClient } from "../../../../mocks/testQueryClient";
import { AdminOffersComponent } from "./admin-offers.component";

describe("AdminOffersComponent", () => {
  test("shows a progress bar while loading", async () => {
    const { httpTesting } = await renderAdminOffers();

    await waitFor(() => httpTesting.expectOne(matchAdminOffersRequest()));

    await expect(screen.findByRole("progressbar")).resolves.toBeInTheDocument();
  });

  test("renders every offer, including an unpublished one", async () => {
    const { httpTesting, container } = await renderAdminOffers();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminOffersRequest()),
    );
    request.flush(
      createGetAdminOffersOkResponse([
        { id: 1, title: "Published offer" },
        {
          id: 2,
          title: "Unpublished offer",
          publishedAt: "2099-01-01T00:00:00.000000Z",
        },
      ]),
    );

    await waitFor(() => {
      expect(container.textContent).toContain("Published offer");
    });

    expect(container.textContent).toContain("Unpublished offer");

    httpTesting.verify();
  });

  test("shows the empty-state sentence when the API returns []", async () => {
    const { httpTesting } = await renderAdminOffers();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminOffersRequest()),
    );
    request.flush(createGetAdminOffersOkResponse([]));

    await expect(
      screen.findByText("Még nincsenek ajánlatok az oldalon."),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("shows the unexpected-error card when the request fails", async () => {
    const { httpTesting } = await renderAdminOffers();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminOffersRequest()),
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

  test("clicking the edit action navigates to the offer form", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminOffers();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminOffersRequest()),
    );
    request.flush(
      createGetAdminOffersOkResponse([{ id: 5, title: "Editable offer" }]),
    );

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");

    await user.click(
      await screen.findByRole("button", {
        name: "Szerkesztés: Editable offer",
      }),
    );

    expect(navigateSpy).toHaveBeenCalledWith(["/admin/ajanlatok", 5]);

    httpTesting.verify();
  });

  test("clicking the delete action opens the confirm dialog and confirming fires the delete request", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminOffers();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminOffersRequest()),
    );
    request.flush(
      createGetAdminOffersOkResponse([{ id: 7, title: "Deletable offer" }]),
    );

    await user.click(
      await screen.findByRole("button", { name: "Törlés: Deletable offer" }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Ajánlat törlése" }),
    ).resolves.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Törlés" }));

    const deleteRequest = await waitFor(() =>
      httpTesting.expectOne(matchDeleteAdminOfferRequest(7)),
    );
    deleteRequest.flush(null);

    httpTesting.verify();
  });

  test("shows the unexpected-error card above the grid when deleting fails", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminOffers();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminOffersRequest()),
    );
    request.flush(
      createGetAdminOffersOkResponse([{ id: 7, title: "Deletable offer" }]),
    );

    await user.click(
      await screen.findByRole("button", { name: "Törlés: Deletable offer" }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Ajánlat törlése" }),
    ).resolves.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Törlés" }));

    const deleteRequest = await waitFor(() =>
      httpTesting.expectOne(matchDeleteAdminOfferRequest(7)),
    );
    deleteRequest.flush(
      { status: 500, code: "INTERNAL_SERVER_ERROR" },
      { status: 500, statusText: "Internal Server Error" },
    );

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    expect(screen.getByTestId("admin-offers-component").textContent).toContain(
      "Deletable offer",
    );

    httpTesting.verify();
  });

  test("cancelling the dialog fires no request", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminOffers();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminOffersRequest()),
    );
    request.flush(
      createGetAdminOffersOkResponse([{ id: 7, title: "Deletable offer" }]),
    );

    await user.click(
      await screen.findByRole("button", { name: "Törlés: Deletable offer" }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Ajánlat törlése" }),
    ).resolves.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mégsem" }));

    httpTesting.verify();
  });

  test("filters the grid by title, case-insensitively, as the user types", async () => {
    const user = userEvent.setup();
    const { httpTesting, container } = await renderAdminOffers();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminOffersRequest()),
    );
    request.flush(
      createGetAdminOffersOkResponse([
        { id: 1, title: "Karbantartási szünet" },
        { id: 2, title: "Új ajánlat érkezett" },
      ]),
    );

    await waitFor(() => {
      expect(container.textContent).toContain("Karbantartási szünet");
    });

    await user.type(screen.getByLabelText("Keresés cím szerint"), "ÚJ AJÁNLAT");

    await waitFor(() => {
      expect(container.textContent).not.toContain("Karbantartási szünet");
    });

    expect(container.textContent).toContain("Új ajánlat érkezett");

    httpTesting.verify();
  });

  test("debounces the filter instead of re-filtering on every keystroke", async () => {
    const user = userEvent.setup();
    const { httpTesting, container } = await renderAdminOffers();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminOffersRequest()),
    );
    request.flush(
      createGetAdminOffersOkResponse([
        { id: 1, title: "Karbantartási szünet" },
        { id: 2, title: "Új ajánlat érkezett" },
      ]),
    );

    await waitFor(() => {
      expect(container.textContent).toContain("Karbantartási szünet");
    });

    await user.type(screen.getByLabelText("Keresés cím szerint"), "Új");

    expect(container.textContent).toContain("Karbantartási szünet");

    await waitFor(() => {
      expect(container.textContent).not.toContain("Karbantartási szünet");
    });

    httpTesting.verify();
  });
});

async function renderAdminOffers() {
  const renderResult = await render(AdminOffersComponent, {
    imports: [MatDialogModule],
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
