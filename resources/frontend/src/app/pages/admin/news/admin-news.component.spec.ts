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

import { matchAdminNewsRequest } from "../../../../mocks/admin/news/adminNewsRequest";
import { createGetAdminNewsOkResponse } from "../../../../mocks/admin/news/createGetAdminNewsOkResponse";
import { matchDeleteAdminNewsRequest } from "../../../../mocks/admin/news/deleteAdminNewsRequest";
import { testQueryClient } from "../../../../mocks/testQueryClient";
import { AdminNewsComponent } from "./admin-news.component";

describe("AdminNewsComponent", () => {
  test("shows a progress bar while loading", async () => {
    const { httpTesting } = await renderAdminNews();

    await waitFor(() => httpTesting.expectOne(matchAdminNewsRequest()));

    await expect(screen.findByRole("progressbar")).resolves.toBeInTheDocument();
  });

  test("renders every news item, including an unpublished one", async () => {
    const { httpTesting, container } = await renderAdminNews();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminNewsRequest()),
    );
    request.flush(
      createGetAdminNewsOkResponse([
        { id: 1, title: "Published news" },
        {
          id: 2,
          title: "Unpublished news",
          publishedAt: "2099-01-01T00:00:00.000000Z",
        },
      ]),
    );

    await waitFor(() => {
      expect(container.textContent).toContain("Published news");
    });

    expect(container.textContent).toContain("Unpublished news");

    httpTesting.verify();
  });

  test("shows the readers and the reader count", async () => {
    const { httpTesting, container } = await renderAdminNews();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminNewsRequest()),
    );
    request.flush(
      createGetAdminNewsOkResponse([
        {
          id: 1,
          title: "Published news",
          readerCount: 2,
          readers: ["a@example.com", "b@example.com"],
        },
      ]),
    );

    await waitFor(() => {
      expect(container.textContent).toContain("2");
    });

    expect(container.textContent).toContain("a@example.com; b@example.com");

    httpTesting.verify();
  });

  test("shows the empty-state sentence when the API returns []", async () => {
    const { httpTesting } = await renderAdminNews();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminNewsRequest()),
    );
    request.flush(createGetAdminNewsOkResponse([]));

    await expect(
      screen.findByText("Még nincsenek hírek az oldalon."),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("shows the unexpected-error card when the request fails", async () => {
    const { httpTesting } = await renderAdminNews();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminNewsRequest()),
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

  test("clicking the edit action navigates to the news form", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminNews();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminNewsRequest()),
    );
    request.flush(
      createGetAdminNewsOkResponse([{ id: 5, title: "Editable news" }]),
    );

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");

    await user.click(
      await screen.findByRole("button", { name: "Szerkesztés: Editable news" }),
    );

    expect(navigateSpy).toHaveBeenCalledWith(["/admin/hirek", 5]);

    httpTesting.verify();
  });

  test("clicking the delete action opens the confirm dialog and confirming fires the delete request", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminNews();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminNewsRequest()),
    );
    request.flush(
      createGetAdminNewsOkResponse([{ id: 7, title: "Deletable news" }]),
    );

    await user.click(
      await screen.findByRole("button", { name: "Törlés: Deletable news" }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Hír törlése" }),
    ).resolves.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Törlés" }));

    const deleteRequest = await waitFor(() =>
      httpTesting.expectOne(matchDeleteAdminNewsRequest(7)),
    );
    deleteRequest.flush(null);

    httpTesting.verify();
  });

  test("shows the unexpected-error card above the grid when deleting fails", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminNews();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminNewsRequest()),
    );
    request.flush(
      createGetAdminNewsOkResponse([{ id: 7, title: "Deletable news" }]),
    );

    await user.click(
      await screen.findByRole("button", { name: "Törlés: Deletable news" }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Hír törlése" }),
    ).resolves.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Törlés" }));

    const deleteRequest = await waitFor(() =>
      httpTesting.expectOne(matchDeleteAdminNewsRequest(7)),
    );
    deleteRequest.flush(
      { status: 500, code: "INTERNAL_SERVER_ERROR" },
      { status: 500, statusText: "Internal Server Error" },
    );

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    expect(screen.getByTestId("admin-news-component").textContent).toContain(
      "Deletable news",
    );

    httpTesting.verify();
  });

  test("cancelling the dialog fires no request", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminNews();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminNewsRequest()),
    );
    request.flush(
      createGetAdminNewsOkResponse([{ id: 7, title: "Deletable news" }]),
    );

    await user.click(
      await screen.findByRole("button", { name: "Törlés: Deletable news" }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Hír törlése" }),
    ).resolves.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mégsem" }));

    httpTesting.verify();
  });

  test("filters the grid by title, case-insensitively, as the user types", async () => {
    const user = userEvent.setup();
    const { httpTesting, container } = await renderAdminNews();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminNewsRequest()),
    );
    request.flush(
      createGetAdminNewsOkResponse([
        { id: 1, title: "Karbantartási szünet" },
        { id: 2, title: "Új funkció érkezett" },
      ]),
    );

    await waitFor(() => {
      expect(container.textContent).toContain("Karbantartási szünet");
    });

    await user.type(screen.getByLabelText("Keresés cím szerint"), "ÚJ FUNKCIÓ");

    await waitFor(() => {
      expect(container.textContent).not.toContain("Karbantartási szünet");
    });

    expect(container.textContent).toContain("Új funkció érkezett");

    httpTesting.verify();
  });
});

async function renderAdminNews() {
  const renderResult = await render(AdminNewsComponent, {
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
