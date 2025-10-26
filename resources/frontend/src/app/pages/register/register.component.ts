import { NgClass } from "@angular/common";
import {
  Component,
  inject,
  type OnDestroy,
  type OnInit,
  signal,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatFormField } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { injectMutation } from "@tanstack/angular-query-experimental";
import { passwordStrength } from "check-password-strength";
import { type Subscription } from "rxjs";

import { ZephyrHttpError } from "../../../api/ZephyrHttpError";
import { zephyr } from "../../../constants/email";
import { ButtonLoadableComponent } from "../../components/button-loadable/button-loadable.component";
import { RegisterAlreadyExistsComponent } from "../../components/form-alerts/register-already-exists/register-already-exists.component";
import { RegisterExistsNotConfirmedComponent } from "../../components/form-alerts/register-exists-not-confirmed/register-exists-not-confirmed.component";
import { RegisterResendEmailErrorComponent } from "../../components/form-alerts/register-resend-email-error/register-resend-email-error.component";
import { RegisterResendEmailSuccessComponent } from "../../components/form-alerts/register-resend-email-success/register-resend-email-success.component";
import { RegisterSuccessComponent } from "../../components/form-alerts/register-success/register-success.component";
import { RegisterUnexpectedErrorComponent } from "../../components/form-alerts/register-unexpected-error/register-unexpected-error.component";
import { UsersQueryService } from "../../services/users.query.service";
import { passwordMatchValidator } from "../../validators/password-match.validator";

@Component({
  host: {
    class: "app-register",
  },
  imports: [
    ButtonLoadableComponent,
    MatButton,
    MatCheckbox,
    MatFormField,
    MatInputModule,
    NgClass,
    ReactiveFormsModule,
    RegisterAlreadyExistsComponent,
    RegisterExistsNotConfirmedComponent,
    RegisterResendEmailErrorComponent,
    RegisterResendEmailSuccessComponent,
    RegisterSuccessComponent,
    RegisterUnexpectedErrorComponent,
  ],
  selector: "app-register",
  styleUrl: "./register.component.scss",
  templateUrl: "./register.component.html",
})
export class RegisterComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly usersQueryService = inject(UsersQueryService);

  private readonly allowedPasswordCharacters =
    "a-zA-ZíűáéúőóüöÍŰÁÉÚŐÓÜÖ0-9._+#%@-";

  readonly isPasswordVisible = signal(false);
  private passwordChangedSubscription: Subscription | undefined;

  private readonly passwordPattern = new RegExp(
    `([${this.allowedPasswordCharacters}]){8,}`,
  );

  readonly passwordStrength = signal<string>("");
  readonly registeredEmail = signal<string>("");
  readonly registerErrorMessage = signal<string>("");

  /**
   * | EMAIL_NOT_FOUND
   * | INTERNAL_SERVER_ERROR
   * | USER_ALREADY_CONFIRMED
   *
   * But we will be a bit optimistic here. Given how the action is enabled, only unexpected errors will occur.
   */
  readonly resendConfirmationEmailErrorMessage = signal<string>("");
  readonly resentEmail = signal<string>("");

  private readonly registerMutation = injectMutation(() =>
    this.usersQueryService.register(),
  );

  private readonly resendRegistrationEmailMutation = injectMutation(() =>
    this.usersQueryService.resendRegistrationConfirmEmail(),
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
      this.passwordStrength.set("");
      return;
    }

    const password = this.password?.value ?? "";

    const { id: score } = passwordStrength(
      password,
      undefined,
      this.allowedPasswordCharacters,
    );

    const feedbackByStrength = ["nagyon gyenge", "gyenge", "közepes", "erős"];
    this.passwordStrength.set(feedbackByStrength[score]);
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

  async onRegister() {
    try {
      this.registeredEmail.set("");
      this.registerErrorMessage.set("");
      this.resendConfirmationEmailErrorMessage.set("");
      this.resentEmail.set("");

      this.registerForm.markAsPristine();

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

      this.registeredEmail.set(email);
      this.registerForm.reset();
    } catch (error) {
      if (error instanceof ZephyrHttpError) {
        this.registerErrorMessage.set(error.code);
      } else {
        this.registerErrorMessage.set("INTERNAL_SERVER_ERROR");
      }
    }
  }

  async onResendConfirmationEmail() {
    try {
      this.registeredEmail.set("");
      this.registerErrorMessage.set("");
      this.resendConfirmationEmailErrorMessage.set("");
      this.resentEmail.set("");

      const email = this.email?.value ?? "";
      await this.resendRegistrationEmailMutation.mutateAsync({ email });
      this.resentEmail.set(email);
    } catch (error) {
      if (error instanceof ZephyrHttpError) {
        this.resendConfirmationEmailErrorMessage.set(error.code);
      } else {
        this.resendConfirmationEmailErrorMessage.set("INTERNAL_SERVER_ERROR");
      }
    }
  }

  togglePassword() {
    this.isPasswordVisible.set(!this.isPasswordVisible());
  }
}
