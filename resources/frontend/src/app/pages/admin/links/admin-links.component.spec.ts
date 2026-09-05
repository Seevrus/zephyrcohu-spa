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

import { matchAdminLinksRequest } from "../../../../mocks/admin/links/adminLinksRequest";
import { createGetAdminLinksOkResponse } from "../../../../mocks/admin/links/createGetAdminLinksOkResponse";
import { matchDeleteAdminLinkRequest } from "../../../../mocks/admin/links/deleteAdminLinkRequest";
import { testQueryClient } from "../../../../mocks/testQueryClient";
import { AdminLinksComponent } from "./admin-links.component";

describe("AdminLinksComponent", () => {
  const user = userEvent.setup();

  test("shows a progress bar while loading", async () => {
    const { httpTesting } = await renderAdminLinks();

    await waitFor(() => httpTesting.expectOne(matchAdminLinksRequest()));

    await expect(screen.findByRole("progressbar")).resolves.toBeInTheDocument();
  });

  test("renders every link with its category, falling back to Egyéb for an uncategorised one", async () => {
    const { httpTesting, container } = await renderAdminLinks();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinksRequest()),
    );
    request.flush(
      createGetAdminLinksOkResponse([
        {
          id: 1,
          title: "Categorised link",
          category: { id: 1, name: "Community" },
        },
        { id: 2, title: "Uncategorised link", category: null },
      ]),
    );

    await waitFor(() => {
      expect(container.textContent).toContain("Categorised link");
    });

    expect(container.textContent).toContain("Community");
    expect(container.textContent).toContain("Uncategorised link");
    expect(container.textContent).toContain("Egyéb");

    httpTesting.verify();
  });

  test("renders the URL as a clickable external link", async () => {
    const { httpTesting } = await renderAdminLinks();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinksRequest()),
    );
    request.flush(
      createGetAdminLinksOkResponse([
        { id: 1, title: "Test link", url: "https://example.com" },
      ]),
    );

    const link = await screen.findByRole("link", {
      name: "https://example.com",
    });

    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");

    httpTesting.verify();
  });

  test("shows the empty-state sentence when the API returns []", async () => {
    const { httpTesting } = await renderAdminLinks();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinksRequest()),
    );
    request.flush(createGetAdminLinksOkResponse([]));

    await expect(
      screen.findByText("Még nincsenek linkek az oldalon."),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("shows the unexpected-error card when the request fails", async () => {
    const { httpTesting } = await renderAdminLinks();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinksRequest()),
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

  test("clicking the edit action navigates to the link form", async () => {
    const { httpTesting } = await renderAdminLinks();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinksRequest()),
    );
    request.flush(
      createGetAdminLinksOkResponse([{ id: 5, title: "Editable link" }]),
    );

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");

    await user.click(
      await screen.findByRole("button", {
        name: "Szerkesztés: Editable link",
      }),
    );

    expect(navigateSpy).toHaveBeenCalledWith(["/admin/linkek", 5]);

    httpTesting.verify();
  });

  test("clicking the delete action opens the confirm dialog and confirming fires the delete request", async () => {
    const { httpTesting } = await renderAdminLinks();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinksRequest()),
    );
    request.flush(
      createGetAdminLinksOkResponse([{ id: 7, title: "Deletable link" }]),
    );

    await user.click(
      await screen.findByRole("button", { name: "Törlés: Deletable link" }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Link törlése" }),
    ).resolves.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Törlés" }));

    const deleteRequest = await waitFor(() =>
      httpTesting.expectOne(matchDeleteAdminLinkRequest(7)),
    );
    deleteRequest.flush(null);

    httpTesting.verify();
  });

  test("shows the unexpected-error card above the grid when deleting fails", async () => {
    const { httpTesting } = await renderAdminLinks();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinksRequest()),
    );
    request.flush(
      createGetAdminLinksOkResponse([{ id: 7, title: "Deletable link" }]),
    );

    await user.click(
      await screen.findByRole("button", { name: "Törlés: Deletable link" }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Link törlése" }),
    ).resolves.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Törlés" }));

    const deleteRequest = await waitFor(() =>
      httpTesting.expectOne(matchDeleteAdminLinkRequest(7)),
    );
    deleteRequest.flush(
      { status: 500, code: "INTERNAL_SERVER_ERROR" },
      { status: 500, statusText: "Internal Server Error" },
    );

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    expect(screen.getByTestId("admin-links-component").textContent).toContain(
      "Deletable link",
    );

    httpTesting.verify();
  });

  test("cancelling the dialog fires no request", async () => {
    const { httpTesting } = await renderAdminLinks();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminLinksRequest()),
    );
    request.flush(
      createGetAdminLinksOkResponse([{ id: 7, title: "Deletable link" }]),
    );

    await user.click(
      await screen.findByRole("button", { name: "Törlés: Deletable link" }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Link törlése" }),
    ).resolves.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mégsem" }));

    httpTesting.verify();
  });
});

async function renderAdminLinks() {
  const renderResult = await render(AdminLinksComponent, {
    imports: [MatDialogModule],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter([{ path: "admin/linkek/:id", children: [] }]),
      provideZonelessChangeDetection(),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
