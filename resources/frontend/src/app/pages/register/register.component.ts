import { NgClass } from "@angular/common";
import { Component, inject, type OnDestroy, type OnInit } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatFormField } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { injectMutation } from "@tanstack/angular-query-experimental";
import { type Subscription } from "rxjs";
import zxcvbn from "zxcvbn";

import { ButtonLoadableComponent } from "../../components/button-loadable/button-loadable.component";
import { UsersQueryService } from "../../services/users.query.service";
import { passwordMatchValidator } from "../../validators/password-match.validator";

@Component({
  selector: "app-register",
  host: {
    class: "app-register",
  },
  imports: [
    ButtonLoadableComponent,
    MatCheckbox,
    MatButton,
    MatFormField,
    MatInputModule,
    NgClass,
    ReactiveFormsModule,
  ],
  templateUrl: "./register.component.html",
  styleUrl: "./register.component.scss",
})
export class RegisterComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly usersQueryService = inject(UsersQueryService);

  isPasswordVisible = false;
  private passwordChangedSubscription: Subscription | undefined;

  private readonly passwordPattern =
    /^([a-zA-ZíűáéúőóüöÍŰÁÉÚŐÓÜÖ0-9._+#%@-]){8,}$/;

  passwordStrength = "";

  readonly registerMutation = injectMutation(() =>
    this.usersQueryService.register(),
  );

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

  get passwords() {
    return this.registerForm.get("passwords");
  }

  get password() {
    return this.registerForm.get("passwords.password");
  }

  checkPasswordStrength() {
    if (!this.password?.valid) {
      this.passwordStrength = "";
      return;
    }

    const email = this.email?.value ?? "";
    const password = this.password?.value ?? "";

    const { score } = zxcvbn(password, [email]);

    const feedbackByStrength = {
      0: "nagyon gyenge",
      1: "gyenge",
      2: "közepes",
      3: "erős",
      4: "nagyon erős",
    };

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
    } catch (error) {}
  }

  togglePassword() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
}
