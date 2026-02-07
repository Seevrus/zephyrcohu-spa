import {
  Component,
  inject,
  type OnDestroy,
  signal,
  ViewChild,
} from "@angular/core";
import {
  FormBuilder,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatFormField } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { injectMutation } from "@tanstack/angular-query-experimental";
import { type RecaptchaComponent, RecaptchaModule } from "ng-recaptcha-2";

import { ZephyrHttpError } from "../../../api/ZephyrHttpError";
import { zephyr } from "../../../constants/forms";
import { ButtonLoadableComponent } from "../../components/button-loadable/button-loadable.component";
import { CaptchaFailedComponent } from "../../components/form-alerts/captcha-failed/captcha-failed.component";
import { FormUnexpectedErrorComponent } from "../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { RegisterAlreadyExistsComponent } from "../../components/form-alerts/register-already-exists/register-already-exists.component";
import { RegisterExistsNotConfirmedComponent } from "../../components/form-alerts/register-exists-not-confirmed/register-exists-not-confirmed.component";
import { RegisterResendEmailErrorComponent } from "../../components/form-alerts/register-resend-email-error/register-resend-email-error.component";
import { RegisterResendEmailSuccessComponent } from "../../components/form-alerts/register-resend-email-success/register-resend-email-success.component";
import { RegisterSuccessComponent } from "../../components/form-alerts/register-success/register-success.component";
import { PasswordRepeatComponent } from "../../components/password-repeat/password-repeat.component";
import { CaptchaService } from "../../services/captcha.service";
import { ResendConfirmationEmailService } from "../../services/resend-confirmation-email.service";
import { UsersQueryService } from "../../services/users.query.service";
import { passwordValidator } from "../../validators/password.validator";
import { passwordMatchValidator } from "../../validators/password-match.validator";

@Component({
  host: {
    class: "app-register",
  },
  imports: [
    ButtonLoadableComponent,
    FormUnexpectedErrorComponent,
    MatCheckbox,
    MatFormField,
    MatInputModule,
    PasswordRepeatComponent,
    ReactiveFormsModule,
    RecaptchaModule,
    RegisterAlreadyExistsComponent,
    RegisterExistsNotConfirmedComponent,
    RegisterResendEmailErrorComponent,
    RegisterResendEmailSuccessComponent,
    RegisterSuccessComponent,
    CaptchaFailedComponent,
  ],
  selector: "app-register",
  styleUrl: "./register.component.scss",
  templateUrl: "./register.component.html",
})
export class RegisterComponent implements OnDestroy {
  @ViewChild("captchaRef") protected captchaRef!: RecaptchaComponent;
  @ViewChild(FormGroupDirective) private formDir?: FormGroupDirective;

  private readonly captchaService = inject(CaptchaService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly resendRegistrationEmailService = inject(
    ResendConfirmationEmailService,
  );
  private readonly usersQueryService = inject(UsersQueryService);

  protected readonly isRegisterInProgress = signal(false);
  protected readonly registeredEmail = signal<string>("");
  readonly registerErrorMessage = signal<string>("");
  protected readonly resendConfirmationEmailErrorMessage =
    this.resendRegistrationEmailService.resendConfirmationEmailErrorMessage;
  protected readonly resentEmail =
    this.resendRegistrationEmailService.resentEmail;

  protected readonly registerMutation = injectMutation(() =>
    this.usersQueryService.register(),
  );

  readonly zephyrEmail = zephyr;

  readonly registerForm = this.formBuilder.group({
    email: ["", [Validators.required, Validators.email]],
    passwords: this.formBuilder.group(
      {
        password: ["", [Validators.required, passwordValidator]],
        passwordAgain: ["", [Validators.required, passwordValidator]],
      },
      { validators: [passwordMatchValidator] },
    ),
    newsletter: false,
  });

  protected readonly email = this.registerForm.get("email");

  protected readonly password = this.registerForm.get("passwords.password");

  ngOnDestroy() {
    this.resendConfirmationEmailErrorMessage.set("");
    this.resentEmail.set("");
  }

  async onRegisterSubmit(token: string | null) {
    this.isRegisterInProgress.set(true);

    try {
      const { score, success } = await this.captchaService.verifyCaptcha(token);

      if (!success || score < 0.5) {
        this.registerErrorMessage.set("CAPTCHA_FAILED");
        this.captchaRef.reset();
      } else {
        await this.onRegister();
      }
    } finally {
      this.isRegisterInProgress.set(false);
    }
  }

  private async onRegister() {
    try {
      this.registeredEmail.set("");
      this.registerErrorMessage.set("");
      this.resendConfirmationEmailErrorMessage.set("");
      this.resentEmail.set("");

      this.registerForm.markAsPristine();

      const email = this.email?.value ?? "";
      const password = this.password?.value ?? "";
      const newsletter = this.registerForm.get("newsletter")?.value ?? false;

      await this.registerMutation.mutateAsync({
        email,
        password,
        newsletter,
      });

      this.registeredEmail.set(email);
      this.formDir?.resetForm();
    } catch (error) {
      if (error instanceof ZephyrHttpError) {
        this.registerErrorMessage.set(error.code);
      } else {
        this.registerErrorMessage.set("INTERNAL_SERVER_ERROR");
      }
    }
  }

  async onResendConfirmationEmail() {
    this.registeredEmail.set("");
    this.registerErrorMessage.set("");

    const email = this.email?.value ?? "";
    await this.resendRegistrationEmailService.onResendConfirmationEmail(email);
  }
}
