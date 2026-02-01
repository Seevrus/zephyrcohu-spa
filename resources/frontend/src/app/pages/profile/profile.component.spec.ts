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
import { createUpdateProfileOkResponse } from "../../../mocks/users/createUpdateProfileOkResponse";
import deleteProfileErrorResponse from "../../../mocks/users/deleteProfileErrorResponse.json";
import { deleteProfileRequest } from "../../../mocks/users/deleteProfileRequest";
import getSessionOkResponse from "../../../mocks/users/getSessionOkResponse.json";
import { sessionRequest } from "../../../mocks/users/sessionRequest";
import updateProfileErrorResponse from "../../../mocks/users/updateProfileErrorResponse.json";
import { updateProfileRequest } from "../../../mocks/users/updateProfileRequest";
import { ProfileComponent } from "./profile.component";

describe("Profile Component", () => {
  const user = userEvent.setup();

  describe("Update Profile Component", () => {
    describe("should render the form correctly", () => {
      test("text fields", async () => {
        const { fixture } = await renderProfileComponent();

        const emailField = screen.getByTestId("email");

        expect(emailField.querySelector("label")).toHaveTextContent(
          "Email cím",
        );
        expect(emailField.querySelector("input")?.type).toBe("text");

        await waitFor(() => {
          // The actual value is not in the input, so we have to check the form
          expect(fixture.componentInstance.newEmail?.value).toBe(
            "example@test.com",
          );
        });

        expect(screen.getByTestId("passwords-container")).toBeInTheDocument();
      });

      test("newsletter checkbox", async () => {
        const { container } = await renderProfileComponent();

        const newsletterCheckboxContainer = container.querySelector(
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

        await waitFor(() => {
          expect(newsletterCheckbox).toBeChecked();
        });
      });
    });

    describe("should validate the form correctly", () => {
      test("submit button is initially disabled", async () => {
        await renderProfileComponent();

        const submitButton = screen
          .getByTestId("update-submit-button")
          .querySelector("button");

        await waitFor(() => {
          expect(submitButton).toBeDisabled();
        });
      });

      test("validates email correctly", async () => {
        const { container, fixture } = await renderProfileComponent();

        const emailInput = screen.getByTestId("email").querySelector("input")!;

        await user.click(emailInput);
        await fillUpdateForm(fixture, { email: "invalid-email" });
        await user.tab();

        await waitFor(() => {
          expect(container.querySelector("mat-error")).toHaveTextContent(
            "Email cím formátuma nem megfelelő",
          );
        });

        await user.click(emailInput);
        await fillUpdateForm(fixture, { email: "" });
        await user.tab();

        await waitFor(() => {
          expect(container.querySelector("mat-error")).not.toBeInTheDocument();
        });
      });

      test("validates password correctly", async () => {
        const { container } = await renderProfileComponent();

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

        expect(container.querySelector("mat-error")).not.toBeInTheDocument();
      });

      test("shows an error if passwords don't match", async () => {
        const { container } = await renderProfileComponent();

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
        const { fixture } = await renderProfileComponent();

        const emailInput = screen.getByTestId("email").querySelector("input")!;

        const submitButton = screen
          .getByTestId("update-submit-button")
          .querySelector("button");

        expect(submitButton).toBeDisabled();

        await user.click(emailInput);
        await fillUpdateForm(fixture, { email: "newemail@example.com" });
        await user.tab();

        expect(submitButton).toBeEnabled();
      });
    });

    test("should show the correct error message in the case of a server error", async () => {
      const { fixture, httpTesting } = await renderProfileComponent();

      const emailInput = screen.getByTestId("email").querySelector("input")!;

      const submitButton = screen
        .getByTestId("update-submit-button")
        .querySelector("button")!;

      await user.click(emailInput);
      await fillUpdateForm(fixture);
      await user.tab();
      await user.click(submitButton);

      const request = await waitFor(() =>
        httpTesting.expectOne(updateProfileRequest),
      );

      request.flush(updateProfileErrorResponse, {
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(
        screen.findByTestId("form-unexpected-error"),
      ).resolves.toBeInTheDocument();

      httpTesting.verify();
    });

    test("should show the correct success message", async () => {
      const { fixture, httpTesting } = await renderProfileComponent();

      const emailInput = screen.getByTestId("email").querySelector("input")!;

      const submitButton = screen
        .getByTestId("update-submit-button")
        .querySelector("button")!;

      await user.click(emailInput);
      await fillUpdateForm(fixture);
      await user.tab();
      await user.click(submitButton);

      const request = await waitFor(() =>
        httpTesting.expectOne(updateProfileRequest),
      );

      request.flush(
        createUpdateProfileOkResponse({
          email: "abc123@gmail.com",
          newsletter: false,
        }),
      );

      const sessionTestRequest = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );

      sessionTestRequest.flush(getSessionOkResponse);

      await waitFor(() => {
        expect(screen.getByTestId("profile-updated-card")).toHaveTextContent(
          "Adatmódosítás sikeres Új email cím: abc123@gmail.com. Jelenleg még a korábbi email címe szerepel az adatbázisunkban. Új email címére elküldtük az aktiváláshoz szükséges emailt, mellyel bármikor aktiválhatja az új e-mail címét. Fontos: Amennyiben nem kapta meg, kérjük ellenőrizze levélfiókjának Spam (levélszemét) mappáját, mert egyes levelezőrendszerek levélszemétnek minősíthetik a honlap rendszeréből küldött üzeneteket! Sikeresen megváltoztatta jelszavát! A következő bejelentkezéskor már ezt az új jelszót kell használnia. Sikeresen leiratkozott hírlevelünkről.",
        );
      });

      httpTesting.verify();
    });
  });

  describe("Delete Profile Component", () => {
    beforeAll(() => {
      // @ts-expect-error: https://github.com/jsdom/jsdom/issues/1937
      vi.spyOn(window._virtualConsole, "emit").mockImplementation(() => void 0);
    });

    afterAll(() => {
      vi.restoreAllMocks();
    });

    describe("should render the form correctly", () => {
      test("checkbox are displayed correctly", async () => {
        await renderProfileComponent();

        const checkboxContainer = screen.getByTestId("delete-confirm-checkbox");
        const label = checkboxContainer.querySelector("label");

        expect(label).toHaveTextContent(
          "Igen, törölni szeretném regisztrációmat.",
        );
      });

      test("submit button is displayed correctly", async () => {
        await renderProfileComponent();

        const submitButton = screen
          .getByTestId("delete-submit-button")
          .querySelector("button");

        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent("Regisztráció törlése");
      });
    });

    test("submit button is disabled if the checkbox is not selected", async () => {
      await renderProfileComponent();

      const checkbox = screen
        .getByTestId("delete-confirm-checkbox")
        .querySelector("input")!;

      const submitButton = screen
        .getByTestId("delete-submit-button")
        .querySelector("button");

      await user.click(checkbox);

      expect(submitButton).toBeEnabled();

      await user.click(checkbox);

      expect(submitButton).toBeDisabled();
    });

    test("should show the correct error message in the case of a server error", async () => {
      const { httpTesting } = await renderProfileComponent();

      const checkbox = screen
        .getByTestId("delete-confirm-checkbox")
        .querySelector("input")!;

      const submitButton = screen
        .getByTestId("delete-submit-button")
        .querySelector("button")!;

      await user.click(checkbox);
      await user.click(submitButton);

      const request = await waitFor(() =>
        httpTesting.expectOne(deleteProfileRequest),
      );

      request.flush(deleteProfileErrorResponse, {
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(
        screen.findByTestId("form-unexpected-error"),
      ).resolves.toBeInTheDocument();

      httpTesting.verify();
    });

    test("should navigate to home on successful profile delete", async () => {
      const { httpTesting } = await renderProfileComponent();

      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, "navigate");

      const checkbox = screen
        .getByTestId("delete-confirm-checkbox")
        .querySelector("input")!;

      const submitButton = screen
        .getByTestId("delete-submit-button")
        .querySelector("button")!;

      await user.click(checkbox);
      await user.click(submitButton);

      const request = await waitFor(() =>
        httpTesting.expectOne(deleteProfileRequest),
      );

      request.flush(null, {
        status: 204,
        statusText: "No Content",
      });

      await waitFor(() => {
        expect(navigateSpy).toHaveBeenCalledWith(["/"]);
      });

      navigateSpy.mockRestore();

      await waitFor(() => httpTesting.expectOne(sessionRequest));

      httpTesting.verify();
    });
  });
});

async function fillUpdateForm(
  fixture: ComponentFixture<ProfileComponent>,
  {
    email = "abc123@gmail.com",
    password = "someLongPassword",
    passwordAgain,
    newsletter = false,
  }: Partial<{
    email: string;
    password: string;
    passwordAgain: string;
    newsletter: boolean;
  }> = {},
) {
  fixture.componentInstance.updateProfileForm.setValue({
    email,
    passwords: {
      password,
      passwordAgain: passwordAgain ?? password,
    },
    newsletter,
  });
  fixture.componentInstance.updateProfileForm.markAsDirty();

  await fixture.whenStable();
}

async function renderProfileComponent() {
  const renderResult = await render(ProfileComponent, {
    initialRoute: "/profil",
    providers: [
      provideHttpClient(withFetch()),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideRouter([
        {
          path: "profil",
          component: ProfileComponent,
          title: "Adatmódosítás",
        },
      ]),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  const sessionTestRequest = await waitFor(() =>
    httpTesting.expectOne(sessionRequest),
  );

  sessionTestRequest.flush(getSessionOkResponse);

  return {
    ...renderResult,
    httpTesting,
  };
}
