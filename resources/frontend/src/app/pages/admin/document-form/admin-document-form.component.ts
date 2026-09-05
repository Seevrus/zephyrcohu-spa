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
  form,
  FormField,
  maxLength,
  required,
  submit,
} from "@angular/forms/signals";
import { MatButton } from "@angular/material/button";
import {
  MAT_DATE_LOCALE,
  MatOption,
  provideNativeDateAdapter,
} from "@angular/material/core";
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
} from "@angular/material/datepicker";
import {
  MatError,
  MatFormField,
  MatLabel,
  MatSuffix,
} from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { MatSelect } from "@angular/material/select";
import { Title } from "@angular/platform-browser";
import { Router, RouterLink } from "@angular/router";
import {
  injectMutation,
  injectQuery,
} from "@tanstack/angular-query-experimental";

import { ZephyrHttpError } from "../../../../api/ZephyrHttpError";
import { ZephyrValidationHttpError } from "../../../../api/ZephyrValidationHttpError";
import { toApiDate } from "../../../../mappers/dates";
import {
  type AdminDocumentItem,
  type SaveAdminDocumentRequest,
} from "../../../../types/admin-documents";
import {
  INTEGRA_CATEGORY_LABELS,
  type IntegraCategory,
} from "../../../../types/integra";
import { ButtonLoadableComponent } from "../../../components/button-loadable/button-loadable.component";
import { ErrorCardComponent } from "../../../components/error-card/error-card.component";
import { FormUnexpectedErrorComponent } from "../../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { AdminDocumentsQueryService } from "../../../services/admin-documents.query.service";
import { BreadcrumbService } from "../../../services/breadcrumb.service";

type AdminDocumentFormModel = {
  category: IntegraCategory | "";
  displayName: string;
  version: string;
  publishedAt: Date | null;
};

const MAX_FILE_SIZE_BYTES = 51200 * 1024;

const MAX_FILE_SIZE_MESSAGE =
  "A feltöltött fájl legfeljebb 50 MB méretű lehet.";

const EMPTY_DOCUMENT_MODEL: AdminDocumentFormModel = {
  category: "",
  displayName: "",
  version: "",
  publishedAt: null,
};

@Component({
  selector: "app-admin-document-form",
  host: {
    class: "app-admin-document-form",
  },
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: "hu-HU" },
  ],
  imports: [
    ButtonLoadableComponent,
    ErrorCardComponent,
    FormField,
    FormUnexpectedErrorComponent,
    MatButton,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    MatOption,
    MatSelect,
    MatSuffix,
    RouterLink,
  ],
  templateUrl: "./admin-document-form.component.html",
  styleUrl: "./admin-document-form.component.scss",
})
export class AdminDocumentFormComponent {
  private readonly adminDocumentsQueryService = inject(
    AdminDocumentsQueryService,
  );
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);

  readonly id = input<string>();

  protected readonly categoryOptions = Object.entries(
    INTEGRA_CATEGORY_LABELS,
  ).map(([category, label]) => ({
    category: category as IntegraCategory,
    label,
  }));

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

  protected readonly isEditMode = computed(() => this.id() !== undefined);

  private readonly documentItemQuery = injectQuery(() =>
    this.adminDocumentsQueryService.getAdminDocument(this.numericId()),
  );

  protected readonly currentFileName = computed(
    () => this.documentItemQuery.data()?.fileName,
  );

  private readonly redirectOnInvalidIdEffect = effect(() => {
    if (this.hasInvalidId()) {
      this.router.navigate(["/admin/integra"], { replaceUrl: true });
    }
  });

  private readonly pageTitleEffect = effect(() => {
    const displayName = this.documentItemQuery.data()?.displayName;
    if (displayName) {
      this.breadcrumbService.setBreadcrumb(
        `Admin - INTEGRA fájl szerkesztése - ${displayName}`,
      );
      this.titleService.setTitle(`${displayName} - Zephyr Bt.`);
    }
  });

  protected readonly documentModel = linkedSignal<
    AdminDocumentItem | undefined,
    AdminDocumentFormModel
  >({
    source: () => this.documentItemQuery.data(),
    computation: (data, previous): AdminDocumentFormModel => {
      if (previous?.source !== undefined) {
        return previous.value;
      }

      if (!data) {
        return EMPTY_DOCUMENT_MODEL;
      }

      return {
        category: data.category,
        displayName: data.displayName,
        version: data.version,
        publishedAt: data.publishedAt,
      };
    },
  });

  readonly documentForm = form(this.documentModel, (schemaPath) => {
    required(schemaPath.category);
    required(schemaPath.displayName);
    maxLength(schemaPath.displayName, 255);
    required(schemaPath.version);
    maxLength(schemaPath.version, 255);
    required(schemaPath.publishedAt);
  });

  /**
   * A file input cannot be a signal-forms field, so the chosen file lives in
   * its own signal and is validated in `onSubmit`.
   */
  protected readonly selectedFile = signal<File | undefined>(undefined);

  protected readonly selectedFileName = computed(
    () => this.selectedFile()?.name,
  );

  protected readonly fileError = signal("");

  protected readonly createDocumentMutation = injectMutation(() =>
    this.adminDocumentsQueryService.createAdminDocument(),
  );

  protected readonly updateDocumentMutation = injectMutation(() =>
    this.adminDocumentsQueryService.updateAdminDocument(),
  );

  protected readonly isSubmitting = computed(
    () =>
      this.createDocumentMutation.isPending() ||
      this.updateDocumentMutation.isPending(),
  );

  protected readonly submitLabel = computed(() =>
    this.isEditMode() ? "Fájl módosítása" : "Feltöltés",
  );

  /**
   * INVALID_REQUEST_DATA
   * || INTERNAL_SERVER_ERROR
   */
  protected readonly errorMessage = signal("");

  /**
   * The backend's own message for a 422 that isn't about the file itself.
   */
  protected readonly validationMessage = signal("");

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly loadErrorMessage = computed(() =>
    this.documentItemQuery.isError() ? "INTERNAL_SERVER_ERROR" : undefined,
  );

  protected onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];

    this.selectedFile.set(file ?? undefined);
    this.fileError.set(
      file !== undefined && file.size > MAX_FILE_SIZE_BYTES
        ? MAX_FILE_SIZE_MESSAGE
        : "",
    );
  }

  async onSubmit(event: Event) {
    event.preventDefault();

    await submit(this.documentForm, async () => {
      const file = this.selectedFile();

      if (file === undefined && !this.isEditMode()) {
        this.fileError.set("Kötelező mező");

        return;
      }

      if (file !== undefined && file.size > MAX_FILE_SIZE_BYTES) {
        this.fileError.set(MAX_FILE_SIZE_MESSAGE);

        return;
      }

      try {
        this.errorMessage.set("");
        this.validationMessage.set("");
        this.fileError.set("");

        const model = this.documentModel();
        const request: SaveAdminDocumentRequest = {
          category: model.category as IntegraCategory,
          displayName: model.displayName,
          version: model.version,
          publishedAt: toApiDate(model.publishedAt!),
          file,
        };

        const numericId = this.numericId();

        if (numericId === undefined) {
          await this.createDocumentMutation.mutateAsync(request);
        } else {
          await this.updateDocumentMutation.mutateAsync({
            id: numericId,
            request,
          });
        }

        this.router.navigate(["/admin/integra"]);
      } catch (error) {
        this.handleSubmitError(error);
      }
    });
  }

  private handleSubmitError(error: unknown) {
    if (error instanceof ZephyrValidationHttpError) {
      const fileMessage = error.messageFor("file");

      if (fileMessage) {
        this.fileError.set(fileMessage);

        return;
      }

      this.validationMessage.set(error.firstMessage() ?? "");
      this.errorMessage.set("INVALID_REQUEST_DATA");
    } else if (error instanceof ZephyrHttpError) {
      this.errorMessage.set(error.code);
    } else {
      this.errorMessage.set("INTERNAL_SERVER_ERROR");
    }
  }
}
