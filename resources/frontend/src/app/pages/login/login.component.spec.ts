import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";

import { LoginComponent } from "./login.component";

describe("Login Component", () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let loginElement: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideAnimationsAsync()],
    });

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    loginElement = fixture.nativeElement;

    fixture.detectChanges();
  });

  it("should render the form correctly", () => {
    const emailField = loginElement.querySelector("[data-testid='email']");
    expect(emailField?.querySelector("label")?.textContent).toEqual(
      "Email cím",
    );
    expect(emailField?.querySelector("input")?.type).toEqual("text");

    const passwordField = loginElement.querySelector(
      "[data-testid='password']",
    );
    expect(passwordField?.querySelector("label")?.textContent).toEqual(
      "Jelszó",
    );
    expect(passwordField?.querySelector("input")?.type).toEqual("password");

    const togglePassword = loginElement?.querySelector<HTMLButtonElement>(
      "[data-testid='toggle-password']",
    );
    expect(togglePassword?.disabled).toBeFalse();

    const submitButton = loginElement.querySelector<HTMLButtonElement>(
      "[data-testid='submit-button']",
    );
    expect(submitButton?.disabled).toBeTrue();
  });

  it("validates email correctly", () => {
    const form = component.loginForm;
    form.controls.email.markAsTouched();
    fixture.detectChanges();

    expect(loginElement.querySelector("mat-error")?.textContent).toEqual(
      "Kötelező mező",
    );

    form.controls.email.setValue("invalid-email");
    fixture.detectChanges();

    expect(loginElement.querySelector("mat-error")?.textContent).toEqual(
      "Email cím formátuma nem megfelelő",
    );
  });

  it("validates password correctly", () => {
    const form = component.loginForm;
    form.controls.password.markAsTouched();
    fixture.detectChanges();

    expect(loginElement.querySelector("mat-error")?.textContent).toEqual(
      "Kötelező mező",
    );

    form.controls.password.setValue("12");
    fixture.detectChanges();

    expect(loginElement.querySelector("mat-error")?.textContent).toEqual(
      "Jelszó formátuma nem megfelelő",
    );
  });

  it("toggle password button changes the type of the password input", () => {
    const togglePassword = loginElement?.querySelector<HTMLButtonElement>(
      "[data-testid='toggle-password']",
    );

    togglePassword?.click();
    fixture.detectChanges();

    expect(
      loginElement.querySelector<HTMLInputElement>(
        "[formcontrolname='password']",
      )?.type,
    ).toBe("text");
  });

  it("enables submit if the form is filled correctly", () => {
    const form = component.loginForm;
    form.controls.email.setValue("abc123@abc.com");
    form.controls.email.markAsDirty();
    form.controls.password.setValue("abc123xyz");
    form.controls.password.markAsDirty();

    fixture.detectChanges();

    const submitButton = loginElement.querySelector<HTMLButtonElement>(
      "[data-testid='submit-button']",
    );
    expect(submitButton?.disabled).toBeFalse();
  });
});
