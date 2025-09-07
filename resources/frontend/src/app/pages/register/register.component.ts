import { NgClass } from "@angular/common";
import { Component, inject, type OnDestroy, type OnInit } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatFormField } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { RouterLink } from "@angular/router";
import { injectMutation } from "@tanstack/angular-query-experimental";
import { passwordStrength } from "check-password-strength";
import { type Subscription } from "rxjs";

import { ZephyrHttpError } from "../../../api/ZephyrHttpError";
import { zephyr } from "../../../constants/email";
import { ButtonLoadableComponent } from "../../components/button-loadable/button-loadable.component";
import { ErrorCardComponent } from "../../components/error-card/error-card.component";
import { SuccessCardComponent } from "../../components/success-card/success-card.component";
import { UsersQueryService } from "../../services/users.query.service";
import { passwordMatchValidator } from "../../validators/password-match.validator";

@Component({
  selector: "app-register",
  host: {
    class: "app-register",
  },
  imports: [
    ButtonLoadableComponent,
    ErrorCardComponent,
    MatCheckbox,
    MatButton,
    MatFormField,
    MatInputModule,
    NgClass,
    ReactiveFormsModule,
    SuccessCardComponent,
    RouterLink,
  ],
  templateUrl: "./register.component.html",
  styleUrl: "./register.component.scss",
})
export class RegisterComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly usersQueryService = inject(UsersQueryService);

  isPasswordVisible = false;
  private passwordChangedSubscription: Subscription | undefined;

  private readonly allowedPasswordCharacters =
    "a-zA-ZíűáéúőóüöÍŰÁÉÚŐÓÜÖ0-9._+#%@-";

  private readonly passwordPattern = new RegExp(
    `([${this.allowedPasswordCharacters}]){8,}`,
  );

  passwordStrength = "";
  registerErrorMessage = "";

  readonly registerMutation = injectMutation(() =>
    this.usersQueryService.register(),
  );

  readonly zephyrEmail = zephyr;

  ngOnInit(): void {
    this.passwordChangedSubscription = this.password?.valueChanges.subscribe(
      (password) => password && this.checkPasswordStrength(),
    );
  }

  ngOnDestroy() {
    this.passwordChangedSubscription?.unsubscribe();
  }

  readonly registerForm = this.formBuilder.group({
    email: ["", [Validators.required, Validators.email]],
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
    newsletter: false,
    cookies: [false, Validators.requiredTrue],
  });

  get email() {
    return this.registerForm.get("email");
  }

  get password() {
    return this.registerForm.get("passwords.password");
  }

  get passwords() {
    return this.registerForm.get("passwords");
  }

  checkPasswordStrength() {
    if (!this.password?.valid) {
      this.passwordStrength = "";
      return;
    }

    const password = this.password?.value ?? "";

    const { id: score } = passwordStrength(
      password,
      undefined,
      this.allowedPasswordCharacters,
    );

    const feedbackByStrength = ["nagyon gyenge", "gyenge", "közepes", "erős"];
    this.passwordStrength = feedbackByStrength[score];
  }

  getPasswordStrengthClass(strength: string) {
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

  async onSubmit() {
    try {
      const email = this.email?.value ?? "";
      const password = this.password?.value ?? "";
      const newsletter = this.registerForm.get("newsletter")?.value ?? false;
      const cookiesAccepted = this.registerForm.get("cookies")?.value ?? false;

      await this.registerMutation.mutateAsync({
        email,
        password,
        newsletter,
        cookiesAccepted,
      });
    } catch (error) {
      if (error instanceof ZephyrHttpError) {
        this.registerErrorMessage = error.code;
      } else {
        this.registerErrorMessage = "Ismeretlen hiba";
      }
    }
  }

  togglePassword() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
}
