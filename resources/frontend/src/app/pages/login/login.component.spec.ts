import { provideZonelessChangeDetection } from "@angular/core";
import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";

import { LoginComponent } from "./login.component";

describe("Login Component", () => {
  const user = userEvent.setup();

  test("should render the form correctly", async () => {
    await renderLoginComponent();

    const emailField = screen.getByTestId("email");

    expect(emailField?.querySelector("label")?.textContent).toBe("Email cím");
    expect(emailField?.querySelector("input")?.type).toBe("text");

    const passwordField = screen.getByTestId("password");

    expect(passwordField?.querySelector("label")?.textContent).toBe("Jelszó");
    expect(passwordField?.querySelector("input")?.type).toBe("password");

    const togglePassword =
      screen.getByTestId<HTMLButtonElement>("toggle-password");

    expect(togglePassword?.disabled).toBe(false);

    const submitButton = screen.getByTestId<HTMLButtonElement>("submit-button");

    expect(submitButton?.disabled).toBe(true);
  });

  describe("should validate the form correctly", () => {
    test("validates email correctly", async () => {
      const { container } = await renderLoginComponent();

      const emailInput = screen.getByTestId("email").querySelector("input")!;
      await user.click(emailInput);
      await user.tab();

      await waitFor(() => {
        expect(container.querySelector("mat-error")).toHaveTextContent(
          "Kötelező mező",
        );
      });

      await user.type(emailInput, "invalid-email");
      await user.tab();

      expect(container.querySelector("mat-error")).toHaveTextContent(
        "Email cím formátuma nem megfelelő",
      );
    });

    test("validates password correctly", async () => {
      const { container } = await renderLoginComponent();

      const passwordInput = screen
        .getByTestId("password")
        .querySelector("input")!;
      await user.click(passwordInput);
      await user.tab();

      await waitFor(() => {
        expect(container.querySelector("mat-error")).toHaveTextContent(
          "Kötelező mező",
        );
      });

      await user.type(passwordInput, "12");
      await user.tab();

      expect(container.querySelector("mat-error")).toHaveTextContent(
        "Jelszó formátuma nem megfelelő",
      );
    });

    test("toggle password button changes the type of the password input", async () => {
      await renderLoginComponent();

      const togglePassword = screen.getByTestId("toggle-password");
      await user.click(togglePassword);

      const passwordInput = screen
        .getByTestId("password")
        .querySelector("input")!;

      expect(passwordInput.type).toBe("text");
    });

    test("enables submit if the form is filled correctly", async () => {
      await renderLoginComponent();

      const emailInput = screen.getByTestId("email").querySelector("input")!;
      await user.type(emailInput, "abc123@abc.com");

      const passwordInput = screen
        .getByTestId("password")
        .querySelector("input")!;
      await user.type(passwordInput, "abc123xyz");

      const submitButton = screen.getByTestId("submit-button");

      expect(submitButton).not.toBeDisabled();
    });
  });
});

async function renderLoginComponent() {
  return render(LoginComponent, {
    providers: [provideZonelessChangeDetection()],
  });
}
