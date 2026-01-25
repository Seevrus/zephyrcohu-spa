import {
  Component,
  computed,
  inject,
  type OnDestroy,
  type OnInit,
  signal,
} from "@angular/core";
import {
  FormBuilder,
  type FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { form, FormField, submit, validate } from "@angular/forms/signals";
import { MatCheckbox } from "@angular/material/checkbox";
import {
  MatError,
  MatFormField,
  MatInput,
  MatLabel,
} from "@angular/material/input";
import { MatDivider } from "@angular/material/list";
import { Router } from "@angular/router";
import {
  injectMutation,
  injectQuery,
} from "@tanstack/angular-query-experimental";
import { type Subscription } from "rxjs";

import { mapUpdateProfileRequest } from "../../../mappers/mapUpdateProfileRequest";
import { ButtonLoadableComponent } from "../../components/button-loadable/button-loadable.component";
import { FormUnexpectedErrorComponent } from "../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { ProfileUpdatedComponent } from "../../components/form-alerts/profile-updated/profile-updated.component";
import { PasswordRepeatComponent } from "../../components/password-repeat/password-repeat.component";
import { UsersQueryService } from "../../services/users.query.service";
import { passwordValidator } from "../../validators/password.validator";
import { passwordMatchValidator } from "../../validators/password-match.validator";

@Component({
  host: {
    class: "app-profile",
  },
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrl: "./profile.component.scss",
  imports: [
    ButtonLoadableComponent,
    FormField,
    FormUnexpectedErrorComponent,
    MatCheckbox,
    MatDivider,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    PasswordRepeatComponent,
    ProfileUpdatedComponent,
    ReactiveFormsModule,
  ],
})
export class ProfileComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly usersQueryService = inject(UsersQueryService);

  private updateProfileSubscription: Subscription | null = null;

  protected readonly deleteProfileMutation = injectMutation(() =>
    this.usersQueryService.deleteProfile(),
  );

  protected readonly updateProfileMutation = injectMutation(() =>
    this.usersQueryService.updateProfile(),
  );

  private readonly sessionQuery = injectQuery(() =>
    this.usersQueryService.session(),
  );

  private readonly originalEmail = computed(
    () => this.sessionQuery.data()?.email ?? "",
  );
  private readonly originalNewsletter = computed(
    () => this.sessionQuery.data()?.newsletter ?? false,
  );

  private readonly deleteProfileModel = signal({
    confirm: false,
  });

  protected readonly deleteProfileForm = form(
    this.deleteProfileModel,
    (schemaPath) => {
      validate(schemaPath.confirm, ({ value }) => {
        if (value()) {
          return null;
        }

        return {
          kind: "boolean",
          message: "A jelölőnégyzet kijelölése kötelező.",
        };
      });
    },
  );

  protected readonly updateProfileForm = this.formBuilder.group({
    email: [this.originalEmail(), [Validators.email]],
    passwords: this.formBuilder.group(
      {
        password: ["", passwordValidator],
        passwordAgain: ["", passwordValidator],
      },
      { validators: [passwordMatchValidator] },
    ),
    newsletter: this.originalNewsletter(),
  });

  get newEmail() {
    return this.updateProfileForm.get("email");
  }

  get newNewsLetter() {
    return this.updateProfileForm.get("newsletter");
  }

  get newPassword() {
    return this.updateProfileForm.get("passwords.password");
  }

  ngOnInit() {
    this.updateProfileSubscription =
      this.updateProfileForm.valueChanges.subscribe((form) => {
        this.isEmailUpdated.set(
          !!form.email && form.email !== this.originalEmail(),
        );

        this.isNewsletterUpdated.set(
          form.newsletter !== this.originalNewsletter(),
        );

        this.isPasswordUpdated.set(!!form.passwords?.password);
      });
  }

  ngOnDestroy() {
    this.updateProfileSubscription?.unsubscribe();
  }

  private readonly isEmailUpdated = signal(false);
  private readonly isNewsletterUpdated = signal(false);
  private readonly isPasswordUpdated = signal(false);

  protected readonly isProfileUpdated = computed(
    () =>
      this.isEmailUpdated() ||
      this.isPasswordUpdated() ||
      this.isNewsletterUpdated(),
  );

  protected readonly savedEmail = signal<string | undefined>(undefined);
  protected readonly isPasswordSaved = signal(false);
  protected readonly savedNewsLetter = signal<boolean | undefined>(undefined);

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly deleteErrorMessage = signal("");

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly updateErrorMessage = signal("");

  onDeleteProfile(event: Event) {
    event.preventDefault();
    submit(this.deleteProfileForm, async () => {
      try {
        this.savedEmail.set(undefined);
        this.isPasswordSaved.set(false);
        this.savedNewsLetter.set(undefined);
        this.updateErrorMessage.set("");
        this.deleteErrorMessage.set("");

        await this.deleteProfileMutation.mutateAsync();
        this.router.navigate(["/"]);
      } catch {
        this.deleteErrorMessage.set("INTERNAL_SERVER_ERROR");
      }
    });
  }

  async onUpdateProfile(formDirective: FormGroupDirective) {
    try {
      this.savedEmail.set(undefined);
      this.isPasswordSaved.set(false);
      this.savedNewsLetter.set(undefined);
      this.updateErrorMessage.set("");
      this.deleteErrorMessage.set("");

      this.updateProfileForm.markAsPristine();

      const newEmail = this.newEmail?.value;
      const newPassword = this.newPassword?.value;
      const newNewsLetter = this.newNewsLetter?.value;

      await this.updateProfileMutation.mutateAsync(
        mapUpdateProfileRequest({
          email: newEmail,
          password: newPassword,
          newsletter: newNewsLetter,
        }),
      );

      if (this.isEmailUpdated() && newEmail) {
        this.savedEmail.set(newEmail);
      }
      if (this.isPasswordUpdated()) {
        this.isPasswordSaved.set(true);
      }
      if (
        this.isNewsletterUpdated() &&
        newNewsLetter !== null &&
        newNewsLetter !== undefined
      ) {
        this.savedNewsLetter.set(newNewsLetter);
      }

      formDirective.resetForm();
    } catch {
      this.updateErrorMessage.set("INTERNAL_SERVER_ERROR");
    }
  }
}
