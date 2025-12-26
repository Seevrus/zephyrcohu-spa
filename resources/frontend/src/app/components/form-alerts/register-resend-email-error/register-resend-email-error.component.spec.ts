import { render, screen } from "@testing-library/angular";

import { RegisterResendEmailErrorComponent } from "./register-resend-email-error.component";

describe("Register - Resend Confirmation Email - Error - Component", () => {
  test("should render the component", async () => {
    await renderRegisterResendEmailErrorComponent();

    expect(
      (await screen.findByTestId("zephyr-error-card-content")).innerHTML,
    ).toBe(
      `<p>Váratlan hiba lépett fel a regisztrációs email újraküldése során.</p><p> Kérjük, írjon nekünk a <a class="zephyr-link on-error" href="mailto:zephyr.bt@gmail.com">zephyr.bt@gmail.com</a> címre. </p>`,
    );
  });
});

function renderRegisterResendEmailErrorComponent() {
  return render(RegisterResendEmailErrorComponent);
}
