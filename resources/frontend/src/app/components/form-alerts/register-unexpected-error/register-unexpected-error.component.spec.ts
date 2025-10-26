import { render, screen } from "@testing-library/angular";

import { RegisterUnexpectedErrorComponent } from "./register-unexpected-error.component";

describe("Registered - Unexpected Error - Component", () => {
  test("should render the component", async () => {
    await renderRegisterUnexpectedErrorComponent();

    expect(
      (await screen.findByTestId("zephyr-error-card-content")).innerHTML,
    ).toEqual(
      `<p> Váratlan hiba lépett fel a regisztráció során. Kérjük, írjon nekünk a <a class="zephyr-link on-error" href="mailto:zephyr.bt@gmail.com">zephyr.bt@gmail.com</a> címre. </p>`,
    );
  });
});

function renderRegisterUnexpectedErrorComponent() {
  return render(RegisterUnexpectedErrorComponent);
}
