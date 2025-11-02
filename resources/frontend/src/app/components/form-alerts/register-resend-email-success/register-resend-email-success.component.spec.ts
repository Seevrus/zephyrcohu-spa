import { render, screen } from "@testing-library/angular";

import { RegisterResendEmailSuccessComponent } from "./register-resend-email-success.component";

describe("Register - Resend Confirmation Email - Success - Component", () => {
  test("should render the component", async () => {
    await renderRegisterResendEmailSuccessComponent();

    expect(
      (await screen.findByTestId("zephyr-success-card-content")).innerHTML,
    ).toEqual(
      `<p>Email: abc123@test.com</p><p> Regisztrációjának megerősítéséhez újból kiküldtük az e-mailt a fenti email címre. Kérjük, lépjen be e-mail fiókjába és a kapott levélben található linken erősítse meg a regisztrációját; előtte nem tud belépni honlapunkra. </p><p><span style="font-weight: bold;">Fontos:</span> Amennyiben nem kapott megerősítő e-mailt, ellenőrizze levélfiókjának Spam (levélszemét) mappáját, mert egyes levelezőrendszerek levélszemétnek minősíthetik a honlap rendszeréből küldött üzeneteket! </p><p> Bármilyen probléma esetén kérjük, írjon nekünk a <a class="zephyr-link on-success" href="mailto:zephyr.bt@gmail.com">zephyr.bt@gmail.com</a> címre. </p>`,
    );
  });
});

function renderRegisterResendEmailSuccessComponent() {
  return render(RegisterResendEmailSuccessComponent, {
    inputs: { resentEmail: "abc123@test.com" },
  });
}
