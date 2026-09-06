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

import { matchAdminUsersRequest } from "../../../../mocks/admin/users/adminUsersRequest";
import { createGetAdminUsersOkResponse } from "../../../../mocks/admin/users/createGetAdminUsersOkResponse";
import { testQueryClient } from "../../../../mocks/testQueryClient";
import { AdminUsersComponent } from "./admin-users.component";

describe("AdminUsersComponent", () => {
  const user = userEvent.setup();

  test("shows a progress bar while loading", async () => {
    const { httpTesting } = await renderAdminUsers();

    await waitFor(() => httpTesting.expectOne(matchAdminUsersRequest()));

    await expect(screen.findByRole("progressbar")).resolves.toBeInTheDocument();
  });

  test("renders every user with its flags and last activity", async () => {
    const { httpTesting, container } = await renderAdminUsers();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminUsersRequest()),
    );
    request.flush(
      createGetAdminUsersOkResponse([
        {
          id: 1,
          email: "user001@example.com",
          confirmed: true,
          newsletter: false,
          lastActive: "2026-02-10T00:00:00.000000Z",
        },
        {
          id: 2,
          email: "user002@example.com",
          confirmed: false,
          newsletter: true,
          lastActive: null,
        },
      ]),
    );

    await waitFor(() => {
      expect(container.textContent).toContain("user001@example.com");
    });

    expect(container.textContent).toContain("user002@example.com");
    expect(container.textContent).toContain("Igen");
    expect(container.textContent).toContain("Nem");
    expect(container.textContent).toContain("2026. február 10.");

    httpTesting.verify();
  });

  test("renders an empty cell instead of Invalid Date when the user was never active", async () => {
    const { httpTesting, container } = await renderAdminUsers();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminUsersRequest()),
    );
    request.flush(
      createGetAdminUsersOkResponse([
        { id: 2, email: "user002@example.com", lastActive: null },
      ]),
    );

    await waitFor(() => {
      expect(container.textContent).toContain("user002@example.com");
    });

    expect(container.textContent).not.toContain("Invalid Date");

    httpTesting.verify();
  });

  test("marks an admin row and offers no delete action for it", async () => {
    const { httpTesting } = await renderAdminUsers();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminUsersRequest()),
    );
    request.flush(
      createGetAdminUsersOkResponse([
        { id: 1, email: "user001@example.com", isAdmin: false },
        { id: 2, email: "admin001@example.com", isAdmin: true },
      ]),
    );

    await expect(
      screen.findByRole("button", { name: "Törlés: user001@example.com" }),
    ).resolves.toBeInTheDocument();

    expect(screen.getByTestId("admin-users-component").textContent).toContain(
      "Adminisztrátor",
    );

    expect(
      screen.queryByRole("button", { name: "Törlés: admin001@example.com" }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Szerkesztés: admin001@example.com" }),
    ).toBeInTheDocument();

    httpTesting.verify();
  });

  test("shows the empty-state sentence when the API returns []", async () => {
    const { httpTesting } = await renderAdminUsers();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminUsersRequest()),
    );
    request.flush(createGetAdminUsersOkResponse([]));

    await expect(
      screen.findByText("Még nincsenek felhasználók."),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("shows the unexpected-error card when the request fails", async () => {
    const { httpTesting } = await renderAdminUsers();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminUsersRequest()),
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

  test("clicking the edit action navigates to the user form", async () => {
    const { httpTesting } = await renderAdminUsers();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminUsersRequest()),
    );
    request.flush(
      createGetAdminUsersOkResponse([{ id: 1, email: "user001@example.com" }]),
    );

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");

    await user.click(
      await screen.findByRole("button", {
        name: "Szerkesztés: user001@example.com",
      }),
    );

    expect(navigateSpy).toHaveBeenCalledWith(["/admin/felhasznalok", 1]);

    httpTesting.verify();
  });

  test("clicking the email action navigates to the write-to-user page", async () => {
    const { httpTesting } = await renderAdminUsers();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminUsersRequest()),
    );
    request.flush(
      createGetAdminUsersOkResponse([{ id: 1, email: "user001@example.com" }]),
    );

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");

    await user.click(
      await screen.findByRole("button", {
        name: "Email küldése: user001@example.com",
      }),
    );

    expect(navigateSpy).toHaveBeenCalledWith([
      "/admin/felhasznalok",
      1,
      "email",
    ]);

    httpTesting.verify();
  });

  test("the delete action opens the confirm dialog naming the user and fires no request yet", async () => {
    const { httpTesting } = await renderAdminUsers();

    const request = await waitFor(() =>
      httpTesting.expectOne(matchAdminUsersRequest()),
    );
    request.flush(
      createGetAdminUsersOkResponse([{ id: 1, email: "user001@example.com" }]),
    );

    await user.click(
      await screen.findByRole("button", {
        name: "Törlés: user001@example.com",
      }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Felhasználó törlése",
    });

    expect(dialog.textContent).toContain(
      "Biztosan törölni szeretnéd a(z) „user001@example.com” felhasználót?",
    );
    expect(dialog.textContent).toContain(
      "A felhasználó és minden hozzá tartozó adat véglegesen törlődik.",
    );

    await user.click(screen.getByRole("button", { name: "Törlés" }));

    httpTesting.verify();
  });
});

async function renderAdminUsers() {
  const renderResult = await render(AdminUsersComponent, {
    imports: [MatDialogModule],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter([
        { path: "admin/felhasznalok/:id", children: [] },
        { path: "admin/felhasznalok/:id/email", children: [] },
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
