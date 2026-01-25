import { provideHttpClient, withFetch } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { expect } from "vitest";

import { testQueryClient } from "../../../mocks/testQueryClient";
import deleteProfileErrorResponse from "../../../mocks/users/deleteProfileErrorResponse.json";
import { deleteProfileRequest } from "../../../mocks/users/deleteProfileRequest";
import { sessionRequest } from "../../../mocks/users/sessionRequest";
import { ProfileComponent } from "./profile.component";

describe("Profile Component", () => {
  const user = userEvent.setup();

  beforeAll(() => {
    // @ts-ignore
    vi.spyOn(window._virtualConsole, "emit").mockImplementation(() => void 0);
  });

  describe("Delete Profile Component", () => {
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

      httpTesting.verify();
    });
  });
});

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

  await waitFor(() => httpTesting.expectOne(sessionRequest));

  return {
    ...renderResult,
    httpTesting,
  };
}
