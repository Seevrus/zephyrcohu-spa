import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";

import { environment } from "../../environments/environment";
import { xsrfInterceptor } from "./xsrfInterceptor";

describe("xsrfInterceptor", () => {
  beforeEach(() => {
    document.cookie = "XSRF-TOKEN=test-token";

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([xsrfInterceptor])),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
      ],
    });
  });

  afterEach(() => {
    document.cookie = "XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  });

  test.each(["POST", "PUT", "PATCH", "DELETE"])(
    "adds the X-XSRF-TOKEN header to a %s request",
    (method) => {
      const http = TestBed.inject(HttpClient);
      const httpTesting = TestBed.inject(HttpTestingController);

      http.request(method, `${environment.apiUrl}/admin/news/1`).subscribe();

      const request = httpTesting.expectOne(
        `${environment.apiUrl}/admin/news/1`,
      );

      expect(request.request.headers.get("X-XSRF-TOKEN")).toBe("test-token");

      httpTesting.verify();
    },
  );

  test("does not add the X-XSRF-TOKEN header to a GET request", () => {
    const http = TestBed.inject(HttpClient);
    const httpTesting = TestBed.inject(HttpTestingController);

    http.get(`${environment.apiUrl}/admin/news`).subscribe();

    const request = httpTesting.expectOne(`${environment.apiUrl}/admin/news`);

    expect(request.request.headers.has("X-XSRF-TOKEN")).toBe(false);

    httpTesting.verify();
  });
});
