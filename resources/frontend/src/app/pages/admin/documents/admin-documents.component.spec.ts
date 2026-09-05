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

import { matchAdminDocumentsRequest } from "../../../../mocks/admin/documents/adminDocumentsRequest";
import { createGetAdminDocumentsOkResponse } from "../../../../mocks/admin/documents/createGetAdminDocumentsOkResponse";
import { matchDeleteAdminDocumentRequest } from "../../../../mocks/admin/documents/deleteAdminDocumentRequest";
import { testQueryClient } from "../../../../mocks/testQueryClient";
import { AdminDocumentsComponent } from "./admin-documents.component";

describe("AdminDocumentsComponent", () => {
  const user = userEvent.setup();

  test("shows a progress bar while loading", async () => {
    const { httpTesting } = await renderAdminDocuments();

    await waitFor(() => httpTesting.expectOne(matchAdminDocumentsRequest()));

    await expect(screen.findByRole("progressbar")).resolves.toBeInTheDocument();
  });

  test("renders every document with its category label and file name", async () => {
    const { httpTesting, container } = await renderAdminDocuments();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminDocumentsRequest()),
    );
    request.flush(
      createGetAdminDocumentsOkResponse([
        {
          id: 1,
          category: "tajekoztato",
          displayName: "Tájékoztató 2026",
          fileName: "flyer-2026.pdf",
          version: "2.0",
        },
        {
          id: 2,
          category: "programfrissites",
          displayName: "Frissítés 2026.1",
          fileName: "update-2026-1.zip",
          version: "2026.1",
        },
      ]),
    );

    await waitFor(() => {
      expect(container.textContent).toContain("Tájékoztató 2026");
    });

    expect(container.textContent).toContain("Tájékoztató");
    expect(container.textContent).toContain("Programfrissítés");
    expect(container.textContent).toContain("flyer-2026.pdf");
    expect(container.textContent).toContain("update-2026-1.zip");
    expect(container.textContent).toContain("2026.1");

    httpTesting.verify();
  });

  test("shows the empty-state sentence when the API returns []", async () => {
    const { httpTesting } = await renderAdminDocuments();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminDocumentsRequest()),
    );
    request.flush(createGetAdminDocumentsOkResponse([]));

    await expect(
      screen.findByText("Még nincsenek feltöltött fájlok."),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("shows the unexpected-error card when the request fails", async () => {
    const { httpTesting } = await renderAdminDocuments();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminDocumentsRequest()),
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

  test("clicking the edit action navigates to the document form", async () => {
    const { httpTesting } = await renderAdminDocuments();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminDocumentsRequest()),
    );
    request.flush(
      createGetAdminDocumentsOkResponse([
        { id: 5, displayName: "Szerkeszthető fájl" },
      ]),
    );

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");

    await user.click(
      await screen.findByRole("button", {
        name: "Szerkesztés: Szerkeszthető fájl",
      }),
    );

    expect(navigateSpy).toHaveBeenCalledWith(["/admin/integra", 5]);

    httpTesting.verify();
  });

  test("confirming the delete dialog warns about the file and fires the delete request", async () => {
    const { httpTesting } = await renderAdminDocuments();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminDocumentsRequest()),
    );
    request.flush(
      createGetAdminDocumentsOkResponse([
        { id: 7, displayName: "Törölhető fájl" },
      ]),
    );

    await user.click(
      await screen.findByRole("button", { name: "Törlés: Törölhető fájl" }),
    );

    const dialog = await screen.findByRole("dialog", { name: "Fájl törlése" });

    expect(dialog.textContent).toContain(
      "Biztosan törölni szeretnéd a(z) „Törölhető fájl” fájlt?",
    );
    expect(dialog.textContent).toContain(
      "A feltöltött fájl is véglegesen törlődik.",
    );

    await user.click(screen.getByRole("button", { name: "Törlés" }));

    const deleteRequest = await waitFor(() =>
      httpTesting.expectOne(matchDeleteAdminDocumentRequest(7)),
    );
    deleteRequest.flush(null);

    httpTesting.verify();
  });

  test("shows the unexpected-error card above the grid when deleting fails", async () => {
    const { httpTesting } = await renderAdminDocuments();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminDocumentsRequest()),
    );
    request.flush(
      createGetAdminDocumentsOkResponse([
        { id: 7, displayName: "Törölhető fájl" },
      ]),
    );

    await user.click(
      await screen.findByRole("button", { name: "Törlés: Törölhető fájl" }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Fájl törlése" }),
    ).resolves.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Törlés" }));

    const deleteRequest = await waitFor(() =>
      httpTesting.expectOne(matchDeleteAdminDocumentRequest(7)),
    );
    deleteRequest.flush(
      { status: 500, code: "INTERNAL_SERVER_ERROR" },
      { status: 500, statusText: "Internal Server Error" },
    );

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    expect(
      screen.getByTestId("admin-documents-component").textContent,
    ).toContain("Törölhető fájl");

    httpTesting.verify();
  });

  test("cancelling the dialog fires no request", async () => {
    const { httpTesting } = await renderAdminDocuments();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminDocumentsRequest()),
    );
    request.flush(
      createGetAdminDocumentsOkResponse([
        { id: 7, displayName: "Törölhető fájl" },
      ]),
    );

    await user.click(
      await screen.findByRole("button", { name: "Törlés: Törölhető fájl" }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Fájl törlése" }),
    ).resolves.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mégsem" }));

    httpTesting.verify();
  });
});

async function renderAdminDocuments() {
  const renderResult = await render(AdminDocumentsComponent, {
    imports: [MatDialogModule],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter([{ path: "admin/integra/:id", children: [] }]),
      provideZonelessChangeDetection(),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
