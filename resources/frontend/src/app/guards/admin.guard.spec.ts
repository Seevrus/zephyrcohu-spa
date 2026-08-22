import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { type PartialMatchRouteSnapshot } from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { waitFor } from "@testing-library/angular";

import { testQueryClient } from "../../mocks/testQueryClient";
import { createGetSessionOkResponse } from "../../mocks/users/createGetSessionOkResponse";
import getSessionErrorResponse from "../../mocks/users/getSessionErrorResponse.json";
import { sessionRequest } from "../../mocks/users/sessionRequest";
import { adminGuard } from "./admin.guard";

describe("adminGuard", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(testQueryClient),
        provideZonelessChangeDetection(),
      ],
    });
  });

  test("allows navigation for an admin session", async () => {
    const httpTesting = TestBed.inject(HttpTestingController);

    const resultPromise = TestBed.runInInjectionContext(() =>
      adminGuard({}, [], {} as PartialMatchRouteSnapshot),
    );

    const request = await waitFor(() => httpTesting.expectOne(sessionRequest));
    request.flush(createGetSessionOkResponse({ isAdmin: true }));

    await expect(resultPromise).resolves.toBe(true);
  });

  test("denies navigation for a non-admin session", async () => {
    const httpTesting = TestBed.inject(HttpTestingController);

    const resultPromise = TestBed.runInInjectionContext(() =>
      adminGuard({}, [], {} as PartialMatchRouteSnapshot),
    );

    const request = await waitFor(() => httpTesting.expectOne(sessionRequest));
    request.flush(createGetSessionOkResponse());

    await expect(resultPromise).resolves.toBe(false);
  });

  test("denies navigation when the session request fails", async () => {
    const httpTesting = TestBed.inject(HttpTestingController);

    const resultPromise = TestBed.runInInjectionContext(() =>
      adminGuard({}, [], {} as PartialMatchRouteSnapshot),
    );

    const request = await waitFor(() => httpTesting.expectOne(sessionRequest));
    request.flush(getSessionErrorResponse);

    await expect(resultPromise).resolves.toBe(false);
  });
});
