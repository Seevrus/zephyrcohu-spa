import { render, screen } from "@testing-library/angular";

import { ProfileEmailUpdatedComponent } from "./profile-email-updated.component";

describe("Profile Email Updated Successfully Component", () => {
  test("should render the component", async () => {
    await renderProfileEmailUpdatedComponent();

    await expect(
      screen.findByTestId("zephyr-success-card-content"),
    ).resolves.toHaveTextContent(
      `A(z) test@test.com e-mail címet aktiváltuk adatbázisunkban. A következő bejelentkezéskor már ezt az új címet kell használnia. Régi e-mail címét töröltük.`,
    );
  });
});

function renderProfileEmailUpdatedComponent() {
  return render(ProfileEmailUpdatedComponent, {
    inputs: { confirmedNewEmail: "test@test.com" },
  });
}
