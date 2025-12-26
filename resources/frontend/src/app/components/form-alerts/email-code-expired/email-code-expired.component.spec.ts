import { render, screen } from "@testing-library/angular";

import { EmailCodeExpiredComponent } from "./email-code-expired.component";

describe("Form - Email Code / Link expired - Component", () => {
  test("should render the component", async () => {
    await renderEmailCodeExpiredComponent();

    expect(
      (await screen.findByTestId("zephyr-error-card-content")).innerHTML,
    ).toBe(
      "<p> A megadott link érvényessége lejárt. Ezt okozhatja a hivatalos 30 perces lejárati időn túli, vagy túl sok sikertelen próbálkozás is. Kérjük, kezdje elölről a folyamatot egy új link igénylésével. </p>",
    );
  });
});

function renderEmailCodeExpiredComponent() {
  return render(EmailCodeExpiredComponent);
}
