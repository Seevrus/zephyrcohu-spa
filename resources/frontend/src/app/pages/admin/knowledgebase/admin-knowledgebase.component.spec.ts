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

import { matchAdminKnowledgebaseRequest } from "../../../../mocks/admin/knowledgebase/adminKnowledgebaseRequest";
import { createGetAdminKnowledgebaseOkResponse } from "../../../../mocks/admin/knowledgebase/createGetAdminKnowledgebaseOkResponse";
import { matchDeleteAdminKnowledgebaseRequest } from "../../../../mocks/admin/knowledgebase/deleteAdminKnowledgebaseRequest";
import { testQueryClient } from "../../../../mocks/testQueryClient";
import { AdminKnowledgebaseComponent } from "./admin-knowledgebase.component";

describe("AdminKnowledgebaseComponent", () => {
  test("shows a progress bar while loading", async () => {
    const { httpTesting } = await renderAdminKnowledgebase();

    await waitFor(() =>
      httpTesting.expectOne(matchAdminKnowledgebaseRequest()),
    );

    await expect(screen.findByRole("progressbar")).resolves.toBeInTheDocument();
  });

  test("renders every article, including an unpublished one", async () => {
    const { httpTesting, container } = await renderAdminKnowledgebase();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminKnowledgebaseRequest()),
    );
    request.flush(
      createGetAdminKnowledgebaseOkResponse([
        { id: 1, title: "Published article" },
        {
          id: 2,
          title: "Unpublished article",
          publishedAt: "2099-01-01T00:00:00.000000Z",
        },
      ]),
    );

    await waitFor(() => {
      expect(container.textContent).toContain("Published article");
    });

    expect(container.textContent).toContain("Unpublished article");

    httpTesting.verify();
  });

  test("shows the tags, sorted and joined", async () => {
    const { httpTesting, container } = await renderAdminKnowledgebase();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminKnowledgebaseRequest()),
    );
    request.flush(
      createGetAdminKnowledgebaseOkResponse([
        {
          id: 1,
          title: "Tagged article",
          tags: [
            { id: 2, name: "HR" },
            { id: 1, name: "INTEGRA" },
          ],
        },
      ]),
    );

    await waitFor(() => {
      expect(container.textContent).toContain("HR; INTEGRA");
    });

    httpTesting.verify();
  });

  test("shows the readers and the reader count", async () => {
    const { httpTesting, container } = await renderAdminKnowledgebase();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminKnowledgebaseRequest()),
    );
    request.flush(
      createGetAdminKnowledgebaseOkResponse([
        {
          id: 1,
          title: "Published article",
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
    const { httpTesting } = await renderAdminKnowledgebase();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminKnowledgebaseRequest()),
    );
    request.flush(createGetAdminKnowledgebaseOkResponse([]));

    await expect(
      screen.findByText("Még nincsenek tudásbázis cikkek az oldalon."),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("shows the unexpected-error card when the request fails", async () => {
    const { httpTesting } = await renderAdminKnowledgebase();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminKnowledgebaseRequest()),
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

  test("clicking the edit action navigates to the knowledgebase form", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminKnowledgebase();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminKnowledgebaseRequest()),
    );
    request.flush(
      createGetAdminKnowledgebaseOkResponse([
        { id: 5, title: "Editable article" },
      ]),
    );

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");

    await user.click(
      await screen.findByRole("button", {
        name: "Szerkesztés: Editable article",
      }),
    );

    expect(navigateSpy).toHaveBeenCalledWith(["/admin/tudasbazis", 5]);

    httpTesting.verify();
  });

  test("clicking the delete action opens the confirm dialog and confirming fires the delete request", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminKnowledgebase();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminKnowledgebaseRequest()),
    );
    request.flush(
      createGetAdminKnowledgebaseOkResponse([
        { id: 7, title: "Deletable article" },
      ]),
    );

    await user.click(
      await screen.findByRole("button", {
        name: "Törlés: Deletable article",
      }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Tudásbázis cikk törlése" }),
    ).resolves.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Törlés" }));

    const deleteRequest = await waitFor(() =>
      httpTesting.expectOne(matchDeleteAdminKnowledgebaseRequest(7)),
    );
    deleteRequest.flush(null);

    httpTesting.verify();
  });

  test("shows the unexpected-error card above the grid when deleting fails", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminKnowledgebase();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminKnowledgebaseRequest()),
    );
    request.flush(
      createGetAdminKnowledgebaseOkResponse([
        { id: 7, title: "Deletable article" },
      ]),
    );

    await user.click(
      await screen.findByRole("button", {
        name: "Törlés: Deletable article",
      }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Tudásbázis cikk törlése" }),
    ).resolves.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Törlés" }));

    const deleteRequest = await waitFor(() =>
      httpTesting.expectOne(matchDeleteAdminKnowledgebaseRequest(7)),
    );
    deleteRequest.flush(
      { status: 500, code: "INTERNAL_SERVER_ERROR" },
      { status: 500, statusText: "Internal Server Error" },
    );

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    expect(
      screen.getByTestId("admin-knowledgebase-component").textContent,
    ).toContain("Deletable article");

    httpTesting.verify();
  });

  test("cancelling the dialog fires no request", async () => {
    const user = userEvent.setup();
    const { httpTesting } = await renderAdminKnowledgebase();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminKnowledgebaseRequest()),
    );
    request.flush(
      createGetAdminKnowledgebaseOkResponse([
        { id: 7, title: "Deletable article" },
      ]),
    );

    await user.click(
      await screen.findByRole("button", {
        name: "Törlés: Deletable article",
      }),
    );

    await expect(
      screen.findByRole("dialog", { name: "Tudásbázis cikk törlése" }),
    ).resolves.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mégsem" }));

    httpTesting.verify();
  });

  test("filters the grid by title, case-insensitively, as the user types", async () => {
    const user = userEvent.setup();
    const { httpTesting, container } = await renderAdminKnowledgebase();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminKnowledgebaseRequest()),
    );
    request.flush(
      createGetAdminKnowledgebaseOkResponse([
        { id: 1, title: "Karbantartási szünet" },
        { id: 2, title: "Új cikk érkezett" },
      ]),
    );

    await waitFor(() => {
      expect(container.textContent).toContain("Karbantartási szünet");
    });

    await user.type(screen.getByLabelText("Keresés cím szerint"), "ÚJ CIKK");

    await waitFor(() => {
      expect(container.textContent).not.toContain("Karbantartási szünet");
    });

    expect(container.textContent).toContain("Új cikk érkezett");

    httpTesting.verify();
  });

  test("debounces the filter instead of re-filtering on every keystroke", async () => {
    const user = userEvent.setup();
    const { httpTesting, container } = await renderAdminKnowledgebase();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminKnowledgebaseRequest()),
    );
    request.flush(
      createGetAdminKnowledgebaseOkResponse([
        { id: 1, title: "Karbantartási szünet" },
        { id: 2, title: "Új cikk érkezett" },
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

async function renderAdminKnowledgebase() {
  const renderResult = await render(AdminKnowledgebaseComponent, {
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
