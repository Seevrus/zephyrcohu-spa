import { Component, computed, inject, signal } from "@angular/core";
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
import { Router, RouterLink } from "@angular/router";
import { injectMutation } from "@tanstack/angular-query-experimental";

import { ZephyrHttpError } from "../../../../api/ZephyrHttpError";
import { type SaveAdminNewsletterRequest } from "../../../../types/admin-newsletters";
import { ButtonLoadableComponent } from "../../../components/button-loadable/button-loadable.component";
import { FormUnexpectedErrorComponent } from "../../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { RichTextEditorComponent } from "../../../components/rich-text-editor/rich-text-editor.component";
import { AdminNewslettersQueryService } from "../../../services/admin-newsletters.query.service";
import { richTextRequiredValidator } from "../../../validators/richTextRequiredValidator";

type AdminNewsletterFormModel = {
  subject: string;
  content: string;
};

@Component({
  selector: "app-admin-newsletter-form",
  host: {
    class: "app-admin-newsletter-form",
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
  templateUrl: "./admin-newsletter-form.component.html",
  styleUrl: "./admin-newsletter-form.component.scss",
})
export class AdminNewsletterFormComponent {
  private readonly adminNewslettersQueryService = inject(
    AdminNewslettersQueryService,
  );
  private readonly router = inject(Router);

  protected readonly newsletterModel = signal<AdminNewsletterFormModel>({
    subject: "",
    content: "",
  });

  readonly newsletterForm = form(this.newsletterModel, (schemaPath) => {
    required(schemaPath.subject);
    maxLength(schemaPath.subject, 255);
    validate(schemaPath.content, richTextRequiredValidator);
  });

  protected readonly createNewsletterMutation = injectMutation(() =>
    this.adminNewslettersQueryService.createAdminNewsletter(),
  );

  protected readonly isSubmitting = computed(() =>
    this.createNewsletterMutation.isPending(),
  );

  /**
   *  | INTERNAL_SERVER_ERROR
   *  | INVALID_REQUEST_DATA
   */
  protected readonly errorMessage = signal("");

  async onSubmit(event: Event) {
    event.preventDefault();

    await submit(this.newsletterForm, async () => {
      try {
        this.errorMessage.set("");

        const model = this.newsletterModel();
        const request: SaveAdminNewsletterRequest = {
          subject: model.subject,
          content: model.content,
        };

        const newsletter =
          await this.createNewsletterMutation.mutateAsync(request);

        /**
         * Creating a newsletter mails nobody — the sending screen does that.
         */
        this.router.navigate(["/admin/hirlevel", newsletter.id, "kuldes"]);
      } catch (error) {
        this.errorMessage.set(
          error instanceof ZephyrHttpError
            ? error.code
            : "INTERNAL_SERVER_ERROR",
        );
      }
    });
  }
}
