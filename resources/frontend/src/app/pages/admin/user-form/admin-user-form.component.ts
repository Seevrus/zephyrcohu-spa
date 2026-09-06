import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
} from "@angular/core";
import {
  disabled,
  email,
  form,
  FormField,
  required,
  submit,
} from "@angular/forms/signals";
import { MatButton } from "@angular/material/button";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatError, MatFormField, MatLabel } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { MatRadioButton, MatRadioGroup } from "@angular/material/radio";
import { Title } from "@angular/platform-browser";
import { Router, RouterLink } from "@angular/router";
import {
  injectMutation,
  injectQuery,
} from "@tanstack/angular-query-experimental";

import { ZephyrHttpError } from "../../../../api/ZephyrHttpError";
import { ZephyrValidationHttpError } from "../../../../api/ZephyrValidationHttpError";
import {
  type AdminUser,
  type UpdateAdminUserRequest,
} from "../../../../types/admin-users";
import { ButtonLoadableComponent } from "../../../components/button-loadable/button-loadable.component";
import { ErrorCardComponent } from "../../../components/error-card/error-card.component";
import { FormUnexpectedErrorComponent } from "../../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { AdminUsersQueryService } from "../../../services/admin-users.query.service";
import { BreadcrumbService } from "../../../services/breadcrumb.service";
import { FlashMessageService } from "../../../services/flash-message.service";

type AdminUserFormModel = {
  email: string;
  confirmed: boolean;
  newsletter: boolean;
  generatePassword: boolean;
};

@Component({
  selector: "app-admin-user-form",
  host: {
    class: "app-admin-user-form",
  },
  imports: [
    ButtonLoadableComponent,
    ErrorCardComponent,
    FormField,
    FormUnexpectedErrorComponent,
    MatButton,
    MatCheckbox,
    MatError,
    MatFormField,
    MatIcon,
    MatInput,
    MatLabel,
    MatRadioButton,
    MatRadioGroup,
    RouterLink,
  ],
  templateUrl: "./admin-user-form.component.html",
  styleUrl: "./admin-user-form.component.scss",
})
export class AdminUserFormComponent {
  private readonly adminUsersQueryService = inject(AdminUsersQueryService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly flashMessageService = inject(FlashMessageService);
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);

  readonly id = input<string>();

  protected readonly numericId = computed(() => {
    const id = this.id();

    if (id === undefined) {
      return;
    }

    const parsed = Number(id);

    return Number.isInteger(parsed) ? parsed : undefined;
  });

  private readonly hasInvalidId = computed(
    () => this.id() !== undefined && this.numericId() === undefined,
  );

  private readonly usersQuery = injectQuery(() =>
    this.adminUsersQueryService.getAdminUsers(),
  );

  protected readonly user = computed(() =>
    this.usersQuery
      .data()
      ?.find((candidate) => candidate.id === this.numericId()),
  );

  protected readonly isNotFound = computed(
    () => this.usersQuery.isSuccess() && this.user() === undefined,
  );

  private readonly redirectOnInvalidIdEffect = effect(() => {
    if (this.hasInvalidId()) {
      this.router.navigate(["/admin/felhasznalok"], { replaceUrl: true });
    }
  });

  private readonly pageTitleEffect = effect(() => {
    const userEmail = this.user()?.email;

    if (userEmail) {
      this.breadcrumbService.setBreadcrumb(
        `Admin - Felhasználó szerkesztése - ${userEmail}`,
      );
      this.titleService.setTitle(`${userEmail} - Zephyr Bt.`);
    }
  });

  protected readonly userModel = linkedSignal<
    AdminUser | undefined,
    AdminUserFormModel
  >({
    source: () => this.user(),
    computation: (data, previous): AdminUserFormModel => {
      if (previous?.source !== undefined) {
        return previous.value;
      }

      if (!data) {
        return {
          email: "",
          confirmed: false,
          newsletter: false,
          generatePassword: false,
        };
      }

      return {
        email: data.email,
        confirmed: data.confirmed,
        newsletter: data.newsletter,
        generatePassword: false,
      };
    },
  });

  /**
   * The booleans carry no validator: a checkbox and a radio group always hold a
   * value, and `required` would reject a legitimate `false`.
   */
  readonly userForm = form(this.userModel, (schemaPath) => {
    required(schemaPath.email);
    email(schemaPath.email);
    /**
     * Confirmation is one-way. Revoking it would lock the user out of login
     * while their `users_new` row — and with it the confirmation code — is
     * already gone, leaving no way back in.
     */
    disabled(schemaPath.confirmed, {
      when: () => this.user()?.confirmed === true,
    });
  });

  protected readonly updateUserMutation = injectMutation(() =>
    this.adminUsersQueryService.updateAdminUser(),
  );

  protected readonly isSubmitting = computed(() =>
    this.updateUserMutation.isPending(),
  );

  /**
   * INVALID_REQUEST_DATA
   * || INTERNAL_SERVER_ERROR
   */
  protected readonly errorMessage = signal("");

  protected readonly validationMessage = signal("");

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly loadErrorMessage = computed(() =>
    this.usersQuery.isError() ? "INTERNAL_SERVER_ERROR" : undefined,
  );

  async onSubmit(event: Event) {
    event.preventDefault();

    await submit(this.userForm, async () => {
      try {
        this.errorMessage.set("");
        this.validationMessage.set("");

        const numericId = this.numericId();

        if (numericId === undefined) {
          return;
        }

        const model = this.userModel();
        const request: UpdateAdminUserRequest = {
          email: model.email,
          confirmed: model.confirmed,
          newsletter: model.newsletter,
          generatePassword: model.generatePassword,
        };

        await this.updateUserMutation.mutateAsync({ id: numericId, request });

        this.flashMessageService.set("A felhasználó adatai módosultak.");
        this.router.navigate(["/admin/felhasznalok"]);
      } catch (error) {
        this.handleSubmitError(error);
      }
    });
  }

  private handleSubmitError(error: unknown) {
    if (error instanceof ZephyrValidationHttpError) {
      this.validationMessage.set(
        error.messageFor("email") ?? error.firstMessage() ?? "",
      );
      this.errorMessage.set("INVALID_REQUEST_DATA");
    } else if (error instanceof ZephyrHttpError) {
      this.errorMessage.set(error.code);
    } else {
      this.errorMessage.set("INTERNAL_SERVER_ERROR");
    }
  }
}
