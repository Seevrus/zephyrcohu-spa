import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";

import { allowedPasswordCharacters } from "../../../constants/forms";
import { passwordMatchValidator } from "../../validators/password-match.validator";
import { PasswordRepeatComponent } from "./password-repeat.component";

describe("PasswordRepeatComponent", () => {
  const user = userEvent.setup();

  describe("should render the form correctly", () => {
    test("text fields", async () => {
      await renderPasswordRepeatComponent();

      const passwordField = screen.getByTestId("password");

      expect(passwordField.querySelector("label")).toHaveTextContent("Jelszó");
      expect(passwordField.querySelector("input")?.type).toBe("password");

      const passwordAgainField = screen.getByTestId("password-again");

      expect(passwordAgainField.querySelector("label")).toHaveTextContent(
        "Jelszó újra",
      );
      expect(passwordAgainField.querySelector("input")?.type).toBe("password");
    });

    test("password helpers", async () => {
      await renderPasswordRepeatComponent();

      const passwordCharacters = screen.getByTestId("password-characters");

      expect(passwordCharacters).toHaveTextContent(
        "A jelszó minimális hossza 8 karakter. Engedélyezett karakterek: magyar ABC kis- és nagybetűi, számok, illetve az alábbi speciális karakterek: . _ + # % @ -",
      );

      const passwordStrength = screen.queryByTestId("password-strength");

      expect(passwordStrength).toBeNull();

      const passwordGenerateHelp = screen.getByTestId("password-generate-help");

      expect(passwordGenerateHelp).toHaveTextContent(
        "Erős jelszavak generálása pofonegyszerűen - segédlet az alábbi oldalon.",
      );

      const helpLink =
        passwordGenerateHelp?.querySelector<HTMLAnchorElement>("a");

      expect(helpLink?.href).toBe(
        "https://hvg.hu/tudomany/20171117_eros_jelszo_letrehozasa_generator_nehezen_kitalalhato_jelszavak_nehezen_feltorheto_jelszo_biztonsagos_milyen_jelszot_valasszak",
      );
      expect(helpLink?.target).toBe("_blank");
    });

    test("toggle password button changes the type of the password inputs", async () => {
      await renderPasswordRepeatComponent();

      const togglePassword = screen.getByTestId("toggle-password");

      await user.click(togglePassword);

      const passwordInput = screen
        .getByTestId("password")
        .querySelector("input")!;

      expect(passwordInput.type).toBe("text");

      const passwordAgainInput = screen
        .getByTestId("password-again")
        .querySelector("input")!;

      expect(passwordAgainInput.type).toBe("text");
    });
  });

  test("if the password is valid, its strength is shown", async () => {
    await renderPasswordRepeatComponent();

    const passwordInput = screen
      .getByTestId("password")
      .querySelector("input")!;
    await user.type(passwordInput, "weakpass");

    const passwordStrength = screen.getByTestId("password-strength");

    expect(passwordStrength).toHaveTextContent("A jelszó erőssége: gyenge");
  });
});

@Component({
  standalone: true,
  selector: "app-host-component",
  template: `
    <form [formGroup]="testForm">
      <app-password-repeat formGroupName="passwords" />
    </form>
  `,
  imports: [ReactiveFormsModule, PasswordRepeatComponent],
})
class TestHostComponent {
  private readonly formBuilder = inject(FormBuilder);

  private readonly passwordPattern = new RegExp(
    `([${allowedPasswordCharacters}]){8,}`,
  );

  testForm = this.formBuilder.group({
    passwords: this.formBuilder.group(
      {
        password: [
          "",
          [Validators.required, Validators.pattern(this.passwordPattern)],
        ],
        passwordAgain: [
          "",
          [Validators.required, Validators.pattern(this.passwordPattern)],
        ],
      },
      { validators: [passwordMatchValidator] },
    ),
  });
}

async function renderPasswordRepeatComponent() {
  return render(TestHostComponent);
}
