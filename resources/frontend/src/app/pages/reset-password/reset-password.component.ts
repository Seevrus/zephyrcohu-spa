import { Component, inject, type OnInit, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { injectMutation } from "@tanstack/angular-query-experimental";

import { ZephyrHttpError } from "../../../api/ZephyrHttpError";
import { zephyr } from "../../../constants/forms";
import { type QueryParamsByPath } from "../../app.routes";
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
export class ResetPasswordComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usersQueryService = inject(UsersQueryService);

  private readonly emailCode = signal<string>("");
  protected readonly isPasswordResetSuccessful = signal<boolean | undefined>(
    undefined,
  );
  protected readonly parameterError = signal<boolean>(false);

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

  ngOnInit() {
    this.route.queryParams.subscribe(
      ({ code, email }: QueryParamsByPath["profil/jelszo_helyreallit"]) => {
        if (code === undefined || email === undefined) {
          this.parameterError.set(true);
        } else {
          this.emailCode.set(decodeURIComponent(code));
          this.resetPasswordForm.patchValue({
            email: decodeURIComponent(email),
          });
        }
      },
    );
  }

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

  get email() {
    return this.resetPasswordForm.get("email");
  }

  protected get password() {
    return this.resetPasswordForm.get("passwords.password");
  }

  protected async onResetPassword() {
    try {
      this.isPasswordResetSuccessful.set(undefined);
      this.passwordResetErrorMessage.set("");

      this.resetPasswordForm.markAsPristine();

      const code = this.emailCode();
      const email = this.email?.value ?? "";
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
    }
  }
}
