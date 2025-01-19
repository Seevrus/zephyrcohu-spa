import { provideHttpClient, withFetch } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";

import { testQueryClient } from "../../mocks/testQueryClient";
import getSessionErrorResponse from "../../mocks/users/getSessionErrorResponse.json";
import { sessionRequest } from "../../mocks/users/sessionRequest";
import { BreadcrumbService } from "../services/breadcrumb.service";
import { HeaderComponent } from "./header.component";

describe("Header", () => {
  let breadcrumbService: BreadcrumbService;
  let fixture: ComponentFixture<HeaderComponent>;
  let httpTesting: HttpTestingController;
  let headerElement: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BreadcrumbService,
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        provideTanStackQuery(testQueryClient),
        provideRouter([{ path: "**", component: HeaderComponent }]),
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(HeaderComponent);

    breadcrumbService = fixture.debugElement.injector.get(BreadcrumbService);
    headerElement = fixture.nativeElement;
  });

  it("should have the correct user actions if the user is not logged in", async () => {
    fixture.autoDetectChanges();
    await fixture.whenStable();

    const request = httpTesting.expectOne(sessionRequest);
    request.flush(getSessionErrorResponse, {
      status: 401,
      statusText: "Unauthorized",
    });

    const userActions = headerElement.querySelectorAll(
      ".header-user-actions > a",
    );

    expect([...userActions].map((a) => a.textContent)).toEqual([
      "Bejelentkezés",
      "Regisztráció",
    ]);

    httpTesting.verify();
  });

  it("should show the correct location breadcrumb", () => {
    fixture.detectChanges();
    breadcrumbService.breadcrumbChanged.emit("Test Breadcrumb");
    fixture.detectChanges();

    const pageShown = headerElement.querySelector(".header-breadcrumb");

    expect(pageShown?.textContent).toEqual(
      "Megjelenített lap: Test Breadcrumb ",
    );
  });
});
