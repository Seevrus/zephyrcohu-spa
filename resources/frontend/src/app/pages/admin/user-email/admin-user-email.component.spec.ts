import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";
import { userEvent } from "@testing-library/user-event";

import {
  matchAdminUsersRequest,
  matchSendAdminUserEmailRequest,
} from "../../../../mocks/admin/users/adminUsersRequest";
import { createGetAdminUsersOkResponse } from "../../../../mocks/admin/users/createGetAdminUsersOkResponse";
import { testQueryClient } from "../../../../mocks/testQueryClient";
import { FlashMessageService } from "../../../services/flash-message.service";
import { AdminUserEmailComponent } from "./admin-user-email.component";

describe("AdminUserEmailComponent", () => {
  const user = userEvent.setup();

  test("shows the recipient from the user list without letting it be edited", async () => {
    const { httpTesting } = await renderAdminUserEmail();

    await flushUsers(httpTesting);

    await waitFor(() => {
      expect(screen.getByLabelText("Címzett email címe")).toHaveValue(
        "user001@example.com",
      );
    });

    expect(screen.getByLabelText("Címzett email címe")).toHaveAttribute(
      "readonly",
    );

    httpTesting.verify();
  });

  test("renders the not-found message for an unknown id", async () => {
    const { httpTesting } = await renderAdminUserEmail("42");

    await flushUsers(httpTesting);

    await expect(
      screen.findByText("A felhasználó nem található."),
    ).resolves.toBeInTheDocument();

    httpTesting.verify();
  });

  test("keeps the send button disabled until both the subject and the body are filled", async () => {
    const { httpTesting, fixture } = await renderAdminUserEmail();

    await flushUsers(httpTesting);

    const sendButton = await screen.findByRole("button", { name: "Elküldés" });

    expect(sendButton).toBeDisabled();

    await user.type(screen.getByLabelText("Tárgy"), "Kapcsolatfelvétel");

    expect(sendButton).toBeDisabled();

    // TinyMCE doesn't render usable controls under jsdom (see
    // rich-text-editor.component.spec.ts) — set the form value directly
    // through the component instance instead.
    fixture.componentInstance.emailForm
      .body()
      .value.set("<p>Fontos üzenetünk van.</p>");

    await waitFor(() => {
      expect(sendButton).toBeEnabled();
    });

    httpTesting.verify();
  });

  test("sends the subject and the body, then returns to the list with a message", async () => {
    const { httpTesting, fixture } = await renderAdminUserEmail();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");

    await flushUsers(httpTesting);

    await user.type(await screen.findByLabelText("Tárgy"), "Kapcsolatfelvétel");
    fixture.componentInstance.emailForm
      .body()
      .value.set("<p>Fontos üzenetünk van.</p>");

    await user.click(screen.getByRole("button", { name: "Elküldés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchSendAdminUserEmailRequest(1)),
    );

    expect(request.request.body).toStrictEqual({
      subject: "Kapcsolatfelvétel",
      body: "<p>Fontos üzenetünk van.</p>",
    });

    request.flush(null, { status: 204, statusText: "No Content" });

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(["/admin/felhasznalok"]);
    });

    expect(TestBed.inject(FlashMessageService).consume()).toBe(
      "Email küldése sikeres.",
    );

    httpTesting.verify();
  });

  test("keeps the form filled when the sending fails", async () => {
    const { httpTesting, fixture } = await renderAdminUserEmail();

    await flushUsers(httpTesting);

    await user.type(await screen.findByLabelText("Tárgy"), "Kapcsolatfelvétel");
    fixture.componentInstance.emailForm
      .body()
      .value.set("<p>Fontos üzenetünk van.</p>");

    await user.click(screen.getByRole("button", { name: "Elküldés" }));

    const request = await waitFor(() =>
      httpTesting.expectOne(matchSendAdminUserEmailRequest(1)),
    );
    request.flush(
      { status: 500, code: "INTERNAL_SERVER_ERROR" },
      { status: 500, statusText: "Internal Server Error" },
    );

    await expect(
      screen.findByTestId("form-unexpected-error"),
    ).resolves.toBeInTheDocument();

    expect(screen.getByLabelText("Tárgy")).toHaveValue("Kapcsolatfelvétel");

    httpTesting.verify();
  });

  test("shows the unexpected-error card when the user list cannot be loaded", async () => {
    const { httpTesting } = await renderAdminUserEmail();

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
});

async function flushUsers(httpTesting: HttpTestingController) {
  const request = await waitFor(() =>
    httpTesting.expectOne(matchAdminUsersRequest()),
  );
  request.flush(
    createGetAdminUsersOkResponse([{ id: 1, email: "user001@example.com" }]),
  );
}

async function renderAdminUserEmail(id = "1") {
  const renderResult = await render(AdminUserEmailComponent, {
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
