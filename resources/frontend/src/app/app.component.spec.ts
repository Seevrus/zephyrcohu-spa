import { provideLocationMocks } from "@angular/common/testing";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";

import { AppComponent } from "./app.component";
import { routes } from "./app.routes";
import { MainComponent } from "./pages/main/main.component";

describe("App Component", () => {
  let appElement: HTMLElement;
  let harness: RouterTestingHarness;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideLocationMocks()],
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
});
