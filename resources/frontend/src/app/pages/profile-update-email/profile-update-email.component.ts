import {
  Component,
  inject,
  type OnDestroy,
  type OnInit,
  signal,
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
import { type Subscription } from "rxjs";

import { ZephyrHttpError } from "../../../api/ZephyrHttpError";
import { type QueryParamsByPath } from "../../app.routes";
import { ButtonLoadableComponent } from "../../components/button-loadable/button-loadable.component";
import { BadCredentialsComponent } from "../../components/form-alerts/bad-credentials/bad-credentials.component";
import { EmailCodeExpiredComponent } from "../../components/form-alerts/email-code-expired/email-code-expired.component";
import { EmailLinkErrorComponent } from "../../components/form-alerts/email-link-error/email-link-error.component";
import { FormUnexpectedErrorComponent } from "../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { ProfileEmailUpdatedComponent } from "../../components/form-alerts/profile-email-updated/profile-email-updated.component";
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
  ],
})
export class ProfileUpdateEmailComponent implements OnInit, OnDestroy {
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
   * || CODE_EXPIRED
   * || INTERNAL_SERVER_ERROR
   */
  protected readonly confirmError = signal<string>("");

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

  protected async onConfirmNewEmail(event: Event) {
    event.preventDefault();
    await submit(this.updateEmailForm, async () => {
      try {
        this.confirmedNewEmail.set("");
        this.confirmError.set("");

        const newEmail = this.updateEmailForm.emailCode().value();

        await this.confirmNewEmailMutation.mutateAsync({
          code: newEmail,
          email: this.updateEmailForm.newEmail().value(),
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
          this.confirmError.set(error.message);
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
