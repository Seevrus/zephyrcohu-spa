import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";

import { BreadcrumbService } from "../services/breadcrumb.service";
import { HeaderComponent } from "./header.component";

describe("Header", () => {
  let breadcrumbService: BreadcrumbService;
  let fixture: ComponentFixture<HeaderComponent>;
  let headerElement: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BreadcrumbService,
        provideRouter([{ path: "**", component: HeaderComponent }]),
      ],
    });

    fixture = TestBed.createComponent(HeaderComponent);

    breadcrumbService = fixture.debugElement.injector.get(BreadcrumbService);
    headerElement = fixture.nativeElement;
  });

  it("should have the correct user actions", () => {
    const userActions = headerElement.querySelectorAll(
      ".header-user-actions > a",
    );

    expect([...userActions].map((a) => a.textContent)).toEqual([
      "Bejelentkezés",
      "Regisztráció",
    ]);
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
