import { render, screen } from "@testing-library/angular";

import { FormUnexpectedErrorComponent } from "./form-unexpected-error.component";

describe("Form - Unexpected Error - Component", () => {
  test("should render the component", async () => {
    await renderFormUnexpectedErrorComponent();

    expect(
      (await screen.findByTestId("zephyr-error-card-content")).innerHTML,
    ).toBe(
      `<p> Váratlan hiba lépett fel a folyamat során. Kérjük, írjon nekünk a <a class="zephyr-link on-error" href="mailto:zephyr.bt@gmail.com">zephyr.bt@gmail.com</a> címre. </p>`,
    );
  });
});

function renderFormUnexpectedErrorComponent() {
  return render(FormUnexpectedErrorComponent);
}
