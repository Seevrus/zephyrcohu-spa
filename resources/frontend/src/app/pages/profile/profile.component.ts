import { Component, computed, inject, signal } from "@angular/core";
import {
  FormBuilder,
  type FormGroupDirective,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import {
  injectMutation,
  injectQuery,
} from "@tanstack/angular-query-experimental";

import { allowedPasswordCharacters } from "../../../constants/forms";
import { mapUpdateProfileRequest } from "../../../mappers/mapUpdateProfileRequest";
import { UsersQueryService } from "../../services/users.query.service";
import { passwordMatchValidator } from "../../validators/password-match.validator";

@Component({
  host: {
    class: "app-profile",
  },
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrl: "./profile.component.scss",
})
export class ProfileComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly usersQueryService = inject(UsersQueryService);

  private readonly passwordPattern = new RegExp(
    `([${allowedPasswordCharacters}]){8,}`,
  );

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

  protected readonly deleteProfileForm = this.formBuilder.group({
    confirm: [false, Validators.requiredTrue],
  });

  protected readonly updateProfileForm = this.formBuilder.group({
    email: [this.originalEmail(), [Validators.email]],
    passwords: this.formBuilder.group(
      {
        password: ["", [Validators.pattern(this.passwordPattern)]],
        passwordAgain: ["", [Validators.pattern(this.passwordPattern)]],
      },
      { validators: [passwordMatchValidator] },
    ),
    newsletter: this.originalNewsletter(),
  });

  protected readonly newEmail = computed(
    () => this.updateProfileForm.get("email")?.value,
  );

  protected readonly newNewsLetter = computed(
    () => this.updateProfileForm.get("newsletter")?.value,
  );

  protected readonly newPassword = computed(
    () => this.updateProfileForm.get("passwords.password")?.value,
  );

  private readonly isEmailUpdated = computed(
    () => this.newEmail() !== this.originalEmail(),
  );

  private readonly isNewsletterUpdated = computed(
    () => this.newNewsLetter() !== this.originalNewsletter(),
  );

  private readonly isPasswordUpdated = computed(() => !!this.newPassword());

  protected readonly isProfileUpdated = computed(
    () =>
      this.isEmailUpdated() ||
      this.isPasswordUpdated() ||
      this.isNewsletterUpdated(),
  );

  protected readonly isEmailSaved = signal(false);
  protected readonly isPasswordSaved = signal(false);
  protected readonly isNewsletterSaved = signal(false);

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly deleteErrorMessage = signal("");

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly updateErrorMessage = signal("");

  async onDeleteProfile() {
    try {
      this.deleteProfileForm.markAsPristine();
      await this.deleteProfileMutation.mutateAsync();

      this.router.navigate(["/"]);
    } catch {
      this.deleteErrorMessage.set("INTERNAL_SERVER_ERROR");
    }
  }

  async onUpdateProfile(formDirective: FormGroupDirective) {
    try {
      this.isEmailSaved.set(false);
      this.isPasswordSaved.set(false);
      this.isNewsletterSaved.set(false);
      this.updateErrorMessage.set("");

      this.updateProfileForm.markAsPristine();

      await this.updateProfileMutation.mutateAsync(
        mapUpdateProfileRequest({
          email: this.newEmail(),
          password: this.newPassword(),
          newsletter: this.newNewsLetter(),
        }),
      );

      if (this.isEmailUpdated()) {
        this.isEmailSaved.set(true);
      }
      if (this.isPasswordUpdated()) {
        this.isPasswordSaved.set(true);
      }
      if (this.isNewsletterUpdated()) {
        this.isNewsletterSaved.set(true);
      }

      formDirective.resetForm();
    } catch {
      this.updateErrorMessage.set("INTERNAL_SERVER_ERROR");
    }
  }
}
