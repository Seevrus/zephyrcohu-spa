import { provideHttpClient, withFetch } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { Component, inject } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";

import { testQueryClient } from "../../mocks/testQueryClient";
import { createPostResendConfirmEmailErrorResponse } from "../../mocks/users/createPostResendConfirmEmailErrorResponse";
import { resendConfirmationEmailRequest } from "../../mocks/users/resendConfirmationEmailRequest";
import { ResendConfirmationEmailService } from "./resend-confirmation-email.service";

describe("ResendConfirmationEmailService", () => {
  beforeEach(async () => {
    await render(TestComponent, {
      providers: [
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        provideTanStackQuery(testQueryClient),
        ResendConfirmationEmailService,
      ],
    });
  });

  test("should set error message on failure", async () => {
    const user = userEvent.setup();
    const httpTesting = TestBed.inject(HttpTestingController);

    await user.click(screen.getByTestId("resend-button"));

    const request = await waitFor(() =>
      httpTesting.expectOne(resendConfirmationEmailRequest),
    );

    request.flush(
      createPostResendConfirmEmailErrorResponse("INTERNAL_SERVER_ERROR"),
      {
        status: 500,
        statusText: "Internal Server Error",
      },
    );

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "INTERNAL_SERVER_ERROR",
      );
    });

    expect(screen.getByTestId("resent-email")).toHaveTextContent("");
  });

  test("should set specific error code on failure", async () => {
    const user = userEvent.setup();
    const httpTesting = TestBed.inject(HttpTestingController);

    await user.click(screen.getByTestId("resend-button"));

    const request = await waitFor(() =>
      httpTesting.expectOne(resendConfirmationEmailRequest),
    );

    request.flush(
      createPostResendConfirmEmailErrorResponse("EMAIL_NOT_FOUND"),
      {
        status: 404,
        statusText: "Not Found",
      },
    );

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "EMAIL_NOT_FOUND",
      );
    });

    expect(screen.getByTestId("resent-email")).toHaveTextContent("");
  });

  test("should set resent email on success", async () => {
    const user = userEvent.setup();
    const httpTesting = TestBed.inject(HttpTestingController);

    await user.click(screen.getByTestId("resend-button"));

    const request = await waitFor(() =>
      httpTesting.expectOne(resendConfirmationEmailRequest),
    );

    request.flush(null);

    await waitFor(() => {
      expect(screen.getByTestId("resent-email")).toHaveTextContent(
        "test@example.com",
      );
    });

    expect(screen.getByTestId("error-message")).toHaveTextContent("");
  });
});

@Component({
  selector: "app-fixture",
  template: `<div>
    <button
      data-testid="resend-button"
      (click)="
        resendConfirmationEmailService.onResendConfirmationEmail(
          'test@example.com'
        )
      "
    >
      Resend
    </button>
    <div data-testid="resent-email">
      {{ resendConfirmationEmailService.resentEmail() }}
    </div>
    <div data-testid="error-message">
      {{ resendConfirmationEmailService.resendConfirmationEmailErrorMessage() }}
    </div>
  </div>`,
})
class TestComponent {
  readonly resendConfirmationEmailService = inject(
    ResendConfirmationEmailService,
  );
}
