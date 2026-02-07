import { provideHttpClient, withFetch } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";
import { type UserEvent, userEvent } from "@testing-library/user-event";
import { RecaptchaComponent } from "ng-recaptcha-2";

import checkCaptchaTokenErrorResponse from "../../../mocks/captcha/checkCaptchaTokenErrorResponse.json";
import checkCaptchaTokenOkResponse from "../../../mocks/captcha/checkCaptchaTokenOkResponse.json";
import { checkCaptchaTokenRequest } from "../../../mocks/captcha/checkCaptchaTokenRequest";
import { testQueryClient } from "../../../mocks/testQueryClient";
import { createPostResendConfirmEmailErrorResponse } from "../../../mocks/users/createPostResendConfirmEmailErrorResponse";
import { createRegisterErrorResponse } from "../../../mocks/users/createRegisterErrorResponse";
import getSessionOkResponse from "../../../mocks/users/getSessionOkResponse.json";
import { registerRequest } from "../../../mocks/users/registerRequest";
import { resendConfirmationEmailRequest } from "../../../mocks/users/resendConfirmationEmailRequest";
import { RegisterComponent } from "./register.component";

describe("Register Component", () => {
  let http: HttpTestingController;
  let registerContainer: HTMLElement;
  let registerFixture: ComponentFixture<RegisterComponent>;
  let user: UserEvent;

  beforeAll(() => {
    user = userEvent.setup();
  });

  beforeEach(async () => {
    const { container, fixture, httpTesting } = await renderRegisterComponent();

    http = httpTesting;
    registerContainer = container;
    registerFixture = fixture;

    const captchaDebugElement = fixture.debugElement.query(
      By.directive(RecaptchaComponent),
    );

    const captchaComponent: RecaptchaComponent =
      captchaDebugElement.componentInstance;

    vi.spyOn(captchaComponent, "execute").mockImplementation(() =>
      captchaComponent.resolved.emit("test-captcha-token"),
    );
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe("should render the form correctly", () => {
    test("text fields", () => {
      const emailField = screen.getByTestId("email");

      expect(emailField.querySelector("label")).toHaveTextContent("Email cím");
      expect(emailField.querySelector("input")?.type).toBe("text");

      expect(screen.getByTestId("passwords-container")).toBeInTheDocument();
    });

    test("newsletter checkbox is displayed correctly", () => {
      const newsletterCheckboxContainer = registerContainer.querySelector(
        "[formcontrolname='newsletter']",
      );

      const newsletterCheckboxLabel =
        newsletterCheckboxContainer?.querySelector("label");

      expect(newsletterCheckboxLabel).toHaveTextContent(
        "Szeretnék hírlevelet kapni a fontosabb újdonságokról.",
      );

      const newsletterCheckbox =
        newsletterCheckboxContainer?.querySelector<HTMLInputElement>(
          "input[type='checkbox']",
        );

      expect(newsletterCheckbox).not.toBeChecked();
    });
  });

  describe("should validate the form correctly", () => {
    test("validates email correctly", async () => {
      const emailInput = screen.getByTestId("email").querySelector("input")!;

      await user.type(emailInput, "invalid-email");
      await user.tab();

      expect(registerContainer.querySelector("mat-error")).toHaveTextContent(
        "Email cím formátuma nem megfelelő",
      );

      await user.clear(emailInput);
      await user.tab();

      expect(registerContainer.querySelector("mat-error")).toHaveTextContent(
        "Kötelező mező",
      );
    });

    test("validates password correctly", async () => {
      const passwordInput = screen
        .getByTestId("password")
        .querySelector("input")!;

      await user.type(passwordInput, "12");
      await user.tab();

      expect(registerContainer.querySelector("mat-error")).toHaveTextContent(
        "Jelszó formátuma nem megfelelő",
      );

      await user.clear(passwordInput);
      await user.tab();

      expect(registerContainer.querySelector("mat-error")).toHaveTextContent(
        "Kötelező mező",
      );
    });

    test("shows an error if passwords don't match", async () => {
      const passwordInput = screen
        .getByTestId("password")
        .querySelector("input")!;

      const passwordAgainInput = screen
        .getByTestId("password-again")
        .querySelector("input")!;

      await user.type(passwordInput, "weakpass");
      await user.type(passwordAgainInput, "strongpass");
      await user.tab();

      expect(
        registerContainer.querySelector(".custom-error"),
      ).toHaveTextContent("A beírt jelszavak nem egyeznek meg");
    });

    test("can submit if the form is valid", async () => {
      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button");

      expect(submitButton).toBeDisabled();

      await fillForm(registerFixture);

      expect(submitButton).toBeEnabled();
    });
  });

  describe("should show the correct API error messages", () => {
    let submitButton: HTMLButtonElement;

    beforeEach(async () => {
      await fillForm(registerFixture);

      submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button")!;

      await user.click(submitButton);
    });

    test("in the case of a captcha error", async () => {
      const checkCaptchaTokenTestRequest = await waitFor(() =>
        http.expectOne(checkCaptchaTokenRequest),
      );

      checkCaptchaTokenTestRequest.flush(checkCaptchaTokenErrorResponse);

      await assertFormMessagePresent("captcha-failed-error");

      http.verify();
    });

    test("if the user already exists", async () => {
      const checkCaptchaTokenTestRequest = await waitFor(() =>
        http.expectOne(checkCaptchaTokenRequest),
      );

      checkCaptchaTokenTestRequest.flush(checkCaptchaTokenOkResponse);

      const registerTestRequest = await waitFor(() =>
        http.expectOne(registerRequest),
      );

      registerTestRequest.flush(createRegisterErrorResponse("USER_EXISTS"), {
        status: 409,
        statusText: "Conflict",
      });

      await assertFormMessagePresent("register-already-exists");

      http.verify();
    });

    test("if the user is not confirmed", async () => {
      const checkCaptchaTokenTestRequest = await waitFor(() =>
        http.expectOne(checkCaptchaTokenRequest),
      );

      checkCaptchaTokenTestRequest.flush(checkCaptchaTokenOkResponse);

      const registerTestRequest = await waitFor(() =>
        http.expectOne(registerRequest),
      );

      registerTestRequest.flush(
        createRegisterErrorResponse("USER_NOT_CONFIRMED"),
        {
          status: 409,
          statusText: "Conflict",
        },
      );

      await assertFormMessagePresent("register-exists-not-confirmed");

      http.verify();
    });

    test("in the case of an unknown error", async () => {
      const checkCaptchaTokenTestRequest = await waitFor(() =>
        http.expectOne(checkCaptchaTokenRequest),
      );

      checkCaptchaTokenTestRequest.flush(checkCaptchaTokenOkResponse);

      const registerTestRequest = await waitFor(() =>
        http.expectOne(registerRequest),
      );

      registerTestRequest.flush(
        createRegisterErrorResponse("INTERNAL_SERVER_ERROR"),
        {
          status: 500,
          statusText: "Internal Server Error",
        },
      );

      await assertFormMessagePresent("form-unexpected-error");

      http.verify();
    });

    test("submit button is disabled until the user modifies something", async () => {
      const checkCaptchaTokenTestRequest = await waitFor(() =>
        http.expectOne(checkCaptchaTokenRequest),
      );

      checkCaptchaTokenTestRequest.flush(checkCaptchaTokenOkResponse);

      const registerTestRequest = await waitFor(() =>
        http.expectOne(registerRequest),
      );

      registerTestRequest.flush(
        createRegisterErrorResponse("INTERNAL_SERVER_ERROR"),
        {
          status: 500,
          statusText: "Internal Server Error",
        },
      );

      await expect(
        screen.findByTestId("form-unexpected-error"),
      ).resolves.toBeInTheDocument();

      expect(submitButton).toBeDisabled();

      await fillForm(registerFixture, { email: "abc124@gmail.com" });

      expect(submitButton).toBeEnabled();

      http.verify();
    });
  });

  test("should show the correct API success message", async () => {
    await fillForm(registerFixture);

    const submitButton = screen
      .getByTestId("submit-button")
      .querySelector("button")!;

    await user.click(submitButton);

    const checkCaptchaTokenTestRequest = await waitFor(() =>
      http.expectOne(checkCaptchaTokenRequest),
    );

    checkCaptchaTokenTestRequest.flush(checkCaptchaTokenOkResponse);

    const registerTestRequest = await waitFor(() =>
      http.expectOne(registerRequest),
    );

    registerTestRequest.flush(getSessionOkResponse);

    await assertFormMessagePresent("register-success");

    http.verify();
  });

  test("should show the correct error message when resending the confirmation email fails", async () => {
    await fillForm(registerFixture);
    registerFixture.componentInstance.registerErrorMessage.set(
      "USER_NOT_CONFIRMED",
    );

    const resendLink = await screen.findByTestId(
      "resend-confirmation-email-link",
    );

    await user.click(resendLink);

    const resendConfirmEmailRequest = await waitFor(() =>
      http.expectOne(resendConfirmationEmailRequest),
    );

    resendConfirmEmailRequest.flush(
      createPostResendConfirmEmailErrorResponse("INTERNAL_SERVER_ERROR"),
      {
        status: 500,
        statusText: "Internal Server Error",
      },
    );

    await assertFormMessagePresent("register-resend-email-error");

    http.verify();
  });

  test("should show the correct success message when resending the confirmation email succeeds", async () => {
    await fillForm(registerFixture);

    registerFixture.componentInstance.registerErrorMessage.set(
      "USER_NOT_CONFIRMED",
    );

    const resendLink = await screen.findByTestId(
      "resend-confirmation-email-link",
    );

    await user.click(resendLink);

    const resendConfirmEmailRequest = await waitFor(() =>
      http.expectOne(resendConfirmationEmailRequest),
    );

    resendConfirmEmailRequest.flush(null);

    await assertFormMessagePresent("register-resend-email-success");

    http.verify();
  });
});

async function assertFormMessagePresent(testId: string) {
  const formMessages = [
    "captcha-failed-error",
    "form-unexpected-error",
    "register-already-exists",
    "register-exists-not-confirmed",
    "register-resend-email-error",
    "register-resend-email-success",
    "register-success",
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
  fixture: ComponentFixture<RegisterComponent>,
  overrides: Partial<{ email: string }> = {},
) {
  fixture.componentInstance.registerForm.setValue({
    email: overrides.email ?? "abc123@gmail.com",
    passwords: {
      password: "12345678",
      passwordAgain: "12345678",
    },
    newsletter: false,
  });
  fixture.componentInstance.registerForm.markAsDirty();

  await fixture.whenStable();
}

async function renderRegisterComponent() {
  const renderResult = await render(RegisterComponent, {
    providers: [
      provideHttpClient(withFetch()),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
