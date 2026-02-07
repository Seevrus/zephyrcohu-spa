import { provideHttpClient, withFetch } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideRouter, Router } from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";
import { type UserEvent, userEvent } from "@testing-library/user-event";
import { RecaptchaComponent } from "ng-recaptcha-2";

import checkCaptchaTokenErrorResponse from "../../../mocks/captcha/checkCaptchaTokenErrorResponse.json";
import checkCaptchaTokenOkResponse from "../../../mocks/captcha/checkCaptchaTokenOkResponse.json";
import { checkCaptchaTokenRequest } from "../../../mocks/captcha/checkCaptchaTokenRequest";
import { testQueryClient } from "../../../mocks/testQueryClient";
import { createResetPasswordErrorResponse } from "../../../mocks/users/createResetPasswordErrorResponse";
import getSessionOkResponse from "../../../mocks/users/getSessionOkResponse.json";
import { resetPasswordRequest } from "../../../mocks/users/resetPasswordRequest";
import { ResetPasswordComponent } from "./reset-password.component";

describe("Reset Password Component", () => {
  let user: UserEvent;

  beforeAll(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("should render the form correctly", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    test("displays an error message if the query parameters are not present", async () => {
      await renderResetPasswordComponent(undefined, undefined);

      expect(screen.getByTestId("email-link-error")).toBeInTheDocument();

      expect(
        screen.queryByTestId("reset-password-form"),
      ).not.toBeInTheDocument();
    });

    test("displays the email correctly from the query parameters", async () => {
      await renderResetPasswordComponent("test@test.com", "some-test-code");

      expect(screen.getByText("test@test.com")).toBeInTheDocument();
    });

    test("password fields", async () => {
      await renderResetPasswordComponent("test@test.com", "some-test-code");

      expect(screen.getByTestId("passwords-container")).toBeInTheDocument();
    });
  });

  describe("should validate the form correctly", () => {
    test("validates password correctly", async () => {
      const { container } = await renderResetPasswordComponent(
        "test@test.com",
        "some-test-code",
      );

      const passwordInput = screen
        .getByTestId("password")
        .querySelector("input")!;

      await user.type(passwordInput, "12");
      await user.tab();

      expect(container.querySelector("mat-error")).toHaveTextContent(
        "Jelszó formátuma nem megfelelő",
      );

      await user.clear(passwordInput);
      await user.tab();

      expect(container.querySelector("mat-error")).toHaveTextContent(
        "Kötelező mező",
      );
    });

    test("shows an error if passwords don't match", async () => {
      const { container } = await renderResetPasswordComponent(
        "test@test.com",
        "some-test-code",
      );

      const passwordInput = screen
        .getByTestId("password")
        .querySelector("input")!;

      const passwordAgainInput = screen
        .getByTestId("password-again")
        .querySelector("input")!;

      await user.type(passwordInput, "weakpass");
      await user.type(passwordAgainInput, "strongpass");
      await user.tab();

      expect(container.querySelector(".custom-error")).toHaveTextContent(
        "A beírt jelszavak nem egyeznek meg",
      );
    });

    test("can submit if the form is valid", async () => {
      const { fixture } = await renderResetPasswordComponent(
        "test@test.com",
        "some-test-code",
      );

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button");

      expect(submitButton).toBeDisabled();

      await fillForm(fixture);

      expect(submitButton).toBeEnabled();
    });
  });

  describe("should show the correct API error messages", () => {
    test("in the case of a captcha error", async () => {
      const { fixture, httpTesting } = await renderResetPasswordComponent(
        "test@test.com",
        "some-test-code",
      );
      await fillForm(fixture);

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button")!;

      await user.click(submitButton);

      const checkCaptchaTokenTestRequest = await waitFor(() =>
        httpTesting.expectOne(checkCaptchaTokenRequest),
      );

      checkCaptchaTokenTestRequest.flush(checkCaptchaTokenErrorResponse);

      await assertFormMessagePresent("captcha-failed-error");

      httpTesting.verify();
    });

    test("if the email code is not correct", async () => {
      const { fixture, httpTesting } = await renderResetPasswordComponent(
        "test@test.com",
        "some-test-code",
      );
      await fillForm(fixture);

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button")!;

      await user.click(submitButton);

      const checkCaptchaTokenTestRequest = await waitFor(() =>
        httpTesting.expectOne(checkCaptchaTokenRequest),
      );

      checkCaptchaTokenTestRequest.flush(checkCaptchaTokenOkResponse);

      const resetPasswordTestRequest = await waitFor(() =>
        httpTesting.expectOne(resetPasswordRequest),
      );

      resetPasswordTestRequest.flush(
        createResetPasswordErrorResponse("BAD_CREDENTIALS"),
        {
          status: 400,
          statusText: "Bad Request",
        },
      );

      await assertFormMessagePresent("bad-credentials-error");

      httpTesting.verify();
    });

    test("if the email code is expired", async () => {
      const { fixture, httpTesting } = await renderResetPasswordComponent(
        "test@test.com",
        "some-test-code",
      );
      await fillForm(fixture);

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button")!;

      await user.click(submitButton);

      const checkCaptchaTokenTestRequest = await waitFor(() =>
        httpTesting.expectOne(checkCaptchaTokenRequest),
      );

      checkCaptchaTokenTestRequest.flush(checkCaptchaTokenOkResponse);

      const resetPasswordTestRequest = await waitFor(() =>
        httpTesting.expectOne(resetPasswordRequest),
      );

      resetPasswordTestRequest.flush(
        createResetPasswordErrorResponse("CODE_EXPIRED"),
        {
          status: 410,
          statusText: "Gone",
        },
      );

      await assertFormMessagePresent("email-code-expired-error");

      httpTesting.verify();
    });

    test("in the case of an unknown error", async () => {
      const { fixture, httpTesting } = await renderResetPasswordComponent(
        "test@test.com",
        "some-test-code",
      );
      await fillForm(fixture);

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button")!;

      await user.click(submitButton);

      const checkCaptchaTokenTestRequest = await waitFor(() =>
        httpTesting.expectOne(checkCaptchaTokenRequest),
      );

      checkCaptchaTokenTestRequest.flush(checkCaptchaTokenOkResponse);

      const resetPasswordTestRequest = await waitFor(() =>
        httpTesting.expectOne(resetPasswordRequest),
      );

      resetPasswordTestRequest.flush(
        createResetPasswordErrorResponse("INTERNAL_SERVER_ERROR"),
        {
          status: 500,
          statusText: "Internal Server Error",
        },
      );

      await assertFormMessagePresent("form-unexpected-error");

      httpTesting.verify();
    });

    test("submit button is disabled until the user modifies something", async () => {
      const { fixture, httpTesting } = await renderResetPasswordComponent(
        "test@test.com",
        "some-test-code",
      );
      await fillForm(fixture);

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button")!;

      await user.click(submitButton);

      const checkCaptchaTokenTestRequest = await waitFor(() =>
        httpTesting.expectOne(checkCaptchaTokenRequest),
      );

      checkCaptchaTokenTestRequest.flush(checkCaptchaTokenOkResponse);

      const resetPasswordTestRequest = await waitFor(() =>
        httpTesting.expectOne(resetPasswordRequest),
      );

      resetPasswordTestRequest.flush(
        createResetPasswordErrorResponse("INTERNAL_SERVER_ERROR"),
        {
          status: 500,
          statusText: "Internal Server Error",
        },
      );

      await assertFormMessagePresent("form-unexpected-error");

      expect(submitButton).toBeDisabled();

      await fillForm(fixture, "awesomeNewPassword");

      expect(submitButton).toBeEnabled();
    });
  });

  test("should redirect to the landing page if the email code is correct", async () => {
    const { fixture, httpTesting } = await renderResetPasswordComponent(
      "test@test.com",
      "some-test-code",
    );

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");

    await fillForm(fixture);

    const submitButton = screen
      .getByTestId("submit-button")
      .querySelector("button")!;

    await user.click(submitButton);

    const checkCaptchaTokenTestRequest = await waitFor(() =>
      httpTesting.expectOne(checkCaptchaTokenRequest),
    );

    checkCaptchaTokenTestRequest.flush(checkCaptchaTokenOkResponse);

    const resetPasswordTestRequest = await waitFor(() =>
      httpTesting.expectOne(resetPasswordRequest),
    );
    resetPasswordTestRequest.flush(getSessionOkResponse);

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(["/"]);
    });

    navigateSpy.mockRestore();
  });
});

async function assertFormMessagePresent(testId: string) {
  const formMessages = [
    "bad-credentials-error",
    "captcha-failed-error",
    "form-unexpected-error",
    "email-code-expired-error",
  ];

  await expect(screen.findByTestId(testId)).resolves.toBeInTheDocument();

  const missingFormMessages = formMessages.filter(
    (message) => message !== testId,
  );

  for (const message of missingFormMessages) {
    expect(screen.queryByTestId(message)).not.toBeInTheDocument();
  }
}

async function fillForm(
  fixture: ComponentFixture<ResetPasswordComponent>,
  password = "12345678",
) {
  fixture.componentInstance.resetPasswordForm.patchValue({
    passwords: {
      password,
      passwordAgain: password,
    },
  });
  fixture.componentInstance.resetPasswordForm.markAsDirty();

  await fixture.whenStable();
}

async function renderResetPasswordComponent(
  email: string | undefined,
  code: string | undefined,
) {
  const queryParams = new URLSearchParams();
  if (email) {
    queryParams.append("email", email);
  }
  if (code) {
    queryParams.append("code", code);
  }

  const renderResult = await render(ResetPasswordComponent, {
    initialRoute: `profil/jelszo_helyreallit?${queryParams.toString()}`,
    providers: [
      provideHttpClient(withFetch()),
      provideHttpClientTesting(),
      provideRouter([
        {
          path: "profil/jelszo_helyreallit",
          component: ResetPasswordComponent,
          title: "Jelszó helyreállítása",
        },
      ]),
      provideTanStackQuery(testQueryClient),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  const captchaDebugElement = renderResult.fixture.debugElement.query(
    By.directive(RecaptchaComponent),
  );

  const captchaComponent: RecaptchaComponent | undefined =
    captchaDebugElement?.componentInstance;

  if (captchaComponent) {
    vi.spyOn(captchaComponent, "execute").mockImplementation(() =>
      captchaComponent.resolved.emit("test-captcha-token"),
    );
  }

  return {
    ...renderResult,
    httpTesting,
  };
}
