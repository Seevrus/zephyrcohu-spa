import {
  Component,
  inject,
  type OnDestroy,
  type OnInit,
  signal,
  ViewChild,
} from "@angular/core";
import {
  disabled,
  email,
  form,
  FormField,
  pattern,
  required,
  submit,
} from "@angular/forms/signals";
import { MatButton } from "@angular/material/button";
import {
  MatError,
  MatFormField,
  MatInput,
  MatLabel,
} from "@angular/material/input";
import { ActivatedRoute } from "@angular/router";
import { injectMutation } from "@tanstack/angular-query-experimental";
import { type RecaptchaComponent, RecaptchaModule } from "ng-recaptcha-2";
import { type Subscription } from "rxjs";

import { ZephyrHttpError } from "../../../api/ZephyrHttpError";
import { type QueryParamsByPath } from "../../app.routes";
import { ButtonLoadableComponent } from "../../components/button-loadable/button-loadable.component";
import { BadCredentialsComponent } from "../../components/form-alerts/bad-credentials/bad-credentials.component";
import { CaptchaFailedComponent } from "../../components/form-alerts/captcha-failed/captcha-failed.component";
import { EmailCodeExpiredComponent } from "../../components/form-alerts/email-code-expired/email-code-expired.component";
import { EmailLinkErrorComponent } from "../../components/form-alerts/email-link-error/email-link-error.component";
import { FormUnexpectedErrorComponent } from "../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { ProfileEmailUpdatedComponent } from "../../components/form-alerts/profile-email-updated/profile-email-updated.component";
import { CaptchaService } from "../../services/captcha.service";
import { UsersQueryService } from "../../services/users.query.service";
import { passwordPattern } from "../../validators/password.validator";

@Component({
  host: {
    class: "app-profile-update-email",
  },
  selector: "app-profile-update-email",
  templateUrl: "./profile-update-email.component.html",
  styleUrl: "./profile-update-email.component.scss",
  imports: [
    BadCredentialsComponent,
    ButtonLoadableComponent,
    CaptchaFailedComponent,
    EmailCodeExpiredComponent,
    EmailLinkErrorComponent,
    FormField,
    FormUnexpectedErrorComponent,
    MatButton,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    ProfileEmailUpdatedComponent,
    RecaptchaModule,
  ],
})
export class ProfileUpdateEmailComponent implements OnInit, OnDestroy {
  @ViewChild("captchaRef") protected captchaRef!: RecaptchaComponent;

  private readonly captchaService = inject(CaptchaService);
  private readonly route = inject(ActivatedRoute);
  private readonly usersQueryService = inject(UsersQueryService);

  private queryParamsSubscription: Subscription | null = null;

  protected readonly confirmNewEmailMutation = injectMutation(() =>
    this.usersQueryService.updateProfileConfirmEmail(),
  );

  protected readonly confirmedNewEmail = signal("");

  /**
   * BAD_CREDENTIALS
   * || BAD_EMAIL_CODE
   * || BAD_QUERY_PARAMS
   * || CAPTCHA_FAILED
   * || CODE_EXPIRED
   * || INTERNAL_SERVER_ERROR
   */
  protected readonly confirmError = signal<string>("");

  protected readonly isConfirmNewEmailInProgress = signal(false);
  protected readonly isPasswordVisible = signal(false);

  private readonly updateEmailModel = signal({
    newEmail: "",
    emailCode: "",
    password: "",
  });

  protected readonly updateEmailForm = form(
    this.updateEmailModel,
    (schemaPath) => {
      disabled(schemaPath.newEmail);
      required(schemaPath.newEmail, { message: "Kötelező mező" });
      email(schemaPath.newEmail, {
        message: "Email cím formátuma nem megfelelő",
      });

      disabled(schemaPath.emailCode);
      required(schemaPath.emailCode);

      required(schemaPath.password, { message: "Kötelező mező" });
      pattern(schemaPath.password, passwordPattern, {
        message: "Jelszó formátuma nem megfelelő",
      });
    },
  );

  ngOnInit() {
    this.queryParamsSubscription = this.route.queryParams.subscribe(
      ({ code, email }: QueryParamsByPath["profil/email_frissit"]) => {
        if (code === undefined || email === undefined) {
          this.confirmError.set("BAD_QUERY_PARAMS");
        } else {
          this.updateEmailForm
            .newEmail()
            .setControlValue(decodeURIComponent(email));

          this.updateEmailForm
            .emailCode()
            .setControlValue(decodeURIComponent(code));
        }
      },
    );
  }

  ngOnDestroy() {
    this.queryParamsSubscription?.unsubscribe();
  }

  protected onConfirmNewEmailSubmit(event: Event) {
    event.preventDefault();
    this.captchaRef.execute();
  }

  protected async onConfirmNewEmailCaptchaResolved(token: string | null) {
    this.isConfirmNewEmailInProgress.set(true);

    try {
      const { score, success } = await this.captchaService.verifyCaptcha(token);

      if (!success || score < 0.5) {
        this.confirmError.set("CAPTCHA_FAILED");
        this.captchaRef.reset();
      } else {
        await this.onConfirmNewEmail();
      }
    } finally {
      this.isConfirmNewEmailInProgress.set(false);
    }
  }

  private async onConfirmNewEmail() {
    await submit(this.updateEmailForm, async () => {
      try {
        this.confirmedNewEmail.set("");
        this.confirmError.set("");

        const newEmail = this.updateEmailForm.newEmail().value();

        await this.confirmNewEmailMutation.mutateAsync({
          code: this.updateEmailForm.emailCode().value(),
          email: newEmail,
          password: this.updateEmailForm.password().value(),
        });

        this.confirmedNewEmail.set(newEmail);
        this.updateEmailForm().reset();
        this.updateEmailModel.update((emailModel) => ({
          ...emailModel,
          emailCode: "",
          password: "",
        }));
      } catch (error) {
        if (error instanceof ZephyrHttpError) {
          this.confirmError.set(error.code);
        } else {
          this.confirmError.set("INTERNAL_SERVER_ERROR");
        }
      }
    });
  }

  protected togglePassword() {
    this.isPasswordVisible.set(!this.isPasswordVisible());
  }
}
