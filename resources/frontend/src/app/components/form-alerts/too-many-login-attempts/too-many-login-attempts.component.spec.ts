import { render, screen } from "@testing-library/angular";

import { TooManyLoginAttemptsComponent } from "./too-many-login-attempts.component";

describe("Form - Too many login attempts - Component", () => {
  test("should render the component", async () => {
    await renderTooManyLoginAttemptsComponent();

    expect(
      (await screen.findByTestId("zephyr-error-card-content")).innerHTML,
    ).toBe(
      "<p> Ön háromszor egymás után sikertelenül próbált bejelentkezni, ezért a rendszer egy órára eltiltotta a további próbálkozásoktól. </p>",
    );
  });
});

function renderTooManyLoginAttemptsComponent() {
  return render(TooManyLoginAttemptsComponent);
}
