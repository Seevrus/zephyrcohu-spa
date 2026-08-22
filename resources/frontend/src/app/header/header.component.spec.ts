import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { Component, provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event/dist/cjs/index.js";

import { testQueryClient } from "../../mocks/testQueryClient";
import { createGetSessionOkResponse } from "../../mocks/users/createGetSessionOkResponse";
import getSessionErrorResponse from "../../mocks/users/getSessionErrorResponse.json";
import { logoutRequest } from "../../mocks/users/logoutRequest";
import { sessionRequest } from "../../mocks/users/sessionRequest";
import { BreadcrumbService } from "../services/breadcrumb.service";
import { HeaderComponent } from "./header.component";

@Component({ selector: "app-dummy", template: "" })
class DummyComponent {}

describe("Header", () => {
  const user = userEvent.setup();

  test("should have the correct user actions if the user is not logged in", async () => {
    const { httpTesting } = await renderHeader();

    const request = await waitFor(() => httpTesting.expectOne(sessionRequest));

    request.flush(getSessionErrorResponse, {
      status: 401,
      statusText: "Unauthorized",
    });

    const userActions = await screen.findAllByTestId("header-user-action");

    expect([...userActions].map((action) => action.textContent)).toStrictEqual([
      "Bejelentkezés",
      "Regisztráció",
    ]);

    httpTesting.verify();
  });

  test("should have the correct user actions if the user is logged in", async () => {
    const { httpTesting } = await renderHeader();

    const request = await waitFor(() => httpTesting.expectOne(sessionRequest));

    request.flush(createGetSessionOkResponse());

    const userActions = await screen.findAllByTestId("header-user-action");

    expect([...userActions].map((action) => action.textContent)).toStrictEqual([
      "Adatok módosítása",
      " Kijelentkezés ",
    ]);
  });

  test("should show the correct location breadcrumb", async () => {
    const { breadcrumbService, fixture } = await renderHeader();

    breadcrumbService.setBreadcrumb("Főoldal");
    await fixture.whenStable();

    await expect(
      screen.findByTestId("header-breadcrumb"),
    ).resolves.toHaveTextContent("Megjelenített lap: Főoldal");
  });

  test("should navigate to home on successful logout", async () => {
    const { httpTesting } = await renderHeader();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate");

    let testSessionRequest = await waitFor(() =>
      httpTesting.expectOne(sessionRequest),
    );

    testSessionRequest.flush(createGetSessionOkResponse());

    const logoutButton = (
      await screen.findAllByTestId("header-user-action")
    ).find((button) => button.textContent.includes("Kijelentkezés"));

    await user.click(logoutButton!);

    const testLogoutRequest = await waitFor(() =>
      httpTesting.expectOne(logoutRequest),
    );

    testLogoutRequest.flush(null);

    testSessionRequest = await waitFor(() =>
      httpTesting.expectOne(sessionRequest),
    );

    testSessionRequest.flush(getSessionErrorResponse, {
      status: 401,
      statusText: "Unauthorized",
    });

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith(["/"]);
    });

    navigateSpy.mockRestore();

    httpTesting.verify();
  });

  test("should not show the admin funkciók button for non-admin users", async () => {
    const { httpTesting } = await renderHeader();

    const request = await waitFor(() => httpTesting.expectOne(sessionRequest));

    request.flush(createGetSessionOkResponse());

    await screen.findAllByTestId("header-user-action");

    expect(
      screen.queryByRole("button", { name: "Admin funkciók" }),
    ).not.toBeInTheDocument();

    httpTesting.verify();
  });

  test("should not show the admin navigation bar on an admin url for a user who isn't logged in", async () => {
    const { container, httpTesting } = await renderHeader({
      initialRoute: "/admin",
    });

    // Regardless of whether the test router's navigation to "/admin" landed
    // before this assertion runs, the admin nav must never appear for a
    // visitor who isn't a confirmed admin - it's gated on the session, not
    // just the url.
    expect(container.querySelector(".admin-nav")).not.toBeInTheDocument();
    expect(container.querySelector(".desktop-nav")).toBeInTheDocument();

    const request = await waitFor(() => httpTesting.expectOne(sessionRequest));

    request.flush(getSessionErrorResponse, {
      status: 401,
      statusText: "Unauthorized",
    });

    httpTesting.verify();
  });
});

async function renderHeader({ initialRoute }: { initialRoute?: string } = {}) {
  const renderResult = await render(HeaderComponent, {
    initialRoute,
    routes: [{ path: "**", component: DummyComponent }],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideZonelessChangeDetection(),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  const breadcrumbService =
    renderResult.fixture.debugElement.injector.get(BreadcrumbService);

  return {
    ...renderResult,
    breadcrumbService,
    httpTesting,
  };
}
