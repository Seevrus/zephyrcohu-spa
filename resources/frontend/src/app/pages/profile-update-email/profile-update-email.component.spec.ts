import { provideHttpClient, withFetch } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";
import { within } from "@testing-library/dom";
import { type UserEvent, userEvent } from "@testing-library/user-event";
import { RecaptchaComponent } from "ng-recaptcha-2";

import checkCaptchaTokenErrorResponse from "../../../mocks/captcha/checkCaptchaTokenErrorResponse.json";
import checkCaptchaTokenOkResponse from "../../../mocks/captcha/checkCaptchaTokenOkResponse.json";
import { checkCaptchaTokenRequest } from "../../../mocks/captcha/checkCaptchaTokenRequest";
import { testQueryClient } from "../../../mocks/testQueryClient";
import { createUpdateProfileConfirmEmailErrorResponse } from "../../../mocks/users/createUpdateProfileConfirmEmailErrorResponse";
import getSessionOkResponse from "../../../mocks/users/getSessionOkResponse.json";
import { updateProfileConfirmEmailRequest } from "../../../mocks/users/updateProfileConfirmEmailRequest";
import { ProfileUpdateEmailComponent } from "./profile-update-email.component";

const TEST_EMAIL = "new@example.com";
const TEST_CODE = "1234567890abcdef";

describe("ProfileUpdateEmailComponent", () => {
  let user: UserEvent;

  beforeAll(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("should render the form correctly", () => {
    test("should show error if query params are missing", async () => {
      await renderComponent();

      await expect(
        screen.findByTestId("email-link-error"),
      ).resolves.toBeInTheDocument();
    });

    test("should render the form correctly with query params", async () => {
      await renderComponent(TEST_EMAIL, TEST_CODE);

      const emailInput = screen
        .getByTestId("new-email")
        .querySelector("input")!;

      const passwordInput = screen
        .getByTestId("password")
        .querySelector("input")!;

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button")!;

      expect(emailInput).toBeDisabled();
      expect(emailInput).toHaveValue(TEST_EMAIL);

      // The code input is not visible to the user, but its value is in the form model.
      // We can't directly test it from the DOM.

      expect(passwordInput).toBeEnabled();
      expect(passwordInput).toBeEmptyDOMElement();

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe("form validation", () => {
    test("submit button is enabled when password is valid", async () => {
      await renderComponent(TEST_EMAIL, TEST_CODE);

      const passwordInput = screen
        .getByTestId("password")
        .querySelector("input")!;

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button")!;

      await user.type(passwordInput, "ValidPassword123");

      expect(submitButton).toBeEnabled();
    });

    test("shows error for missing password", async () => {
      const { container } = await renderComponent(TEST_EMAIL, TEST_CODE);
      const passwordInput = screen
        .getByTestId("password")
        .querySelector("input")!;

      await user.click(passwordInput);
      await user.tab();

      await waitFor(() => {
        const error = container.querySelector("mat-error");

        expect(error).toHaveTextContent("Kötelező mező");
      });
    });

    test("shows error for invalid password", async () => {
      const { container } = await renderComponent(TEST_EMAIL, TEST_CODE);
      const passwordInput = screen
        .getByTestId("password")
        .querySelector("input")!;

      await user.type(passwordInput, "short");
      await user.tab();

      await waitFor(() => {
        const error = container.querySelector("mat-error");

        expect(error).toHaveTextContent("Jelszó formátuma nem megfelelő");
      });
    });

    test("password visibility can be toggled", async () => {
      await renderComponent(TEST_EMAIL, TEST_CODE);

      const passwordInput = screen
        .getByTestId("password")
        .querySelector("input")!;

      const toggleButton = screen.getByTestId("toggle-password");

      expect(passwordInput).toHaveAttribute("type", "password");

      await user.click(toggleButton);

      expect(passwordInput).toHaveAttribute("type", "text");
    });
  });

  describe("API error messages", () => {
    test("in the case of a captcha error", async () => {
      const { httpTesting } = await submitWithPassword();

      const checkCaptchaTokenTestRequest = await waitFor(() =>
        httpTesting.expectOne(checkCaptchaTokenRequest),
      );

      checkCaptchaTokenTestRequest.flush(checkCaptchaTokenErrorResponse);

      await assertFormMessagePresent("captcha-failed-error");

      httpTesting.verify();
    });

    test("BAD_CREDENTIALS - new email or code is not found by the server", async () => {
      const { httpTesting } = await submitWithPassword();

      const checkCaptchaTokenTestRequest = await waitFor(() =>
        httpTesting.expectOne(checkCaptchaTokenRequest),
      );

      checkCaptchaTokenTestRequest.flush(checkCaptchaTokenOkResponse);

      const updateProfileConfirmEmailTestRequest = await waitFor(() =>
        httpTesting.expectOne(updateProfileConfirmEmailRequest),
      );

      updateProfileConfirmEmailTestRequest.flush(
        createUpdateProfileConfirmEmailErrorResponse("BAD_CREDENTIALS"),
        {
          status: 400,
          statusText: "Bad Request",
        },
      );

      await assertFormMessagePresent("bad-credentials-error");

      httpTesting.verify();
    });

    test("handles BAD_EMAIL_CODE error", async () => {
      const { httpTesting } = await submitWithPassword();

      const checkCaptchaTokenTestRequest = await waitFor(() =>
        httpTesting.expectOne(checkCaptchaTokenRequest),
      );

      checkCaptchaTokenTestRequest.flush(checkCaptchaTokenOkResponse);

      const updateProfileConfirmEmailTestRequest = await waitFor(() =>
        httpTesting.expectOne(updateProfileConfirmEmailRequest),
      );

      updateProfileConfirmEmailTestRequest.flush(
        createUpdateProfileConfirmEmailErrorResponse("BAD_EMAIL_CODE"),
        {
          status: 400,
          statusText: "Bad Request",
        },
      );

      await assertFormMessagePresent("bad-credentials-error");

      httpTesting.verify();
    });

    test("handles CODE_EXPIRED error", async () => {
      const { httpTesting } = await submitWithPassword();

      const checkCaptchaTokenTestRequest = await waitFor(() =>
        httpTesting.expectOne(checkCaptchaTokenRequest),
      );

      checkCaptchaTokenTestRequest.flush(checkCaptchaTokenOkResponse);

      const updateProfileConfirmEmailTestRequest = await waitFor(() =>
        httpTesting.expectOne(updateProfileConfirmEmailRequest),
      );

      updateProfileConfirmEmailTestRequest.flush(
        createUpdateProfileConfirmEmailErrorResponse("CODE_EXPIRED"),
        {
          status: 410,
          statusText: "Gone",
        },
      );

      await assertFormMessagePresent("email-code-expired-error");

      httpTesting.verify();
    });

    test("handles unexpected submission errors", async () => {
      const { httpTesting } = await submitWithPassword();

      const checkCaptchaTokenTestRequest = await waitFor(() =>
        httpTesting.expectOne(checkCaptchaTokenRequest),
      );

      checkCaptchaTokenTestRequest.flush(checkCaptchaTokenOkResponse);

      const updateProfileConfirmEmailTestRequest = await waitFor(() =>
        httpTesting.expectOne(updateProfileConfirmEmailRequest),
      );

      updateProfileConfirmEmailTestRequest.flush(
        createUpdateProfileConfirmEmailErrorResponse("INTERNAL_SERVER_ERROR"),
        {
          status: 500,
          statusText: "Internal Server Error",
        },
      );

      await assertFormMessagePresent("form-unexpected-error");

      httpTesting.verify();
    });
  });

  test("successful submission shows success message and resets form", async () => {
    const { httpTesting } = await submitWithPassword();

    const checkCaptchaTokenTestRequest = await waitFor(() =>
      httpTesting.expectOne(checkCaptchaTokenRequest),
    );

    checkCaptchaTokenTestRequest.flush(checkCaptchaTokenOkResponse);

    const updateProfileConfirmEmailTestRequest = await waitFor(() =>
      httpTesting.expectOne(updateProfileConfirmEmailRequest),
    );

    updateProfileConfirmEmailTestRequest.flush(getSessionOkResponse);

    await assertFormMessagePresent("profile-email-updated");

    expect(
      within(screen.getByTestId("profile-email-updated")).getByTestId(
        "zephyr-success-card-content",
      ),
    ).toHaveTextContent(
      `A(z) ${TEST_EMAIL} e-mail címet aktiváltuk adatbázisunkban. A következő bejelentkezéskor már ezt az új címet kell használnia. Régi e-mail címét töröltük.`,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("password").querySelector("input")!,
      ).toBeEmptyDOMElement();
    });

    const submitButton = screen
      .getByTestId("submit-button")
      .querySelector("button")!;

    expect(submitButton).toBeDisabled();

    httpTesting.verify();
  });
});

async function assertFormMessagePresent(testId: string) {
  const formMessages = [
    "bad-credentials-error",
    "captcha-failed-error",
    "email-code-expired-error",
    "email-link-error",
    "form-unexpected-error",
    "profile-email-updated",
  ];

  await expect(screen.findByTestId(testId)).resolves.toBeInTheDocument();

  const missingFormMessages = formMessages.filter(
    (message) => message !== testId,
  );

  for (const message of missingFormMessages) {
    expect(screen.queryByTestId(message)).not.toBeInTheDocument();
  }
}

async function renderComponent(email?: string, code?: string) {
  const queryParams = new URLSearchParams();
  if (email) {
    queryParams.append("email", email);
  }
  if (code) {
    queryParams.append("code", code);
  }

  const renderResult = await render(ProfileUpdateEmailComponent, {
    initialRoute: `/profil/email_frissit?${queryParams.toString()}`,
    providers: [
      provideHttpClient(withFetch()),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter([
        {
          path: "profil/email_frissit",
          component: ProfileUpdateEmailComponent,
          title: "Email cím megerősítése",
        },
      ]),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  const captchaDebugElement = renderResult.fixture.debugElement.query(
    By.directive(RecaptchaComponent),
  );

  const captchaComponent: RecaptchaComponent =
    captchaDebugElement.componentInstance;

  vi.spyOn(captchaComponent, "execute").mockImplementation(() =>
    captchaComponent.resolved.emit("test-captcha-token"),
  );

  return {
    ...renderResult,
    httpTesting,
  };
}

async function submitWithPassword() {
  const { httpTesting, fixture } = await renderComponent(TEST_EMAIL, TEST_CODE);

  const passwordInput = screen.getByTestId("password").querySelector("input")!;

  const submitButton = screen
    .getByTestId("submit-button")
    .querySelector("button")!;

  await userEvent.type(passwordInput, "any_valid_password");
  await userEvent.click(submitButton);

  return { fixture, httpTesting };
}
