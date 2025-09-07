import { provideHttpClient, withFetch } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";

import { testQueryClient } from "../../mocks/testQueryClient";
import getSessionErrorResponse from "../../mocks/users/getSessionErrorResponse.json";
import { sessionRequest } from "../../mocks/users/sessionRequest";
import { BreadcrumbService } from "../services/breadcrumb.service";
import { HeaderComponent } from "./header.component";

describe("Header", () => {
  test("should have the correct user actions if the user is not logged in", async () => {
    const { httpTesting } = await renderHeader();

    const request = await waitFor(() => httpTesting.expectOne(sessionRequest));

    request.flush(getSessionErrorResponse, {
      status: 401,
      statusText: "Unauthorized",
    });

    const userActions = await screen.findAllByTestId("header-user-action");

    expect([...userActions].map((action) => action.textContent)).toEqual([
      "Bejelentkezés",
      "Regisztráció",
    ]);

    httpTesting.verify();
  });

  test("should show the correct location breadcrumb", async () => {
    const { breadcrumbService, fixture } = await renderHeader();

    breadcrumbService.setBreadcrumb("Főoldal");
    await fixture.whenStable();

    expect(await screen.findByTestId("header-breadcrumb")).toHaveTextContent(
      "Megjelenített lap: Főoldal",
    );
  });
});

async function renderHeader() {
  const renderResult = await render(HeaderComponent, {
    providers: [
      provideHttpClient(withFetch()),
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
