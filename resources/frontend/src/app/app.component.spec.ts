import { provideHttpClient, withFetch } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideLocationMocks } from "@angular/common/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";

import { testQueryClient } from "../mocks/testQueryClient";
import getSessionErrorResponse from "../mocks/users/getSessionErrorResponse.json";
import getSessionOkResponse from "../mocks/users/getSessionOkResponse.json";
import { sessionRequest } from "../mocks/users/sessionRequest";
import { AppComponent } from "./app.component";
import { routes } from "./app.routes";

describe("App Component", () => {
  test("should render header and footer", async () => {
    const { renderResult } = renderAppComponent("/");
    const { container } = await renderResult;

    const footer = container.querySelector(".footer-main");

    expect(footer).toBeInTheDocument();

    const header = container.querySelector(".header-main");

    expect(header).toBeInTheDocument();
  });

  test("should render the Main Component initially", async () => {
    renderAppComponent("/");

    await expect(
      screen.findByTestId("main-component"),
    ).resolves.toBeInTheDocument();
  });

  describe("Login Component", () => {
    test("redirects to the main page if the user is already logged in", async () => {
      const { httpTesting } = renderAppComponent("/bejelentkezes");

      const request = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );
      request.flush(getSessionOkResponse);

      await expect(
        screen.findByTestId("main-component"),
      ).resolves.toBeInTheDocument();
    });

    test("renders the Login Component", async () => {
      const { httpTesting } = renderAppComponent("/bejelentkezes");

      const request = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );
      request.flush(getSessionErrorResponse);

      await expect(
        screen.findByTestId("login-component"),
      ).resolves.toBeInTheDocument();
    });
  });

  describe("Forgot Password Component", () => {
    test("redirects to the main page if the user is already logged in", async () => {
      const { httpTesting } = renderAppComponent("/profil/elfelejtett_jelszo");

      const request = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );
      request.flush(getSessionOkResponse);

      await expect(
        screen.findByTestId("main-component"),
      ).resolves.toBeInTheDocument();
    });

    test("renders the Forgot Password Component", async () => {
      const { httpTesting } = renderAppComponent("/profil/elfelejtett_jelszo");

      const request = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );
      request.flush(getSessionErrorResponse);

      await expect(
        screen.findByTestId("forgot-password-component"),
      ).resolves.toBeInTheDocument();
    });
  });

  describe("Reset Password Component", () => {
    test("redirects to the main page if the user is already logged in", async () => {
      const { httpTesting } = renderAppComponent("/profil/jelszo_helyreallit");

      const request = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );
      request.flush(getSessionOkResponse);

      await expect(
        screen.findByTestId("main-component"),
      ).resolves.toBeInTheDocument();
    });

    test("renders the Reset Password Component", async () => {
      const { httpTesting } = renderAppComponent("/profil/jelszo_helyreallit");

      const request = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );
      request.flush(getSessionErrorResponse);

      await expect(
        screen.findByTestId("reset-password-component"),
      ).resolves.toBeInTheDocument();
    });
  });

  describe("registration", () => {
    test("redirects to the main page if the user is already logged in", async () => {
      const { httpTesting } = renderAppComponent("/regisztracio");

      const request = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );
      request.flush(getSessionOkResponse);

      await expect(
        screen.findByTestId("main-component"),
      ).resolves.toBeInTheDocument();
    });

    test("renders the registration form", async () => {
      const { httpTesting } = renderAppComponent("/regisztracio");

      const request = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );
      request.flush(getSessionErrorResponse);

      await expect(
        screen.findByTestId("register-component"),
      ).resolves.toBeInTheDocument();
    });

    test("redirects to the main page if a logged in user tries to decline registration", async () => {
      const { httpTesting } = renderAppComponent("/regisztracio/elvet");

      const request = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );
      request.flush(getSessionOkResponse);

      await expect(
        screen.findByTestId("main-component"),
      ).resolves.toBeInTheDocument();
    });

    test("renders the decline registration form", async () => {
      const { httpTesting } = renderAppComponent("/regisztracio/elvet");

      const request = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );
      request.flush(getSessionErrorResponse);

      await expect(
        screen.findByTestId("register-mail-decline-component"),
      ).resolves.toBeInTheDocument();
    });

    test("redirects to the main page if a logged in user tries to accept registration", async () => {
      const { httpTesting } = renderAppComponent("/regisztracio/megerosit");

      const request = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );
      request.flush(getSessionOkResponse);

      await expect(
        screen.findByTestId("main-component"),
      ).resolves.toBeInTheDocument();
    });

    test("renders the accept registration form", async () => {
      const { httpTesting } = renderAppComponent("/regisztracio/megerosit");

      const request = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );
      request.flush(getSessionErrorResponse);

      await expect(
        screen.findByTestId("register-mail-accept-component"),
      ).resolves.toBeInTheDocument();
    });
  });
});

function renderAppComponent(initialRoute: string) {
  testQueryClient.clear();

  const renderResult = render(AppComponent, {
    initialRoute,
    providers: [
      provideHttpClient(withFetch()),
      provideTanStackQuery(testQueryClient),
      provideHttpClientTesting(),
      provideRouter(routes),
      provideLocationMocks(),
      provideZonelessChangeDetection(),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    renderResult,
    httpTesting,
  };
}
