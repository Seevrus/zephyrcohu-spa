import { NgClass } from "@angular/common";
import { Component, inject, type OnDestroy, type OnInit } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatFormField } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { type Subscription } from "rxjs";
import zxcvbn from "zxcvbn";

import { passwordMatchValidator } from "../../validators/password-match.validator";

@Component({
  selector: "app-register",
  host: {
    class: "app-register",
  },
  imports: [
    MatButton,
    MatCheckbox,
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
  isPasswordVisible = false;
  private passwordChangedSubscription: Subscription | undefined;

  private readonly passwordPattern =
    /^([a-zA-ZíűáéúőóüöÍŰÁÉÚŐÓÜÖ0-9._+#%@-]){8,}$/;

  passwordStrength = "";

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

  get cookies() {
    return this.registerForm.get("cookies");
  }

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

  onSubmit() {
    console.log(this.registerForm);
  }

  togglePassword() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
}
