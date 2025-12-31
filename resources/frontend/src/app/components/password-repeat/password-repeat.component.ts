import { NgClass } from "@angular/common";
import {
  Component,
  inject,
  input,
  type OnDestroy,
  type OnInit,
  signal,
} from "@angular/core";
import {
  type AbstractControl,
  ControlContainer,
  type FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatError, MatFormField } from "@angular/material/form-field";
import { MatInput, MatLabel } from "@angular/material/input";
import { passwordStrength } from "check-password-strength";
import { type Subscription } from "rxjs";

import { allowedPasswordCharacters } from "../../../constants/forms";

@Component({
  selector: "app-password-repeat",
  imports: [
    MatButton,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    NgClass,
    ReactiveFormsModule,
  ],
  templateUrl: "./password-repeat.component.html",
  styleUrl: "./password-repeat.component.scss",
  viewProviders: [
    {
      provide: ControlContainer,
      useFactory: () =>
        inject(ControlContainer, { optional: true, skipSelf: true }),
    },
  ],
})
export class PasswordRepeatComponent implements OnInit, OnDestroy {
  formGroupName = input.required<string | null>();
  showMessage = input.required<boolean | undefined>();

  protected parentContainer = inject(ControlContainer, {
    optional: true,
    skipSelf: true,
  });

  protected readonly isPasswordVisible = signal(false);
  private passwordChangedSubscription: Subscription | undefined;
  protected readonly passwordStrength = signal<string>("");

  ngOnInit(): void {
    this.passwordChangedSubscription = this.password?.valueChanges.subscribe(
      (password) => password && this.checkPasswordStrength(),
    );
  }

  ngOnDestroy() {
    this.passwordChangedSubscription?.unsubscribe();
  }

  protected get passwordsFormGroup() {
    const parentForm = this.parentContainer?.control as FormGroup;

    if (!parentForm) {
      return null;
    }

    return parentForm.get(this.formGroupName()!) as FormGroup | null;
  }

  protected get password(): AbstractControl<string> | null | undefined {
    return this.passwordsFormGroup?.get("password");
  }

  protected get passwordAgain(): AbstractControl<string> | null | undefined {
    return this.passwordsFormGroup?.get("passwordAgain");
  }

  private checkPasswordStrength() {
    if (!this.password?.valid) {
      this.passwordStrength.set("");
      return;
    }

    const password = this.password?.value ?? "";

    const { id: score } = passwordStrength(
      password,
      undefined,
      allowedPasswordCharacters,
    );

    const feedbackByStrength = ["nagyon gyenge", "gyenge", "közepes", "erős"];
    this.passwordStrength.set(feedbackByStrength[score]);
  }

  protected getPasswordStrengthClass(strength: string) {
    switch (strength.toLowerCase()) {
      case "nagyon gyenge":
        return "very-weak";
      case "gyenge":
        return "weak";
      case "erős":
        return "strong";
      case "nagyon erős":
        return "very-strong";
      case "közepes":
      default:
        return "fair";
    }
  }

  protected togglePassword() {
    this.isPasswordVisible.set(!this.isPasswordVisible());
  }
}
