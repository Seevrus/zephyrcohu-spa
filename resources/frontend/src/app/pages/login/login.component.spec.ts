import { provideHttpClient, withFetch } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";

import { testQueryClient } from "../../../mocks/testQueryClient";
import { createLoginErrorResponse } from "../../../mocks/users/createLoginErrorResponse";
import { createPostResendConfirmEmailErrorResponse } from "../../../mocks/users/createPostResendConfirmEmailErrorResponse";
import getSessionOkResponse from "../../../mocks/users/getSessionOkResponse.json";
import { loginRequest } from "../../../mocks/users/loginRequest";
import { resendConfirmationEmailRequest } from "../../../mocks/users/resendConfirmationEmailRequest";
import { LoginComponent } from "./login.component";

describe("Login Component", () => {
  const user = userEvent.setup();

  test("should render the form correctly", async () => {
    await renderLoginComponent();

    const emailField = screen.getByTestId("email");

    expect(emailField?.querySelector("label")?.textContent).toBe("Email cím");
    expect(emailField?.querySelector("input")?.type).toBe("text");

    const passwordField = screen.getByTestId("password");

    expect(passwordField?.querySelector("label")?.textContent).toBe("Jelszó");
    expect(passwordField?.querySelector("input")?.type).toBe("password");

    const togglePassword =
      screen.getByTestId<HTMLButtonElement>("toggle-password");

    expect(togglePassword?.disabled).toBe(false);

    const submitButton = screen
      .getByTestId("submit-button")
      .querySelector("button")!;

    expect(submitButton?.disabled).toBe(true);
  });

  describe("should validate the form correctly", () => {
    test("validates email correctly", async () => {
      const { container } = await renderLoginComponent();

      const emailInput = screen.getByTestId("email").querySelector("input")!;
      await user.click(emailInput);
      await user.tab();

      await waitFor(() => {
        expect(container.querySelector("mat-error")).toHaveTextContent(
          "Kötelező mező",
        );
      });

      await user.type(emailInput, "invalid-email");
      await user.tab();

      expect(container.querySelector("mat-error")).toHaveTextContent(
        "Email cím formátuma nem megfelelő",
      );
    });

    test("validates password correctly", async () => {
      const { container } = await renderLoginComponent();

      const passwordInput = screen
        .getByTestId("password")
        .querySelector("input")!;
      await user.click(passwordInput);
      await user.tab();

      await waitFor(() => {
        expect(container.querySelector("mat-error")).toHaveTextContent(
          "Kötelező mező",
        );
      });

      await user.type(passwordInput, "12");
      await user.tab();

      expect(container.querySelector("mat-error")).toHaveTextContent(
        "Jelszó formátuma nem megfelelő",
      );
    });

    test("toggle password button changes the type of the password input", async () => {
      await renderLoginComponent();

      const togglePassword = screen.getByTestId("toggle-password");
      await user.click(togglePassword);

      const passwordInput = screen
        .getByTestId("password")
        .querySelector("input")!;

      expect(passwordInput.type).toBe("text");
    });

    test("enables submit if the form is filled correctly", async () => {
      await renderLoginComponent();

      const emailInput = screen.getByTestId("email").querySelector("input")!;
      await user.type(emailInput, "abc123@abc.com");

      const passwordInput = screen
        .getByTestId("password")
        .querySelector("input")!;
      await user.type(passwordInput, "abc123xyz");

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button")!;

      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("should show the correct API error messages", () => {
    test("if the credentials are bad", async () => {
      const { fixture, httpTesting } = await renderLoginComponent();
      await fillForm(fixture);

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button")!;

      await user.click(submitButton);

      const request = await waitFor(() => httpTesting.expectOne(loginRequest));

      request.flush(createLoginErrorResponse("BAD_CREDENTIALS"), {
        status: 401,
        statusText: "Unauthorized",
      });

      await expect(
        screen.findByTestId("bad-credentials-error"),
      ).resolves.toBeInTheDocument();

      expect(
        screen.queryByTestId("register-exists-not-confirmed"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("register-resend-email-error"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("register-resend-email-success"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("too-many-login-attempts-error"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("user-already-logged-in-error"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("form-unexpected-error"),
      ).not.toBeInTheDocument();

      httpTesting.verify();
    });

    test("if the user is not confirmed", async () => {
      const { fixture, httpTesting } = await renderLoginComponent();
      await fillForm(fixture);

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button")!;

      await user.click(submitButton);

      const request = await waitFor(() => httpTesting.expectOne(loginRequest));

      request.flush(createLoginErrorResponse("USER_NOT_CONFIRMED"), {
        status: 409,
        statusText: "Conflict",
      });

      await expect(
        screen.findByTestId("register-exists-not-confirmed"),
      ).resolves.toBeInTheDocument();

      expect(
        screen.queryByTestId("bad-credentials-error"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("register-resend-email-error"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("register-resend-email-success"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("too-many-login-attempts-error"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("user-already-logged-in-error"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("form-unexpected-error"),
      ).not.toBeInTheDocument();

      httpTesting.verify();
    });

    test("if there are too many login attempts", async () => {
      const { fixture, httpTesting } = await renderLoginComponent();
      await fillForm(fixture);

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button")!;

      await user.click(submitButton);

      const request = await waitFor(() => httpTesting.expectOne(loginRequest));

      request.flush(createLoginErrorResponse("TOO_MANY_LOGIN_ATTEMPTS"), {
        status: 429,
        statusText: "Too Many Requests",
      });

      await expect(
        screen.findByTestId("too-many-login-attempts-error"),
      ).resolves.toBeInTheDocument();

      expect(
        screen.queryByTestId("bad-credentials-error"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("register-exists-not-confirmed"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("register-resend-email-error"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("register-resend-email-success"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("user-already-logged-in-error"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("form-unexpected-error"),
      ).not.toBeInTheDocument();

      httpTesting.verify();
    });

    test("if the user is already logged in", async () => {
      const { fixture, httpTesting } = await renderLoginComponent();
      await fillForm(fixture);

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button")!;

      await user.click(submitButton);

      const request = await waitFor(() => httpTesting.expectOne(loginRequest));

      request.flush(createLoginErrorResponse("USER_ALREADY_LOGGED_IN"), {
        status: 409,
        statusText: "Conflict",
      });

      await expect(
        screen.findByTestId("user-already-logged-in-error"),
      ).resolves.toBeInTheDocument();

      expect(
        screen.queryByTestId("bad-credentials-error"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("register-exists-not-confirmed"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("register-resend-email-error"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("register-resend-email-success"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("too-many-login-attempts-error"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("form-unexpected-error"),
      ).not.toBeInTheDocument();

      httpTesting.verify();
    });

    test("in the case of an unknown error", async () => {
      const { fixture, httpTesting } = await renderLoginComponent();
      await fillForm(fixture);

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button")!;

      await user.click(submitButton);

      const request = await waitFor(() => httpTesting.expectOne(loginRequest));

      request.flush(createLoginErrorResponse("INTERNAL_SERVER_ERROR"), {
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(
        screen.findByTestId("form-unexpected-error"),
      ).resolves.toBeInTheDocument();

      expect(
        screen.queryByTestId("bad-credentials-error"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("register-exists-not-confirmed"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("register-resend-email-error"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("register-resend-email-success"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("too-many-login-attempts-error"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("user-already-logged-in-error"),
      ).not.toBeInTheDocument();

      httpTesting.verify();
    });

    test("submit button is disabled until the user modifies something", async () => {
      const { fixture, httpTesting } = await renderLoginComponent();
      await fillForm(fixture);

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button")!;

      await user.click(submitButton);

      const request = await waitFor(() => httpTesting.expectOne(loginRequest));

      request.flush(createLoginErrorResponse("INTERNAL_SERVER_ERROR"), {
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(
        screen.findByTestId("form-unexpected-error"),
      ).resolves.toBeInTheDocument();

      expect(submitButton).toBeDisabled();

      await fillForm(fixture, { email: "abc124@gmail.com" });

      expect(submitButton).toBeEnabled();
    });
  });

  test("should navigate to home on successful login", async () => {
    const { fixture, httpTesting } = await renderLoginComponent();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");

    await fillForm(fixture);

    const submitButton = screen
      .getByTestId("submit-button")
      .querySelector("button")!;

    await user.click(submitButton);

    const request = await waitFor(() => httpTesting.expectOne(loginRequest));
    request.flush(getSessionOkResponse);

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(["/"]);
    });

    navigateSpy.mockRestore();

    httpTesting.verify();
  });

  test("should show the correct error message when resending the confirmation email fails", async () => {
    const { fixture, httpTesting } = await renderLoginComponent();
    await fillForm(fixture);

    fixture.componentInstance.loginErrorMessage.set("USER_NOT_CONFIRMED");

    const resendLink = await screen.findByTestId(
      "resend-confirmation-email-link",
    );

    await user.click(resendLink);

    const resendConfirmEmailRequest = await waitFor(() =>
      httpTesting.expectOne(resendConfirmationEmailRequest),
    );

    resendConfirmEmailRequest.flush(
      createPostResendConfirmEmailErrorResponse("INTERNAL_SERVER_ERROR"),
      {
        status: 500,
        statusText: "Internal Server Error",
      },
    );

    await expect(
      screen.findByTestId("register-resend-email-error"),
    ).resolves.toBeInTheDocument();

    expect(
      screen.queryByTestId("bad-credentials-error"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("register-exists-not-confirmed"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("register-resend-email-success"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("too-many-login-attempts-error"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("user-already-logged-in-error"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("form-unexpected-error"),
    ).not.toBeInTheDocument();
  });

  test("should show the correct success message when resending the confirmation email succeeds", async () => {
    const { fixture, httpTesting } = await renderLoginComponent();
    await fillForm(fixture);

    fixture.componentInstance.loginErrorMessage.set("USER_NOT_CONFIRMED");

    const resendLink = await screen.findByTestId(
      "resend-confirmation-email-link",
    );

    await user.click(resendLink);

    const resendConfirmEmailRequest = await waitFor(() =>
      httpTesting.expectOne(resendConfirmationEmailRequest),
    );

    resendConfirmEmailRequest.flush(null);

    await expect(
      screen.findByTestId("register-resend-email-success"),
    ).resolves.toBeInTheDocument();

    expect(
      screen.queryByTestId("bad-credentials-error"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("register-exists-not-confirmed"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("register-resend-email-error"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("too-many-login-attempts-error"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("user-already-logged-in-error"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("form-unexpected-error"),
    ).not.toBeInTheDocument();
  });
});

async function fillForm(
  fixture: ComponentFixture<LoginComponent>,
  overrides: Partial<{ email: string }> = {},
) {
  fixture.componentInstance.loginForm.setValue({
    email: overrides.email ?? "abc123@gmail.com",
    password: "password123",
  });
  fixture.componentInstance.loginForm.markAsDirty();

  await fixture.whenStable();
}

async function renderLoginComponent() {
  const renderResult = await render(LoginComponent, {
    initialRoute: "/bejelentkezes",
    providers: [
      provideHttpClient(withFetch()),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter([
        {
          path: "bejelentkezes",
          component: LoginComponent,
          title: "Bejelentkezés",
        },
      ]),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
