import { render, screen } from "@testing-library/angular";

import { EmailLinkErrorComponent } from "./email-link-error.component";

describe("Form - Email Link Error - Component", () => {
  test("should render the component", async () => {
    await renderEmailLinkErrorComponent();

    expect(
      (await screen.findByTestId("zephyr-error-card-content")).innerHTML,
    ).toBe(
      `<p> A megadott link hibás. Kérjük, ellenőrizze, jól másolta-e be a böngészőjébe. Bármilyen probléma esetén kérjük, írjon nekünk a <a class="zephyr-link on-error" href="mailto:zephyr.bt@gmail.com">zephyr.bt@gmail.com</a> címre. </p>`,
    );
  });
});

function renderEmailLinkErrorComponent() {
  return render(EmailLinkErrorComponent);
}
