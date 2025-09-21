import { provideHttpClient, withFetch } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";

import { testQueryClient } from "../../../mocks/testQueryClient";
import { createRegisterErrorResponse } from "../../../mocks/users/createRegisterErrorResponse";
import getSessionOkResponse from "../../../mocks/users/getSessionOkResponse.json";
import { registerRequest } from "../../../mocks/users/registerRequest";
import { RegisterComponent } from "./register.component";

describe("Register Component", () => {
  const user = userEvent.setup();

  describe("should render the form correctly", () => {
    test("text fields", async () => {
      await renderRegisterComponent();

      const emailField = screen.getByTestId("email");
      expect(emailField.querySelector("label")).toHaveTextContent("Email cím");
      expect(emailField.querySelector("input")?.type).toEqual("text");

      const passwordField = screen.getByTestId("password");
      expect(passwordField.querySelector("label")).toHaveTextContent("Jelszó");
      expect(passwordField.querySelector("input")?.type).toEqual("password");

      const passwordAgainField = screen.getByTestId("password-again");
      expect(passwordAgainField.querySelector("label")).toHaveTextContent(
        "Jelszó újra",
      );
      expect(passwordAgainField.querySelector("input")?.type).toEqual(
        "password",
      );
    });

    test("password helpers", async () => {
      await renderRegisterComponent();

      const passwordCharacters = screen.getByTestId("password-characters");
      expect(passwordCharacters).toHaveTextContent(
        "A jelszó minimális hossza 8 karakter. Engedélyezett karakterek: magyar ABC kis- és nagybetűi, számok, illetve az alábbi speciális karakterek: . _ + # % @ -",
      );

      const passwordStrength = screen.queryByTestId("password-strength");
      expect(passwordStrength).toBeNull();

      const passwordGenerateHelp = screen.getByTestId("password-generate-help");
      expect(passwordGenerateHelp).toHaveTextContent(
        "Erős jelszavak generálása pofonegyszerűen - segédlet az alábbi oldalon.",
      );

      const helpLink =
        passwordGenerateHelp?.querySelector<HTMLAnchorElement>("a");
      expect(helpLink?.href).toEqual(
        "https://hvg.hu/tudomany/20171117_eros_jelszo_letrehozasa_generator_nehezen_kitalalhato_jelszavak_nehezen_feltorheto_jelszo_biztonsagos_milyen_jelszot_valasszak",
      );
      expect(helpLink?.target).toBe("_blank");
    });

    test("toggle password button changes the type of the password inputs", async () => {
      await renderRegisterComponent();

      const togglePassword = screen.getByTestId("toggle-password");

      await user.click(togglePassword);

      const passwordInput = screen
        .getByTestId("password")
        .querySelector("input")!;

      expect(passwordInput.type).toBe("text");

      const passwordAgainInput = screen
        .getByTestId("password-again")
        .querySelector("input")!;

      expect(passwordAgainInput.type).toBe("text");
    });

    test("checkboxes are displayed correctly", async () => {
      const { container } = await renderRegisterComponent();

      const newsletterCheckboxContainer = container.querySelector(
        "[formcontrolname='newsletter']",
      );

      const newsletterCheckboxLabel =
        newsletterCheckboxContainer?.querySelector("label");
      expect(newsletterCheckboxLabel).toHaveTextContent(
        "Szeretnék hírlevelet kapni a fontosabb újdonságokról.",
      );

      const newsletterCheckbox =
        newsletterCheckboxContainer?.querySelector<HTMLInputElement>(
          "input[type='checkbox']",
        );
      expect(newsletterCheckbox).not.toBeChecked();

      const cookiesCheckboxContainer = container.querySelector(
        "[formcontrolname='cookies']",
      );

      const cookiesCheckboxLabel =
        cookiesCheckboxContainer?.querySelector("label");
      expect(cookiesCheckboxLabel).toHaveTextContent(
        "* Hozzájárulok a bejelentkezési adatokat tartalmazó cookie-k tárolásához.",
      );

      const cookiesCheckbox =
        cookiesCheckboxContainer?.querySelector<HTMLInputElement>(
          "input[type='checkbox']",
        );
      expect(cookiesCheckbox).not.toBeChecked();
    });
  });

  describe("should validate the form correctly", () => {
    test("validates email correctly", async () => {
      const { container } = await renderRegisterComponent();

      const emailInput = screen.getByTestId("email").querySelector("input")!;

      await user.type(emailInput, "invalid-email");
      await user.tab();

      expect(container.querySelector("mat-error")).toHaveTextContent(
        "Email cím formátuma nem megfelelő",
      );

      await user.clear(emailInput);
      await user.tab();

      expect(container.querySelector("mat-error")).toHaveTextContent(
        "Kötelező mező",
      );
    });

    test("validates password correctly", async () => {
      const { container } = await renderRegisterComponent();

      const passwordInput = screen
        .getByTestId("password")
        .querySelector("input")!;

      await user.type(passwordInput, "12");
      await user.tab();

      expect(container.querySelector("mat-error")).toHaveTextContent(
        "Jelszó formátuma nem megfelelő",
      );

      await user.clear(passwordInput);
      await user.tab();

      expect(container.querySelector("mat-error")?.textContent).toEqual(
        "Kötelező mező",
      );

      expect(container.querySelector("mat-error")).toHaveTextContent(
        "Kötelező mező",
      );
    });

    test("shows an error if passwords don't match", async () => {
      const { container } = await renderRegisterComponent();

      const passwordInput = screen
        .getByTestId("password")
        .querySelector("input")!;

      const passwordAgainInput = screen
        .getByTestId("password-again")
        .querySelector("input")!;

      await user.type(passwordInput, "weakpass");
      await user.type(passwordAgainInput, "strongpass");
      await user.tab();

      expect(container.querySelector(".custom-error")).toHaveTextContent(
        "A beírt jelszavak nem egyeznek meg",
      );
    });

    test("if the password is valid, its strength is shown", async () => {
      await renderRegisterComponent();

      const passwordInput = screen
        .getByTestId("password")
        .querySelector("input")!;
      await user.type(passwordInput, "weakpass");

      const passwordStrength = screen.getByTestId("password-strength");
      expect(passwordStrength).toHaveTextContent("A jelszó erőssége: gyenge");
    });

    test("can submit if the form is valid", async () => {
      const { fixture } = await renderRegisterComponent();

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button");

      expect(submitButton).toBeDisabled();

      await fillForm(fixture);

      expect(submitButton).toBeEnabled();
    });
  });

  describe("should show the correct API error messages", () => {
    test("if the user already exists", async () => {
      const { fixture, httpTesting } = await renderRegisterComponent();
      await fillForm(fixture);

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button")!;

      await user.click(submitButton);

      const request = await waitFor(() =>
        httpTesting.expectOne(registerRequest),
      );

      request.flush(createRegisterErrorResponse("USER_EXISTS"), {
        status: 409,
        statusText: "Conflict",
      });

      expect(
        (await screen.findByTestId("zephyr-error-card-content")).innerHTML,
      ).toEqual(
        '<p>Ezzel az e-mail címmel korábban már regisztráltak honlapunkon.</p><p>Bejelentkezéshez kérjük <a routerlink="/bejelentkezes" class="zephyr-link on-error" href="/bejelentkezes">kattintson ide</a>.</p><p>Amennyiben elfelejtette a jelszavát, TODO: <a href="index.php?content=pwdrecover" class="zephyr-link on-error">ide kattintva tud új jelszót létrehozni</a>.</p><!--container--><!--container--><!--container--><p>Bármilyen probléma esetén kérjük, írjon nekünk a <a class="zephyr-link on-error" href="mailto:zephyr.bt@gmail.com">zephyr.bt@gmail.com</a> címre.</p>',
      );

      httpTesting.verify();
    });

    test("if the user is not confirmed", async () => {
      const { fixture, httpTesting } = await renderRegisterComponent();
      await fillForm(fixture);

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button")!;

      await user.click(submitButton);

      const request = await waitFor(() =>
        httpTesting.expectOne(registerRequest),
      );

      request.flush(createRegisterErrorResponse("USER_NOT_CONFIRMED"), {
        status: 409,
        statusText: "Conflict",
      });

      expect(
        (await screen.findByTestId("zephyr-error-card-content")).innerHTML,
      ).toEqual(
        '<!--container--><p>A(z) abc123@gmail.com email címmel már regisztráltak honlapunkon, azonban még nem került megerősítésre. Kérjük, lépjen be e-mail fiókjába és a kapott levélben található linken erősítse meg a regisztrációját; előtte nem tud belépni honlapunkra.</p><p><span style="font-weight: bold;">Fontos:</span> Amennyiben nem kapott megerősítő e-mailt, ellenőrizze levélfiókjának Spam (levélszemét) mappáját, mert egyes levelezőrendszerek levélszemétnek minősíthetik a honlap rendszeréből küldött üzeneteket!</p><p>Amennyiben szeretné, hogy újra elküldjük a regisztráció megerősítéséhez szükséges e-mailt, TODO: <a href="index.php?content=register&amp;hol=4&amp;mit=<?php echo ($email_kod); ?>" class="zephyr-link on-error">kérjük kattintson az alábbi linkre.</a></p><!--container--><!--container--><p>Bármilyen probléma esetén kérjük, írjon nekünk a <a class="zephyr-link on-error" href="mailto:zephyr.bt@gmail.com">zephyr.bt@gmail.com</a> címre.</p>',
      );

      httpTesting.verify();
    });

    test("in the case of an unknown error", async () => {
      const { fixture, httpTesting } = await renderRegisterComponent();
      await fillForm(fixture);

      const submitButton = screen
        .getByTestId("submit-button")
        .querySelector("button")!;

      await user.click(submitButton);

      const request = await waitFor(() =>
        httpTesting.expectOne(registerRequest),
      );

      request.flush(createRegisterErrorResponse("INTERNAL_SERVER_ERROR"), {
        status: 500,
        statusText: "Internal Server Error",
      });

      expect(
        (await screen.findByTestId("zephyr-error-card-content")).innerHTML,
      ).toEqual(
        '<!--container--><!--container--><p>Váratlan hiba lépett fel a bejelentkezés során.</p><!--container--><p>Bármilyen probléma esetén kérjük, írjon nekünk a <a class="zephyr-link on-error" href="mailto:zephyr.bt@gmail.com">zephyr.bt@gmail.com</a> címre.</p>',
      );

      httpTesting.verify();
    });
  });

  test("should show the correct API success message", async () => {
    const { fixture, httpTesting } = await renderRegisterComponent();
    await fillForm(fixture);

    const submitButton = screen
      .getByTestId("submit-button")
      .querySelector("button")!;

    await user.click(submitButton);

    const request = await waitFor(() => httpTesting.expectOne(registerRequest));
    request.flush(getSessionOkResponse);

    expect(
      (await screen.findByTestId("zephyr-success-card-content")).innerHTML,
    ).toEqual(
      '<p>Email: abc123@gmail.com</p><p>Regisztrációjának megerősítéséhez egy e-mailt küldtünk a fenti email címre. Kérjük, lépjen be e-mail fiókjába és a kapott levélben található linken erősítse meg a regisztrációját; előtte nem tud belépni honlapunkra.</p><p><span style="font-weight: bold;">Fontos:</span> Amennyiben nem kapott megerősítő e-mailt, ellenőrizze levélfiókjának Spam (levélszemét) mappáját, mert egyes levelezőrendszerek levélszemétnek minősíthetik a honlap rendszeréből küldött üzeneteket!</p><p>Bármilyen probléma esetén kérjük, írjon nekünk a <a class="zephyr-link on-success" href="mailto:zephyr.bt@gmail.com">zephyr.bt@gmail.com</a> címre.</p>',
    );

    httpTesting.verify();
  });
});

async function fillForm(fixture: ComponentFixture<RegisterComponent>) {
  fixture.componentInstance.registerForm.setValue({
    email: "abc123@gmail.com",
    passwords: {
      password: "12345678",
      passwordAgain: "12345678",
    },
    newsletter: false,
    cookies: true,
  });
  fixture.componentInstance.registerForm.markAsDirty();

  await fixture.whenStable();
}

async function renderRegisterComponent() {
  const renderResult = await render(RegisterComponent, {
    providers: [
      provideHttpClient(withFetch()),
      provideHttpClientTesting(),
      provideTanStackQuery(testQueryClient),
      provideZonelessChangeDetection(),
    ],
  });

  const httpTesting = TestBed.inject(HttpTestingController);

  return {
    ...renderResult,
    httpTesting,
  };
}
