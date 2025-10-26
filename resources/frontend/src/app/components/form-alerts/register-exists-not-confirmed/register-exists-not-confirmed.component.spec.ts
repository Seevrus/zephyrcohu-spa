import { render, screen } from "@testing-library/angular";

import { RegisterExistsNotConfirmedComponent } from "./register-exists-not-confirmed.component";

describe("Registered Not Confirmed Component", () => {
  test("should render the component", async () => {
    await renderRegisterExistsNotConfirmedComponent();

    expect(
      (await screen.findByTestId("zephyr-error-card-content")).innerHTML,
    ).toEqual(
      `<p> A(z) test@test.com email címmel már regisztráltak honlapunkon, azonban még nem került megerősítésre. Kérjük, lépjen be e-mail fiókjába és a kapott levélben található linken erősítse meg a regisztrációját; előtte nem tud belépni honlapunkra. </p><p><span style="font-weight: bold;">Fontos:</span> Amennyiben nem kapott megerősítő e-mailt, ellenőrizze levélfiókjának Spam (levélszemét) mappáját, mert egyes levelezőrendszerek levélszemétnek minősíthetik a honlap rendszeréből küldött üzeneteket! </p><p> Amennyiben szeretné, hogy újra elküldjük a regisztráció megerősítéséhez szükséges e-mailt,: <span data-testid="resend-confirmation-email-link" tabindex="{0}" class="zephyr-link on-error">kérjük kattintson ide.</span></p><p> Bármilyen probléma esetén kérjük, írjon nekünk a <a class="zephyr-link on-error" href="mailto:zephyr.bt@gmail.com">zephyr.bt@gmail.com</a> címre. </p>`,
    );
  });
});

function renderRegisterExistsNotConfirmedComponent() {
  return render(RegisterExistsNotConfirmedComponent, {
    inputs: { email: "test@test.com" },
  });
}
