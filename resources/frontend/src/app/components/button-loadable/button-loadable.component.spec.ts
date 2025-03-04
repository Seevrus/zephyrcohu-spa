import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";

import { ButtonLoadableComponent } from "./button-loadable.component";

describe("ButtonLoadableComponent", () => {
  it("should have the correct content", () => {
    @Component({
      template: `<app-button-loadable>Click Me</app-button-loadable>`,
      imports: [ButtonLoadableComponent],
    })
    class TestHostComponent {}

    const fixture = TestBed.createComponent(TestHostComponent);
    const buttonElement = fixture.nativeElement;

    fixture.detectChanges();

    expect(buttonElement.textContent?.trim()).toEqual("Click Me");
  });

  it("should have a disabled state", () => {
    @Component({
      template: `<app-button-loadable disabled="true"
        >Click Me</app-button-loadable
      >`,
      imports: [ButtonLoadableComponent],
    })
    class TestHostComponent {}

    const fixture = TestBed.createComponent(TestHostComponent);
    const buttonElement = fixture.nativeElement;

    fixture.detectChanges();

    expect(buttonElement.querySelector("button")?.disabled).toBeTruthy();
  });

  it("should have a loading state", () => {
    @Component({
      template: `<app-button-loadable loading="true"
        >Click Me</app-button-loadable
      >`,
      imports: [ButtonLoadableComponent],
    })
    class TestHostComponent {}

    const fixture = TestBed.createComponent(TestHostComponent);
    const buttonElement = fixture.nativeElement;

    fixture.detectChanges();

    expect(buttonElement.querySelector(".loader")).toBeTruthy();
  });
});
