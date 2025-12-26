import { render, screen } from "@testing-library/angular";

import { BadCredentialsComponent } from "./bad-credentials.component";

describe("Form - Bad Credentials - Component", () => {
  test("should render the component", async () => {
    await renderBadCredentialsComponent();

    expect(
      (await screen.findByTestId("zephyr-error-card-content")).innerHTML,
    ).toBe("<p>A megadott email / jelszó kombináció nem megfelelő.</p>");
  });
});

function renderBadCredentialsComponent() {
  return render(BadCredentialsComponent);
}
