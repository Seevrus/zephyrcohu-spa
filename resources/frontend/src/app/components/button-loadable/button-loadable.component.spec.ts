import { Component, provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";

import { ButtonLoadableComponent } from "./button-loadable.component";

describe("ButtonLoadableComponent", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it("should have the correct content", async () => {
    @Component({
      template: `<app-button-loadable>Click Me</app-button-loadable>`,
      imports: [ButtonLoadableComponent],
    })
    class TestHostComponent {}

    const fixture = TestBed.createComponent(TestHostComponent);
    const buttonElement = fixture.nativeElement;

    await fixture.whenStable();

    expect(buttonElement.textContent?.trim()).toEqual("Click Me");
  });

  it("should have a disabled state", async () => {
    @Component({
      template: `<app-button-loadable disabled="true"
        >Click Me</app-button-loadable
      >`,
      imports: [ButtonLoadableComponent],
    })
    class TestHostComponent {}

    const fixture = TestBed.createComponent(TestHostComponent);
    const buttonElement = fixture.nativeElement;

    await fixture.whenStable();

    expect(buttonElement.querySelector("button")?.disabled).toBeTruthy();
  });

  it("should have a loading state", async () => {
    @Component({
      template: `<app-button-loadable loading="true"
        >Click Me</app-button-loadable
      >`,
      imports: [ButtonLoadableComponent],
    })
    class TestHostComponent {}

    const fixture = TestBed.createComponent(TestHostComponent);
    const buttonElement = fixture.nativeElement;

    await fixture.whenStable();

    expect(buttonElement.querySelector(".loader")).toBeTruthy();
  });
});
