import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideLocationMocks } from "@angular/common/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter, withComponentInputBinding } from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { CookieService } from "ngx-cookie-service";
import { describe } from "vitest";

import { testQueryClient } from "../mocks/testQueryClient";
import { createGetSessionOkResponse } from "../mocks/users/createGetSessionOkResponse";
import getSessionErrorResponse from "../mocks/users/getSessionErrorResponse.json";
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

  describe("Cookie consent", () => {
    const user = userEvent.setup();

    test("should render initially", async () => {
      const { renderResult } = renderAppComponent("/");
      await renderResult;

      await waitFor(() => {
        expect(screen.getByTestId("cookie-consent-card")).toBeInTheDocument();
      });
    });

    test("clicking on the accept button removes the cookie consent card", async () => {
      const { renderResult } = renderAppComponent("/");
      await renderResult;

      const acceptButton = screen.getByTestId("accept-cookies-button");

      await user.click(acceptButton);

      await waitFor(() => {
        expect(
          screen.queryByTestId("cookie-consent-card"),
        ).not.toBeInTheDocument();
      });
    });

    test("does not render the card if already accepted", async () => {
      const { renderResult } = renderAppComponent("/");

      const cookieService = TestBed.inject(CookieService);
      cookieService.set("zephyr-cookies-accepted", "true");

      await renderResult;

      expect(
        screen.queryByTestId("cookie-consent-card"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Login Component", () => {
    test("redirects to the main page if the user is already logged in", async () => {
      const { httpTesting } = renderAppComponent("/bejelentkezes");

      const request = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );
      request.flush(createGetSessionOkResponse());

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

  describe("Integra Component", () => {
    test.each([
      "tajekoztato",
      "probaverzio",
      "dokumentacio",
      "programfrissites",
      "egyeb",
    ])(
      "renders the Integra Component for the %s category",
      async (kategoria) => {
        renderAppComponent(`/integra/${kategoria}`);

        await expect(
          screen.findByTestId("integra-component", undefined, {
            timeout: 30_000,
          }),
        ).resolves.toBeInTheDocument();
      },
      30_000,
    );

    test("redirects to the main page for an unknown category", async () => {
      renderAppComponent("/integra/nemletezik");

      await expect(
        screen.findByTestId("main-component"),
      ).resolves.toBeInTheDocument();
    });
  });

  describe("News and Knowledgebase", () => {
    test.each([
      { path: "/hirek", testId: "news-component" },
      { path: "/hirek/6", testId: "news-article" },
      { path: "/tudasbazis/cikkek", testId: "knowledgebase-component" },
      { path: "/tudasbazis/cikkek/6", testId: "knowledgebase-article" },
      { path: "/tudasbazis/linkek", testId: "links-component" },
    ])("renders the $testId for $path", async ({ path, testId }) => {
      const { renderResult } = renderAppComponent(path);
      await renderResult;

      await expect(screen.findByTestId(testId)).resolves.toBeInTheDocument();
    });
  });

  describe("Forgot Password Component", () => {
    test("redirects to the main page if the user is already logged in", async () => {
      const { httpTesting } = renderAppComponent("/profil/elfelejtett_jelszo");

      const request = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );
      request.flush(createGetSessionOkResponse());

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

  describe("Profile Component", () => {
    test("redirects to a guard page if the user is not logged in", async () => {
      const { httpTesting } = renderAppComponent("/profil");

      const request = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );
      request.flush(getSessionErrorResponse);

      await expect(
        screen.findByTestId("registered-only-component"),
      ).resolves.toBeInTheDocument();
    });

    test("renders the profile update forms", async () => {
      const { httpTesting } = renderAppComponent("/profil");

      const request = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );
      request.flush(createGetSessionOkResponse());

      await expect(
        screen.findByTestId("profile-component"),
      ).resolves.toBeInTheDocument();
    });
  });

  test("renders the profile update / email confirm component", async () => {
    renderAppComponent("profil/email_frissit");

    await expect(
      screen.findByTestId("profile-update-email-component"),
    ).resolves.toBeInTheDocument();
  });

  describe("Reset Password Component", () => {
    test("redirects to the main page if the user is already logged in", async () => {
      const { httpTesting } = renderAppComponent("/profil/jelszo_helyreallit");

      const request = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );
      request.flush(createGetSessionOkResponse());

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

  describe("Register Component", () => {
    test.each([
      { path: "/regisztracio", label: "registration" },
      { path: "/regisztracio/elvet", label: "decline registration" },
      { path: "/regisztracio/megerosit", label: "accept registration" },
    ])(
      "redirects to the main page if a logged in user tries to reach $label",
      async ({ path }) => {
        const { httpTesting } = renderAppComponent(path);

        const request = await waitFor(() =>
          httpTesting.expectOne(sessionRequest),
        );
        request.flush(createGetSessionOkResponse());

        await expect(
          screen.findByTestId("main-component"),
        ).resolves.toBeInTheDocument();
      },
    );

    test.each([
      { path: "/regisztracio", testId: "register-component" },
      {
        path: "/regisztracio/elvet",
        testId: "register-mail-decline-component",
      },
      {
        path: "/regisztracio/megerosit",
        testId: "register-mail-accept-component",
      },
    ])("renders the $testId for $path", async ({ path, testId }) => {
      const { httpTesting } = renderAppComponent(path);

      const request = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );
      request.flush(getSessionErrorResponse);

      await expect(screen.findByTestId(testId)).resolves.toBeInTheDocument();
    });
  });

  test("renders the Request Quote Component", async () => {
    const { renderResult } = renderAppComponent("/arajanlat_kerese");
    await renderResult;

    await expect(
      screen.findByTestId("request-quote-component"),
    ).resolves.toBeInTheDocument();
  });

  describe("Footer links", () => {
    test.each([
      { path: "/kapcsolat", testId: "contact-us-component" },
      { path: "/honlapterkep", testId: "sitemap-component" },
      { path: "/adatvedelmi_tajekoztato", testId: "privacy-policy-component" },
    ])("renders the $testId for $path", async ({ path, testId }) => {
      const { renderResult } = renderAppComponent(path);
      await renderResult;

      await expect(screen.findByTestId(testId)).resolves.toBeInTheDocument();
    });
  });

  test("Not Found Component is rendered on nonexistent routes", async () => {
    renderAppComponent("/psps");

    await expect(
      screen.findByTestId("not-found-component"),
    ).resolves.toBeInTheDocument();
  });

  describe("Admin routes", () => {
    test("renders the Admin Home Component for an admin", async () => {
      const { httpTesting } = renderAppComponent("/admin");

      const request = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );
      request.flush(createGetSessionOkResponse({ isAdmin: true }));

      await expect(
        screen.findByTestId("admin-home-component"),
      ).resolves.toBeInTheDocument();
    });

    test("renders the Not Found Component for a non-admin", async () => {
      const { httpTesting } = renderAppComponent("/admin");

      const request = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );
      request.flush(createGetSessionOkResponse());

      await expect(
        screen.findByTestId("not-found-component"),
      ).resolves.toBeInTheDocument();
    });

    test("renders the Not Found Component when the session request fails", async () => {
      const { httpTesting } = renderAppComponent("/admin");

      const request = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );
      request.flush(getSessionErrorResponse);

      await expect(
        screen.findByTestId("not-found-component"),
      ).resolves.toBeInTheDocument();
    });

    test("renders the Not Found Component for a non-admin on a nested admin path", async () => {
      const { httpTesting } = renderAppComponent("/admin/hirek");

      const request = await waitFor(() =>
        httpTesting.expectOne(sessionRequest),
      );
      request.flush(createGetSessionOkResponse());

      await expect(
        screen.findByTestId("not-found-component"),
      ).resolves.toBeInTheDocument();
    });
  });
});

function renderAppComponent(initialRoute: string) {
  const renderResult = render(AppComponent, {
    initialRoute,
    providers: [
      provideHttpClient(),
      provideTanStackQuery(testQueryClient),
      provideHttpClientTesting(),
      provideRouter(routes, withComponentInputBinding()),
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
