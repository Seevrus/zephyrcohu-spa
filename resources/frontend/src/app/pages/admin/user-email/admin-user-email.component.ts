import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";
import {
  form,
  FormField,
  maxLength,
  required,
  submit,
  validate,
} from "@angular/forms/signals";
import { MatButton } from "@angular/material/button";
import { MatError, MatFormField, MatLabel } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { Title } from "@angular/platform-browser";
import { Router, RouterLink } from "@angular/router";
import {
  injectMutation,
  injectQuery,
} from "@tanstack/angular-query-experimental";

import { ZephyrHttpError } from "../../../../api/ZephyrHttpError";
import { type SendAdminUserEmailRequest } from "../../../../types/admin-users";
import { ButtonLoadableComponent } from "../../../components/button-loadable/button-loadable.component";
import { FormUnexpectedErrorComponent } from "../../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { RichTextEditorComponent } from "../../../components/rich-text-editor/rich-text-editor.component";
import { AdminUsersQueryService } from "../../../services/admin-users.query.service";
import { BreadcrumbService } from "../../../services/breadcrumb.service";
import { FlashMessageService } from "../../../services/flash-message.service";
import { richTextRequiredValidator } from "../../../validators/richTextRequiredValidator";

type AdminUserEmailFormModel = {
  subject: string;
  body: string;
};

@Component({
  selector: "app-admin-user-email",
  host: {
    class: "app-admin-user-email",
  },
  imports: [
    ButtonLoadableComponent,
    FormField,
    FormUnexpectedErrorComponent,
    MatButton,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    RichTextEditorComponent,
    RouterLink,
  ],
  templateUrl: "./admin-user-email.component.html",
  styleUrl: "./admin-user-email.component.scss",
})
export class AdminUserEmailComponent {
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
        `Admin - Email írása - ${userEmail}`,
      );
      this.titleService.setTitle(`${userEmail} - Zephyr Bt.`);
    }
  });

  protected readonly emailModel = signal<AdminUserEmailFormModel>({
    subject: "",
    body: "",
  });

  readonly emailForm = form(this.emailModel, (schemaPath) => {
    required(schemaPath.subject);
    maxLength(schemaPath.subject, 255);
    validate(schemaPath.body, richTextRequiredValidator);
  });

  protected readonly sendEmailMutation = injectMutation(() =>
    this.adminUsersQueryService.sendAdminUserEmail(),
  );

  protected readonly isSubmitting = computed(() =>
    this.sendEmailMutation.isPending(),
  );

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly errorMessage = signal("");

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly loadErrorMessage = computed(() =>
    this.usersQuery.isError() ? "INTERNAL_SERVER_ERROR" : undefined,
  );

  async onSubmit(event: Event) {
    event.preventDefault();

    await submit(this.emailForm, async () => {
      try {
        this.errorMessage.set("");

        const numericId = this.numericId();

        if (numericId === undefined) {
          return;
        }

        const model = this.emailModel();
        const request: SendAdminUserEmailRequest = {
          subject: model.subject,
          body: model.body,
        };

        await this.sendEmailMutation.mutateAsync({ id: numericId, request });

        this.flashMessageService.set("Email küldése sikeres.");
        this.router.navigate(["/admin/felhasznalok"]);
      } catch (error) {
        /**
         * The model is left untouched, so the admin can retry without
         * retyping the mail.
         */
        this.errorMessage.set(
          error instanceof ZephyrHttpError
            ? error.code
            : "INTERNAL_SERVER_ERROR",
        );
      }
    });
  }
}
