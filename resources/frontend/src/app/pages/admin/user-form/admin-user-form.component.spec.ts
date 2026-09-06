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

import {
  matchAdminUsersRequest,
  matchUpdateAdminUserRequest,
} from "../../../../mocks/admin/users/adminUsersRequest";
import { createAdminUserItemOkResponse } from "../../../../mocks/admin/users/createAdminUserItemOkResponse";
import { createGetAdminUsersOkResponse } from "../../../../mocks/admin/users/createGetAdminUsersOkResponse";
import { testQueryClient } from "../../../../mocks/testQueryClient";
import { type AdminUserResponse } from "../../../../types/admin-users";
import { FlashMessageService } from "../../../services/flash-message.service";
import { queryKeys } from "../../../services/queryKeys";
import { AdminUserFormComponent } from "./admin-user-form.component";

describe("AdminUserFormComponent", () => {
  const user = userEvent.setup();

  test("prefills the fields from the user list", async () => {
    const { httpTesting } = await renderAdminUserForm();

    await flushUsers(httpTesting);

    await waitFor(() => {
      expect(screen.getByLabelText("Címzett email címe")).toHaveValue(
        "user001@example.com",
      );
    });

    expect(
      screen.getByRole("checkbox", {
        name: "Ügyfélregisztráció visszaigazolása",
      }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", {
        name: "Új jelszó generálása az ügyfél számára",
      }),
    ).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Nem" })).toBeChecked();

    httpTesting.verify();
  });

  test("renders the not-found message for an unknown id", async () => {
    const { httpTesting } = await renderAdminUserForm("42");

    await flushUsers(httpTesting);

    await expect(
      screen.findByText("A felhasználó nem található."),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("reveals the last-resort password warning when the checkbox is ticked", async () => {
    const { httpTesting } = await renderAdminUserForm();

    await flushUsers(httpTesting);

    const checkbox = await screen.findByRole("checkbox", {
      name: "Új jelszó generálása az ügyfél számára",
    });

    expect(checkbox).not.toBeChecked();
    expect(screen.queryByTestId("password-warning")).not.toBeInTheDocument();

    await user.click(checkbox);

    const warning = await screen.findByTestId("password-warning");

    expect(warning.textContent).toContain("Végső megoldás.");
    expect(warning.textContent).toContain("Elfelejtett jelszó");
    expect(warning.textContent).toContain("emailben, olvasható formában");

    httpTesting.verify();
  });

  test("submits every field and navigates back to the list", async () => {
    const { httpTesting } = await renderAdminUserForm();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");

    await flushUsers(httpTesting);

    await waitFor(() => {
      expect(screen.getByLabelText("Címzett email címe")).toHaveValue(
        "user001@example.com",
      );
    });

    await user.clear(screen.getByLabelText("Címzett email címe"));
    await user.type(
      screen.getByLabelText("Címzett email címe"),
      "user002@example.com",
    );
    await user.click(screen.getByRole("radio", { name: "Igen" }));

    await user.click(screen.getByRole("button", { name: "Módosítás" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchUpdateAdminUserRequest(1)),
    );

    expect(request.request.body).toStrictEqual({
      email: "user002@example.com",
      confirmed: true,
      newsletter: true,
      generatePassword: false,
    });

    request.flush(createAdminUserItemOkResponse({ id: 1 }));

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(["/admin/felhasznalok"]);
    });

    await flushUsersRefetch(httpTesting);

    httpTesting.verify();
  });

  test("sends generatePassword true once the checkbox is ticked", async () => {
    const { httpTesting } = await renderAdminUserForm();

    await flushUsers(httpTesting);

    await user.click(
      await screen.findByRole("checkbox", {
        name: "Új jelszó generálása az ügyfél számára",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Módosítás" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchUpdateAdminUserRequest(1)),
    );

    expect(request.request.body).toStrictEqual({
      email: "user001@example.com",
      confirmed: true,
      newsletter: false,
      generatePassword: true,
    });

    request.flush(createAdminUserItemOkResponse({ id: 1 }));

    await flushUsersRefetch(httpTesting);

    httpTesting.verify();
  });

  test("locks the confirmation checkbox once the registration is confirmed", async () => {
    const { httpTesting } = await renderAdminUserForm();

    await flushUsers(httpTesting);

    const checkbox = await screen.findByRole("checkbox", {
      name: "Ügyfélregisztráció visszaigazolása",
    });

    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });

    expect(checkbox).toBeDisabled();

    await expect(
      screen.findByText("A regisztráció már visszaigazolásra került."),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("confirms an unconfirmed registration", async () => {
    const { httpTesting } = await renderAdminUserForm();

    await flushUsers(httpTesting, { confirmed: false });

    const checkbox = await screen.findByRole("checkbox", {
      name: "Ügyfélregisztráció visszaigazolása",
    });

    expect(checkbox).not.toBeChecked();
    expect(checkbox).toBeEnabled();

    await user.click(checkbox);
    await user.click(screen.getByRole("button", { name: "Módosítás" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchUpdateAdminUserRequest(1)),
    );

    expect(request.request.body).toStrictEqual({
      email: "user001@example.com",
      confirmed: true,
      newsletter: false,
      generatePassword: false,
    });

    request.flush(createAdminUserItemOkResponse({ id: 1 }));

    await flushUsersRefetch(httpTesting);

    httpTesting.verify();
  });

  test("leaves a pending flash message for the users grid after a successful update", async () => {
    const { httpTesting } = await renderAdminUserForm();
    const flashMessageService = TestBed.inject(FlashMessageService);

    await flushUsers(httpTesting);

    await user.click(
      await screen.findByRole("checkbox", {
        name: "Új jelszó generálása az ügyfél számára",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Módosítás" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchUpdateAdminUserRequest(1)),
    );
    request.flush(createAdminUserItemOkResponse({ id: 1 }));

    await waitFor(() => {
      expect(flashMessageService.consume()).toBe(
        "A felhasználó adatai módosultak.",
      );
    });

    await flushUsersRefetch(httpTesting);

    httpTesting.verify();
  });

  test("invalidates the users list and the session after a successful update", async () => {
    const { httpTesting } = await renderAdminUserForm();
    const queryClient = TestBed.inject(QueryClient);

    // Only a cached query can be marked invalidated, so the session cache is
    // seeded up front; the users list is cached by the form's own query.
    queryClient.setQueryData(queryKeys.session, { data: null });

    await flushUsers(httpTesting);

    await user.click(
      await screen.findByRole("checkbox", {
        name: "Új jelszó generálása az ügyfél számára",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Módosítás" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchUpdateAdminUserRequest(1)),
    );
    request.flush(createAdminUserItemOkResponse({ id: 1 }));

    await waitFor(() => {
      expect(queryClient.getQueryState(queryKeys.session)?.isInvalidated).toBe(
        true,
      );
    });

    expect(queryClient.getQueryState(queryKeys.adminUsers)?.isInvalidated).toBe(
      true,
    );

    await flushUsersRefetch(httpTesting);

    httpTesting.verify();
  });

  test("renders the backend sentence when nothing was modified", async () => {
    const { httpTesting } = await renderAdminUserForm();

    await flushUsers(httpTesting);

    await user.click(await screen.findByRole("button", { name: "Módosítás" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchUpdateAdminUserRequest(1)),
    );
    request.flush(
      {
        message: "The given data was invalid.",
        errors: { email: ["Az űrlapon nem került semmi módosításra."] },
      },
      { status: 422, statusText: "Unprocessable Content" },
    );

    await expect(
      screen.findByText("Az űrlapon nem került semmi módosításra."),
    ).resolves.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Módosítás" })).toBeVisible();

    httpTesting.verify();
  });

  test("renders the backend message when the email is already taken", async () => {
    const { httpTesting } = await renderAdminUserForm();

    await flushUsers(httpTesting);

    await user.click(await screen.findByRole("button", { name: "Módosítás" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchUpdateAdminUserRequest(1)),
    );
    request.flush(
      {
        message: "The given data was invalid.",
        errors: { email: ["A(z) email cím már foglalt."] },
      },
      { status: 422, statusText: "Unprocessable Content" },
    );

    await expect(
      screen.findByText("A(z) email cím már foglalt."),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("shows the unexpected-error card when the update fails with a 500", async () => {
    const { httpTesting } = await renderAdminUserForm();

    await flushUsers(httpTesting);

    await user.click(await screen.findByRole("button", { name: "Módosítás" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchUpdateAdminUserRequest(1)),
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

  test("shows the unexpected-error card when the user list cannot be loaded", async () => {
    const { httpTesting } = await renderAdminUserForm();

    const usersRequest = await waitFor(() =>
      httpTesting.expectOne(matchAdminUsersRequest()),
    );
    usersRequest.flush(
      { status: 500, code: "INTERNAL_SERVER_ERROR" },
      { status: 500, statusText: "Internal Server Error" },
    );

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("disables the submit button while the update is pending", async () => {
    const { httpTesting } = await renderAdminUserForm();

    await flushUsers(httpTesting);

    await user.click(await screen.findByRole("button", { name: "Módosítás" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchUpdateAdminUserRequest(1)),
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Módosítás" })).toBeDisabled();
    });

    request.flush(createAdminUserItemOkResponse({ id: 1 }));

    await flushUsersRefetch(httpTesting);

    httpTesting.verify();
  });
});

async function flushUsers(
  httpTesting: HttpTestingController,
  overrides: Partial<AdminUserResponse> = {},
) {
  const request = await waitFor(() =>
    httpTesting.expectOne(matchAdminUsersRequest()),
  );
  request.flush(
    createGetAdminUsersOkResponse([
      { id: 1, email: "user001@example.com", confirmed: true, ...overrides },
    ]),
  );
}

/**
 * A successful update invalidates `adminUsers`, and the form is still an active
 * observer of that key, so the refetch has to be consumed before `verify()`.
 */
async function flushUsersRefetch(httpTesting: HttpTestingController) {
  await waitFor(() => {
    const requests = httpTesting.match(matchAdminUsersRequest());

    expect(requests).toHaveLength(1);

    for (const request of requests) {
      request.flush(createGetAdminUsersOkResponse());
    }
  });
}

async function renderAdminUserForm(id = "1") {
  const renderResult = await render(AdminUserFormComponent, {
    inputs: { id },
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter([{ path: "admin/felhasznalok", children: [] }]),
      provideZonelessChangeDetection(),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
