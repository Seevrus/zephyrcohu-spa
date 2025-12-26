import { render, screen } from "@testing-library/angular";

import { ForgotPasswordEmailSentComponent } from "./forgot-password-email-sent.component";

describe("ForgotPasswordEmailSentComponent", () => {
  test("should render the component", async () => {
    await renderForgotPasswordEmailSentComponent();

    expect(
      (await screen.findByTestId("zephyr-success-card-content")).innerHTML,
    ).toBe(
      `<p>Email: test@test.com</p><p> A jelszó helyreállításához szükséges linket kiküldtük a megadott email címre. A link 30 percig használható fel, később újat kell igényelnie. </p><p><span style="font-weight: bold;">Fontos:</span> Amennyiben nem kapott megerősítő e-mailt, ellenőrizze levélfiókjának Spam (levélszemét) mappáját, mert egyes levelezőrendszerek levélszemétnek minősíthetik a honlap rendszeréből küldött üzeneteket! </p><p> Bármilyen probléma esetén kérjük, írjon nekünk a <a class="zephyr-link on-success" href="mailto:zephyr.bt@gmail.com">zephyr.bt@gmail.com</a> címre. </p>`,
    );
  });
});

function renderForgotPasswordEmailSentComponent() {
  return render(ForgotPasswordEmailSentComponent, {
    inputs: {
      email: "test@test.com",
    },
  });
}
