import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { injectMutation } from "@tanstack/angular-query-experimental";

import { ZephyrHttpError } from "../../../api/ZephyrHttpError";
import { zephyr } from "../../../constants/forms";
import { ButtonLoadableComponent } from "../../components/button-loadable/button-loadable.component";
import { BadCredentialsComponent } from "../../components/form-alerts/bad-credentials/bad-credentials.component";
import { EmailCodeExpiredComponent } from "../../components/form-alerts/email-code-expired/email-code-expired.component";
import { EmailLinkErrorComponent } from "../../components/form-alerts/email-link-error/email-link-error.component";
import { FormUnexpectedErrorComponent } from "../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { PasswordRepeatComponent } from "../../components/password-repeat/password-repeat.component";
import { UsersQueryService } from "../../services/users.query.service";
import { passwordValidator } from "../../validators/password.validator";
import { passwordMatchValidator } from "../../validators/password-match.validator";

@Component({
  selector: "app-reset-password",
  host: {
    class: "app-reset-password",
  },
  imports: [
    BadCredentialsComponent,
    ButtonLoadableComponent,
    EmailCodeExpiredComponent,
    EmailLinkErrorComponent,
    FormUnexpectedErrorComponent,
    PasswordRepeatComponent,
    ReactiveFormsModule,
  ],
  templateUrl: "./reset-password.component.html",
  styleUrl: "./reset-password.component.scss",
})
export class ResetPasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly usersQueryService = inject(UsersQueryService);

  readonly code = input<string>();
  readonly email = input<string>();

  protected readonly parameterError = computed(
    () => this.code() === undefined || this.email() === undefined,
  );

  protected readonly isPasswordResetSuccessful = signal<boolean | undefined>(
    undefined,
  );

  protected readonly isPasswordResetInProgress = signal(false);
  /**
   * | BAD_CREDENTIALS
   * | CODE_EXPIRED
   * | INTERNAL_SERVER_ERROR
   */
  protected readonly passwordResetErrorMessage = signal<string>("");
  protected readonly zephyrEmail = zephyr;

  protected readonly resetPasswordMutation = injectMutation(() =>
    this.usersQueryService.resetPassword(),
  );

  private readonly patchEmailEffect = effect(() => {
    const email = this.email();

    if (email !== undefined) {
      this.resetPasswordForm.patchValue({ email: decodeURIComponent(email) });
    }
  });

  readonly resetPasswordForm = this.formBuilder.group({
    email: ["", [Validators.required, Validators.email]],
    passwords: this.formBuilder.group(
      {
        password: ["", [Validators.required, passwordValidator]],
        passwordAgain: ["", [Validators.required, passwordValidator]],
      },
      { validators: [passwordMatchValidator] },
    ),
  });

  protected readonly emailControl = this.resetPasswordForm.get("email");

  protected readonly password =
    this.resetPasswordForm.get("passwords.password");

  protected async onResetPassword() {
    this.isPasswordResetInProgress.set(true);

    try {
      this.isPasswordResetSuccessful.set(undefined);
      this.passwordResetErrorMessage.set("");

      this.resetPasswordForm.markAsPristine();

      const codeParameter = this.code();
      const code = codeParameter ? decodeURIComponent(codeParameter) : "";
      const email = this.emailControl?.value ?? "";
      const password = this.password?.value ?? "";

      await this.resetPasswordMutation.mutateAsync({
        code,
        email,
        password,
      });

      this.router.navigate(["/"]);
    } catch (error) {
      this.isPasswordResetSuccessful.set(false);

      if (error instanceof ZephyrHttpError) {
        this.passwordResetErrorMessage.set(error.code);
      } else {
        this.passwordResetErrorMessage.set("INTERNAL_SERVER_ERROR");
      }
    } finally {
      this.isPasswordResetInProgress.set(false);
    }
  }
}
