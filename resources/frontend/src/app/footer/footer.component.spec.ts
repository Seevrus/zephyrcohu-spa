import { provideZonelessChangeDetection } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";

import { FooterComponent } from "./footer.component";

describe("Footer Component", () => {
  let fixture: ComponentFixture<FooterComponent>;
  let footerElement: HTMLElement;

  beforeAll(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date("2024-07-02"));
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });

    fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();

    footerElement = fixture.nativeElement;
  });

  afterAll(() => {
    jasmine.clock().uninstall();
  });

  it("should have the correct navigation items", () => {
    const footerNavLabels = footerElement.querySelectorAll(
      ".footer-actions > a > .mdc-button__label",
    );

    expect([...footerNavLabels].map((link) => link?.textContent)).toEqual([
      "Kapcsolat",
      "Honlaptérkép",
      "Adatvédelmi tájékoztató",
    ]);
  });

  it("should have the correct copyright notice", () => {
    const copyrightElement = footerElement.querySelector(".copyright-notice");

    expect(copyrightElement?.textContent).toEqual(
      " Copyright © Zephyr Számítástechnikai Fejlesztő és Gazdasági Szolgáltató Bt. 2018-2024. ",
    );
  });
});
