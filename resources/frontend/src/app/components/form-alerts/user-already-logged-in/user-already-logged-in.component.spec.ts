import { render, screen } from "@testing-library/angular";

import { UserAlreadyLoggedInComponent } from "./user-already-logged-in.component";

describe("Form - Too many login attempts - Component", () => {
  test("should render the component", async () => {
    await renderUserAlreadyLoggedInComponent();

    expect(
      (await screen.findByTestId("zephyr-error-card-content")).innerHTML,
    ).toBe(
      "<p>Erről az email címről egy másik számítógépen már be vannak jelentkezve!</p>",
    );
  });
});

function renderUserAlreadyLoggedInComponent() {
  return render(UserAlreadyLoggedInComponent);
}
