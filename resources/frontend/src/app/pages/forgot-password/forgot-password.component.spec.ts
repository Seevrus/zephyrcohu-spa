import { provideHttpClient, withFetch } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";

import { testQueryClient } from "../../../mocks/testQueryClient";
import requestNewPasswordErrorResponse from "../../../mocks/users/requestNewPasswordErrorResponse.json";
import { requestNewPasswordRequest } from "../../../mocks/users/requestNewPasswordRequest";
import { ForgotPasswordComponent } from "./forgot-password.component";

describe("Forgot Password Component", () => {
  const user = userEvent.setup();

  describe("short render the form correctly", () => {
    test("email input", async () => {
      await renderForgotPasswordComponent();

      const emailField = screen.getByTestId("email");
      expect(emailField.querySelector("label")).toHaveTextContent("Email cím");
      expect(emailField.querySelector("input")?.type).toEqual("text");
    });

    test("submit button", async () => {
      await renderForgotPasswordComponent();

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button");

      expect(submitButton).toBeDisabled();
    });
  });

  describe("should validate the form correctly", () => {
    test("email input", async () => {
      const { container } = await renderForgotPasswordComponent();

      const emailInput = screen.getByTestId("email").querySelector("input")!;

      await user.type(emailInput, "invalid-email");
      await user.tab();

      expect(container.querySelector("mat-error")).toHaveTextContent(
        "Email cím formátuma nem megfelelő",
      );

      await user.clear(emailInput);
      await user.tab();

      expect(container.querySelector("mat-error")).toHaveTextContent(
        "Kötelező mező",
      );
    });

    test("can submit if the form is valid", async () => {
      const { fixture } = await renderForgotPasswordComponent();

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button");

      expect(submitButton).toBeDisabled();

      await fillForm(fixture);

      expect(submitButton).toBeEnabled();
    });
  });

  test("should show the correct API error message in the case of an unknown error", async () => {
    const { fixture, httpTesting } = await renderForgotPasswordComponent();
    await fillForm(fixture);

    const submitButton = screen
      .getByTestId("submit-button")
      .querySelector("button")!;

    await user.click(submitButton);

    const request = await waitFor(() =>
      httpTesting.expectOne(requestNewPasswordRequest),
    );

    request.flush(requestNewPasswordErrorResponse, {
      status: 500,
      statusText: "Internal Server Error",
    });

    expect(
      await screen.findByTestId("form-unexpected-error"),
    ).toBeInTheDocument();

    expect(
      screen.queryByTestId("forgot-password-email-sent"),
    ).not.toBeInTheDocument();

    httpTesting.verify();
  });

  test("should show the correct API success message", async () => {
    const { fixture, httpTesting } = await renderForgotPasswordComponent();
    await fillForm(fixture);

    const submitButton = screen
      .getByTestId("submit-button")
      .querySelector("button")!;

    await user.click(submitButton);

    const request = await waitFor(() =>
      httpTesting.expectOne(requestNewPasswordRequest),
    );

    request.flush(null);

    expect(
      await screen.findByTestId("forgot-password-email-sent"),
    ).toBeInTheDocument();

    expect(
      screen.queryByTestId("form-unexpected-error"),
    ).not.toBeInTheDocument();

    httpTesting.verify();
  });
});

async function fillForm(
  fixture: ComponentFixture<ForgotPasswordComponent>,
  overrides: Partial<{ email: string }> = {},
) {
  fixture.componentInstance.forgotPasswordForm.setValue({
    email: overrides.email ?? "abc123@gmail.com",
  });
  fixture.componentInstance.forgotPasswordForm.markAsDirty();

  await fixture.whenStable();
}

async function renderForgotPasswordComponent() {
  const renderResult = await render(ForgotPasswordComponent, {
    providers: [
      provideHttpClient(withFetch()),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideZonelessChangeDetection(),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
