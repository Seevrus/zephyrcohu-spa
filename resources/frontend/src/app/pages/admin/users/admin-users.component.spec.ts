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

import {
  matchAdminUsersRequest,
  matchDeleteAdminUserRequest,
} from "../../../../mocks/admin/users/adminUsersRequest";
import { createGetAdminUsersOkResponse } from "../../../../mocks/admin/users/createGetAdminUsersOkResponse";
import { testQueryClient } from "../../../../mocks/testQueryClient";
import { FlashMessageService } from "../../../services/flash-message.service";
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

  describe("Deleting a user", () => {
    test("the delete action opens the dialog naming the user", async () => {
      const { httpTesting } = await renderAdminUsers();

      await openDeleteDialog(httpTesting);

      const dialog = screen.getByRole("dialog", {
        name: "Felhasználó törlése",
      });

      expect(dialog.textContent).toContain(
        "A(z) „user001@example.com” felhasználó és minden hozzá tartozó adat véglegesen törlődik.",
      );

      httpTesting.verify();
    });

    test("confirming sends the deletion reason and reports the success", async () => {
      const { httpTesting } = await renderAdminUsers();

      await openDeleteDialog(httpTesting);
      await user.click(confirmDeleteButton());

      const deleteRequest = await waitFor(() =>
        httpTesting.expectOne(matchDeleteAdminUserRequest(1)),
      );

      expect(deleteRequest.request.body).toStrictEqual({
        subject: "Regisztrációja törlésre került",
        reason: "asked",
        customReason: null,
      });

      deleteRequest.flush(null, { status: 204, statusText: "No Content" });

      await expect(
        screen.findByText("Felhasználó törlése sikeres."),
      ).resolves.toBeInTheDocument();

      await flushUsersRefetch(httpTesting);

      httpTesting.verify();
    });

    test("a failed deletion shows the unexpected-error card", async () => {
      const { httpTesting } = await renderAdminUsers();

      await openDeleteDialog(httpTesting);
      await user.click(confirmDeleteButton());

      const deleteRequest = await waitFor(() =>
        httpTesting.expectOne(matchDeleteAdminUserRequest(1)),
      );
      deleteRequest.flush(
        { status: 500, code: "INTERNAL_SERVER_ERROR" },
        { status: 500, statusText: "Internal Server Error" },
      );

      await expect(
        screen.findByTestId("form-unexpected-error"),
      ).resolves.toBeInTheDocument();

      httpTesting.verify();
    });

    test("cancelling the dialog fires no request", async () => {
      const { httpTesting } = await renderAdminUsers();

      await openDeleteDialog(httpTesting);
      await user.click(screen.getByRole("button", { name: "Mégsem" }));

      expect(httpTesting.match(matchDeleteAdminUserRequest(1))).toHaveLength(0);

      httpTesting.verify();
    });
  });

  describe("User update message", () => {
    test("renders the flash message left by the user form", async () => {
      const { httpTesting } = await renderAdminUsers(
        "A felhasználó adatai módosultak.",
      );

      const request = await waitFor(() =>
        httpTesting.expectOne(matchAdminUsersRequest()),
      );
      request.flush(createGetAdminUsersOkResponse());

      await expect(
        screen.findByText("A felhasználó adatai módosultak."),
      ).resolves.toBeInTheDocument();

      httpTesting.verify();
    });

    test("renders no success card when no flash message is pending", async () => {
      const { httpTesting } = await renderAdminUsers();

      const request = await waitFor(() =>
        httpTesting.expectOne(matchAdminUsersRequest()),
      );
      request.flush(createGetAdminUsersOkResponse());

      await waitFor(() => {
        expect(screen.getByTestId("admin-users-component")).toBeInTheDocument();
      });

      expect(
        screen.queryByTestId("zephyr-success-card"),
      ).not.toBeInTheDocument();

      httpTesting.verify();
    });
  });
});

function confirmDeleteButton() {
  return screen.getByRole("button", { name: "Igen, törlés" });
}

async function openDeleteDialog(httpTesting: HttpTestingController) {
  const request = await waitFor(() =>
    httpTesting.expectOne(matchAdminUsersRequest()),
  );
  request.flush(
    createGetAdminUsersOkResponse([{ id: 1, email: "user001@example.com" }]),
  );

  await userEvent.click(
    await screen.findByRole("button", {
      name: "Törlés: user001@example.com",
    }),
  );

  await screen.findByRole("dialog", { name: "Felhasználó törlése" });
}

/**
 * A successful deletion invalidates `adminUsers`, and the grid is still an
 * active observer of that key, so the refetch has to be consumed before
 * `verify()`.
 */
async function flushUsersRefetch(httpTesting: HttpTestingController) {
  await waitFor(() => {
    const requests = httpTesting.match(matchAdminUsersRequest());

    expect(requests).toHaveLength(1);

    for (const request of requests) {
      request.flush(createGetAdminUsersOkResponse([]));
    }
  });
}

async function renderAdminUsers(flashMessage?: string) {
  const renderResult = await render(AdminUsersComponent, {
    imports: [MatDialogModule],
    configureTestBed(testBed) {
      if (flashMessage) {
        testBed.inject(FlashMessageService).set(flashMessage);
      }
    },
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
