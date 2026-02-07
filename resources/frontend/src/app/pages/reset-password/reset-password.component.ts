import {
  Component,
  inject,
  type OnDestroy,
  type OnInit,
  signal,
  ViewChild,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { injectMutation } from "@tanstack/angular-query-experimental";
import { type RecaptchaComponent, RecaptchaModule } from "ng-recaptcha-2";
import type { Subscription } from "rxjs";

import { ZephyrHttpError } from "../../../api/ZephyrHttpError";
import { zephyr } from "../../../constants/forms";
import { type QueryParamsByPath } from "../../app.routes";
import { ButtonLoadableComponent } from "../../components/button-loadable/button-loadable.component";
import { BadCredentialsComponent } from "../../components/form-alerts/bad-credentials/bad-credentials.component";
import { CaptchaFailedComponent } from "../../components/form-alerts/captcha-failed/captcha-failed.component";
import { EmailCodeExpiredComponent } from "../../components/form-alerts/email-code-expired/email-code-expired.component";
import { EmailLinkErrorComponent } from "../../components/form-alerts/email-link-error/email-link-error.component";
import { FormUnexpectedErrorComponent } from "../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { PasswordRepeatComponent } from "../../components/password-repeat/password-repeat.component";
import { CaptchaService } from "../../services/captcha.service";
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
    CaptchaFailedComponent,
    EmailCodeExpiredComponent,
    EmailLinkErrorComponent,
    FormUnexpectedErrorComponent,
    PasswordRepeatComponent,
    ReactiveFormsModule,
    RecaptchaModule,
  ],
  templateUrl: "./reset-password.component.html",
  styleUrl: "./reset-password.component.scss",
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  @ViewChild("captchaRef") protected captchaRef!: RecaptchaComponent;

  private readonly captchaService = inject(CaptchaService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usersQueryService = inject(UsersQueryService);

  private queryParamsSubscription: Subscription | null = null;

  private readonly emailCode = signal<string>("");
  protected readonly isPasswordResetSuccessful = signal<boolean | undefined>(
    undefined,
  );
  protected readonly parameterError = signal<boolean>(false);

  protected readonly isPasswordResetInProgress = signal(false);
  /**
   * | BAD_CREDENTIALS
   * | CAPTCHA_FAILED
   * | CODE_EXPIRED
   * | INTERNAL_SERVER_ERROR
   */
  protected readonly passwordResetErrorMessage = signal<string>("");
  protected readonly zephyrEmail = zephyr;

  protected readonly resetPasswordMutation = injectMutation(() =>
    this.usersQueryService.resetPassword(),
  );

  ngOnInit() {
    this.queryParamsSubscription = this.route.queryParams.subscribe(
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

  ngOnDestroy() {
    this.queryParamsSubscription?.unsubscribe();
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

  protected readonly email = this.resetPasswordForm.get("email");

  protected readonly password =
    this.resetPasswordForm.get("passwords.password");

  protected async onResetPasswordSubmit(token: string | null) {
    this.isPasswordResetInProgress.set(true);

    try {
      const { score, success } = await this.captchaService.verifyCaptcha(token);

      if (!success || score < 0.5) {
        this.passwordResetErrorMessage.set("CAPTCHA_FAILED");
        this.captchaRef.reset();
      } else {
        await this.onResetPassword();
      }
    } finally {
      this.isPasswordResetInProgress.set(false);
    }
  }

  private async onResetPassword() {
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
