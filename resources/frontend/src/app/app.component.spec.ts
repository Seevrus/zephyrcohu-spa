import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideLocationMocks } from "@angular/common/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";

import { testQueryClient } from "../mocks/testQueryClient";
import { AppComponent } from "./app.component";
import { routes } from "./app.routes";
import { LoginComponent } from "./pages/login/login.component";
import { MainComponent } from "./pages/main/main.component";

describe("App Component", () => {
  let appElement: HTMLElement;
  let harness: RouterTestingHarness;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        provideTanStackQuery(testQueryClient),
        provideRouter(routes),
        provideLocationMocks(),
        provideZonelessChangeDetection(),
      ],
    });

    fixture = TestBed.createComponent(AppComponent);
    appElement = fixture.nativeElement;

    harness = await RouterTestingHarness.create();
  });

  it("should render header and footer", () => {
    const footer = appElement.querySelector(".footer-main");
    expect(footer).toBeDefined();

    const header = appElement.querySelector(".header-main");
    expect(header).toBeDefined();
  });

  it("should render the Main Component initially", async () => {
    await harness.navigateByUrl("/", MainComponent);
    const mainComponent = harness.routeNativeElement;

    expect(
      mainComponent?.querySelector('[data-testid="main-component"]'),
    ).toBeTruthy();
  });

  it("renders the Login Component", async () => {
    await harness.navigateByUrl("/bejelentkezes", LoginComponent);
    const mainComponent = harness.routeNativeElement;

    expect(
      mainComponent?.querySelector('[data-testid="login-component"]'),
    ).toBeTruthy();
  });
});
