import { render, screen } from "@testing-library/angular";

import { CaptchaFailedComponent } from "./captcha-failed.component";

describe("Form - Captcha Failed - Component", () => {
  test("should render the component", async () => {
    await renderCaptchaFailedComponent();

    expect(
      (await screen.findByTestId("zephyr-error-card-content")).innerHTML,
    ).toBe(
      '<p> Nem sikerült meggyőződnünk arról, hogy Ön robot-e, vagy sem. Kérjük, frissítse az oldalt és próbálkozzon újra később. Bármilyen probléma esetén kérjük, írjon nekünk a <a class="zephyr-link on-error" href="mailto:zephyr.bt@gmail.com">zephyr.bt@gmail.com</a> címre. </p>',
    );
  });
});

function renderCaptchaFailedComponent() {
  return render(CaptchaFailedComponent);
}
