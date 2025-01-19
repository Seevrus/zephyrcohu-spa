import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";

import { RegisterComponent } from "./register.component";

describe("Register Component", () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let registerElement: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideAnimationsAsync()],
    });

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    registerElement = fixture.nativeElement;

    fixture.detectChanges();
  });

  it("should render the form text fields correctly", () => {
    const emailField = registerElement.querySelector("[data-testid='email']");
    expect(emailField?.querySelector("label")?.textContent).toEqual(
      "Email cím",
    );
    expect(emailField?.querySelector("input")?.type).toEqual("text");

    const passwordField = registerElement.querySelector(
      "[data-testid='password']",
    );
    expect(passwordField?.querySelector("label")?.textContent).toEqual(
      "Jelszó",
    );
    expect(passwordField?.querySelector("input")?.type).toEqual("password");

    const passwordAgainField = registerElement.querySelector(
      "[data-testid='password-again']",
    );
    expect(passwordAgainField?.querySelector("label")?.textContent).toEqual(
      "Jelszó újra",
    );
    expect(passwordAgainField?.querySelector("input")?.type).toEqual(
      "password",
    );
  });

  it("should render password helpers", () => {
    const passwordCharacters = registerElement.querySelector(
      "[data-testid='password-characters']",
    );
    expect(passwordCharacters?.textContent).toEqual(
      " A jelszó minimális hossza 8 karakter. Engedélyezett karakterek: magyar ABC kis- és nagybetűi, számok, illetve az alábbi speciális karakterek: . _ + # % @ - ",
    );

    const passwordStrength = registerElement.querySelector(
      "[data-testid='password-strength']",
    );
    expect(passwordStrength).toBeNull();

    const passwordGenerateHelp = registerElement.querySelector(
      "[data-testid='password-generate-help']",
    );
    expect(passwordGenerateHelp?.textContent).toEqual(
      " Erős jelszavak generálása pofonegyszerűen - segédlet az alábbi oldalon. ",
    );

    const helpLink =
      passwordGenerateHelp?.querySelector<HTMLAnchorElement>("a");
    expect(helpLink?.href).toEqual(
      "https://hvg.hu/tudomany/20171117_eros_jelszo_letrehozasa_generator_nehezen_kitalalhato_jelszavak_nehezen_feltorheto_jelszo_biztonsagos_milyen_jelszot_valasszak",
    );
    expect(helpLink?.target).toBe("_blank");
  });

  it("if the password is valid, its strength is shown", () => {
    component.registerForm.setValue({
      email: "gipszjakab@gmail.com",
      passwords: {
        password: "weakpass",
        passwordAgain: "weakpass",
      },
      newsletter: false,
      cookies: true,
    });

    fixture.detectChanges();

    const passwordStrength = registerElement.querySelector(
      "[data-testid='password-strength']",
    );
    expect(passwordStrength?.textContent).toEqual(
      "A jelszó erőssége:  gyenge ",
    );
  });

  it("toggle password button changes the type of the password inputs", () => {
    const togglePassword = registerElement?.querySelector<HTMLButtonElement>(
      "[data-testid='toggle-password']",
    );

    togglePassword?.click();
    fixture.detectChanges();

    expect(
      registerElement.querySelector<HTMLInputElement>(
        "[formcontrolname='password']",
      )?.type,
    ).toBe("text");

    expect(
      registerElement.querySelector<HTMLInputElement>(
        "[formcontrolname='passwordAgain']",
      )?.type,
    ).toBe("text");
  });

  it("checkboxes are displayed correctly", () => {
    const newsletterCheckboxContainer = registerElement?.querySelector(
      "[formcontrolname='newsletter']",
    );

    const newsletterCheckboxLabel =
      newsletterCheckboxContainer?.querySelector("label");
    expect(newsletterCheckboxLabel?.textContent).toEqual(
      " Szeretnék hírlevelet kapni a fontosabb újdonságokról. ",
    );

    const newsletterCheckbox =
      newsletterCheckboxContainer?.querySelector<HTMLInputElement>(
        "input[type='checkbox']",
      );
    expect(newsletterCheckbox?.checked).toBeFalse();

    const cookiesCheckboxContainer = registerElement?.querySelector(
      "[formcontrolname='cookies']",
    );

    const cookiesCheckboxLabel =
      cookiesCheckboxContainer?.querySelector("label");
    expect(cookiesCheckboxLabel?.textContent).toEqual(
      " * Hozzájárulok a bejelentkezési adatokat tartalmazó cookie-k tárolásához. ",
    );

    const cookiesCheckbox =
      cookiesCheckboxContainer?.querySelector<HTMLInputElement>(
        "input[type='checkbox']",
      );
    expect(cookiesCheckbox?.checked).toBeFalse();
  });

  it("validates email correctly", () => {
    const form = component.registerForm;
    form.controls.email.markAsTouched();
    fixture.detectChanges();

    expect(registerElement.querySelector("mat-error")?.textContent).toEqual(
      "Kötelező mező",
    );

    form.controls.email.setValue("invalid-email");
    fixture.detectChanges();

    expect(registerElement.querySelector("mat-error")?.textContent).toEqual(
      "Email cím formátuma nem megfelelő",
    );
  });

  it("validates password correctly", () => {
    const password = component.registerForm.get("passwords.password");

    password?.markAsTouched();
    fixture.detectChanges();

    expect(registerElement.querySelector("mat-error")?.textContent).toEqual(
      "Kötelező mező",
    );

    password?.setValue("12");
    fixture.detectChanges();

    expect(registerElement.querySelector("mat-error")?.textContent).toEqual(
      "Jelszó formátuma nem megfelelő",
    );
  });

  it("shows an error if passwords don't match", () => {
    const form = component.registerForm;
    form.controls.passwords.setValue({
      password: "12345678",
      passwordAgain: "12345679",
    });

    fixture.detectChanges();

    expect(registerElement.querySelector(".custom-error")?.textContent).toEqual(
      "A beírt jelszavak nem egyeznek meg",
    );
  });

  it("can submit if the form is valid", () => {
    const form = component.registerForm;

    let submitButton = registerElement.querySelector<HTMLButtonElement>(
      "[data-testid='submit-button']",
    );
    expect(submitButton?.disabled).toBeTrue();

    form.setValue({
      email: "abc123@gmail.com",
      passwords: {
        password: "12345678",
        passwordAgain: "12345678",
      },
      newsletter: false,
      cookies: true,
    });

    form.markAsDirty();
    fixture.detectChanges();

    submitButton = registerElement.querySelector<HTMLButtonElement>(
      "[data-testid='submit-button']",
    );
    expect(submitButton?.disabled).toBeFalse();
  });
});
