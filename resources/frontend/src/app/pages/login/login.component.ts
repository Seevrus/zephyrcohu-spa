import { Component, inject, type OnDestroy, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatFormField } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { Router } from "@angular/router";
import { injectMutation } from "@tanstack/angular-query-experimental";

import { ZephyrHttpError } from "../../../api/ZephyrHttpError";
import { ButtonLoadableComponent } from "../../components/button-loadable/button-loadable.component";
import { BadCredentialsComponent } from "../../components/form-alerts/bad-credentials/bad-credentials.component";
import { FormUnexpectedErrorComponent } from "../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { RegisterExistsNotConfirmedComponent } from "../../components/form-alerts/register-exists-not-confirmed/register-exists-not-confirmed.component";
import { RegisterResendEmailErrorComponent } from "../../components/form-alerts/register-resend-email-error/register-resend-email-error.component";
import { RegisterResendEmailSuccessComponent } from "../../components/form-alerts/register-resend-email-success/register-resend-email-success.component";
import { TooManyLoginAttemptsComponent } from "../../components/form-alerts/too-many-login-attempts/too-many-login-attempts.component";
import { UserAlreadyLoggedInComponent } from "../../components/form-alerts/user-already-logged-in/user-already-logged-in.component";
import { ResendConfirmationEmailService } from "../../services/resend-confirmation-email.service";
import { UsersQueryService } from "../../services/users.query.service";
import { passwordValidator } from "../../validators/password.validator";

@Component({
  selector: "app-login",
  host: {
    class: "app-login",
  },
  imports: [
    BadCredentialsComponent,
    ButtonLoadableComponent,
    FormUnexpectedErrorComponent,
    MatButton,
    MatFormField,
    MatInputModule,
    ReactiveFormsModule,
    RegisterResendEmailErrorComponent,
    RegisterResendEmailSuccessComponent,
    RegisterExistsNotConfirmedComponent,
    TooManyLoginAttemptsComponent,
    UserAlreadyLoggedInComponent,
  ],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.scss",
})
export class LoginComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly resendRegistrationEmailService = inject(
    ResendConfirmationEmailService,
  );
  private readonly usersQueryService = inject(UsersQueryService);

  readonly isPasswordVisible = signal(false);

  /**
   * BAD_CREDENTIALS
   * || INTERNAL_SERVER_ERROR
   * || TOO_MANY_LOGIN_ATTEMPTS
   * || USER_ALREADY_LOGGED_IN
   * || USER_NOT_CONFIRMED
   */
  readonly loginErrorMessage = signal("");
  readonly resendConfirmationEmailErrorMessage =
    this.resendRegistrationEmailService.resendConfirmationEmailErrorMessage;
  readonly resentEmail = this.resendRegistrationEmailService.resentEmail;

  readonly loginForm = new FormGroup({
    email: new FormControl("", {
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl("", {
      validators: [Validators.required, passwordValidator],
    }),
  });

  protected readonly loginMutation = injectMutation(() =>
    this.usersQueryService.login(),
  );

  protected readonly email = this.loginForm.get("email");

  async onLogin() {
    try {
      this.loginErrorMessage.set("");
      this.resendConfirmationEmailErrorMessage.set("");
      this.resentEmail.set("");

      this.loginForm.markAsPristine();

      const email = this.loginForm.get("email")?.value ?? "";
      const password = this.loginForm.get("password")?.value ?? "";

      await this.loginMutation.mutateAsync({ email, password });

      this.loginForm.reset();

      this.router.navigate(["/"]);
    } catch (error) {
      if (error instanceof ZephyrHttpError) {
        this.loginErrorMessage.set(error.code);
      } else {
        this.loginErrorMessage.set("INTERNAL_SERVER_ERROR");
      }
    }
  }

  ngOnDestroy() {
    this.resendConfirmationEmailErrorMessage.set("");
    this.resentEmail.set("");
  }

  async onResendConfirmationEmail() {
    this.loginErrorMessage.set("");

    const email = this.email?.value ?? "";
    await this.resendRegistrationEmailService.onResendConfirmationEmail(email);
  }

  togglePassword() {
    this.isPasswordVisible.set(!this.isPasswordVisible());
  }
}
