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
  validate,
} from "@angular/forms/signals";
import {
  MatAutocomplete,
  type MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from "@angular/material/autocomplete";
import { MatButton } from "@angular/material/button";
import {
  MatChipGrid,
  MatChipInput,
  type MatChipInputEvent,
  MatChipRemove,
  MatChipRow,
} from "@angular/material/chips";
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
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { MatSelect } from "@angular/material/select";
import { Title } from "@angular/platform-browser";
import { Router, RouterLink } from "@angular/router";
import {
  injectMutation,
  injectQuery,
} from "@tanstack/angular-query-experimental";

import { ZephyrHttpError } from "../../../../api/ZephyrHttpError";
import { toApiDate } from "../../../../mappers/dates";
import {
  type AdminKnowledgebaseItem,
  type SaveAdminKnowledgebaseRequest,
} from "../../../../types/admin-knowledgebase";
import { ButtonLoadableComponent } from "../../../components/button-loadable/button-loadable.component";
import { FormUnexpectedErrorComponent } from "../../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { RichTextEditorComponent } from "../../../components/rich-text-editor/rich-text-editor.component";
import { AdminKnowledgebaseQueryService } from "../../../services/admin-knowledgebase.query.service";
import { BreadcrumbService } from "../../../services/breadcrumb.service";
import { KnowledgebaseQueryService } from "../../../services/knowledgebase.query.service";
import { richTextRequiredValidator } from "../../../validators/richTextRequiredValidator";

type AdminKnowledgebaseFormModel = {
  audience: "A" | "P";
  title: string;
  tags: string[];
  mainContent: string;
  additionalContent: string;
  publishedAt: Date | null;
};

const EMPTY_KNOWLEDGEBASE_MODEL: AdminKnowledgebaseFormModel = {
  audience: "P",
  title: "",
  tags: [],
  mainContent: "",
  additionalContent: "",
  publishedAt: null,
};

@Component({
  selector: "app-admin-knowledgebase-form",
  host: {
    class: "app-admin-knowledgebase-form",
  },
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: "hu-HU" },
  ],
  imports: [
    ButtonLoadableComponent,
    FormField,
    FormUnexpectedErrorComponent,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatButton,
    MatChipGrid,
    MatChipInput,
    MatChipRemove,
    MatChipRow,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatError,
    MatFormField,
    MatIcon,
    MatInput,
    MatLabel,
    MatOption,
    MatSelect,
    MatSuffix,
    RichTextEditorComponent,
    RouterLink,
  ],
  templateUrl: "./admin-knowledgebase-form.component.html",
  styleUrl: "./admin-knowledgebase-form.component.scss",
})
export class AdminKnowledgebaseFormComponent {
  private readonly adminKnowledgebaseQueryService = inject(
    AdminKnowledgebaseQueryService,
  );
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly knowledgebaseQueryService = inject(
    KnowledgebaseQueryService,
  );
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

  /**
   * The route had an `:id` segment, but it wasn't a valid integer (e.g.
   * `/admin/tudasbazis/ujjjj` falling through to `tudasbazis/:id` instead of
   * matching the literal `tudasbazis/uj` route). Redirected away rather than
   * silently falling back to create mode or querying `/admin/knowledgebase/NaN`
   * — mirrors `AdminNewsFormComponent`'s `redirectOnInvalidIdEffect`.
   */
  private readonly hasInvalidId = computed(
    () => this.id() !== undefined && this.numericId() === undefined,
  );

  protected readonly isEditMode = computed(() => this.id() !== undefined);

  private readonly knowledgebaseItemQuery = injectQuery(() =>
    this.adminKnowledgebaseQueryService.getAdminKnowledgebaseItem(
      this.numericId(),
    ),
  );

  private readonly tagsQuery = injectQuery(() =>
    this.knowledgebaseQueryService.getKnowledgebaseTags(),
  );

  protected readonly availableTags = computed(
    () => this.tagsQuery.data() ?? [],
  );

  private readonly redirectOnInvalidIdEffect = effect(() => {
    if (this.hasInvalidId()) {
      this.router.navigate(["/admin/tudasbazis"], { replaceUrl: true });
    }
  });

  private readonly pageTitleEffect = effect(() => {
    const title = this.knowledgebaseItemQuery.data()?.title;
    if (title) {
      this.breadcrumbService.setBreadcrumb(
        `Admin - Tudásbázis cikk szerkesztése - ${title}`,
      );
      this.titleService.setTitle(`${title} - Zephyr Bt.`);
    }
  });

  protected readonly knowledgebaseModel = linkedSignal<
    AdminKnowledgebaseItem | undefined,
    AdminKnowledgebaseFormModel
  >({
    source: () => this.knowledgebaseItemQuery.data(),
    computation: (data, previous): AdminKnowledgebaseFormModel => {
      if (previous?.source !== undefined) {
        return previous.value;
      }

      if (!data) {
        return EMPTY_KNOWLEDGEBASE_MODEL;
      }

      return {
        audience: data.audience,
        title: data.title,
        tags: data.tags.map((tag) => tag.name),
        mainContent: data.mainContent,
        additionalContent: data.additionalContent ?? "",
        publishedAt: data.publishedAt,
      };
    },
  });

  readonly knowledgebaseForm = form(this.knowledgebaseModel, (schemaPath) => {
    required(schemaPath.audience);
    required(schemaPath.title);
    maxLength(schemaPath.title, 255);
    required(schemaPath.publishedAt);
    validate(schemaPath.mainContent, richTextRequiredValidator);
  });

  protected readonly tagInput = signal("");

  protected readonly filteredTagOptions = computed(() => {
    const query = this.tagInput().trim().toLowerCase();
    const selected = new Set(
      this.knowledgebaseForm
        .tags()
        .value()
        .map((tag) => tag.toLowerCase()),
    );

    return this.availableTags()
      .filter((tag) => !selected.has(tag.name.toLowerCase()))
      .filter((tag) => !query || tag.name.toLowerCase().includes(query));
  });

  protected readonly createKnowledgebaseMutation = injectMutation(() =>
    this.adminKnowledgebaseQueryService.createAdminKnowledgebase(),
  );

  protected readonly updateKnowledgebaseMutation = injectMutation(() =>
    this.adminKnowledgebaseQueryService.updateAdminKnowledgebase(),
  );

  protected readonly isSubmitting = computed(
    () =>
      this.createKnowledgebaseMutation.isPending() ||
      this.updateKnowledgebaseMutation.isPending(),
  );

  protected readonly submitLabel = computed(() =>
    this.isEditMode() ? "Cikk módosítása" : "Beküldés",
  );

  /**
   * INVALID_REQUEST_DATA
   * || INTERNAL_SERVER_ERROR
   */
  protected readonly errorMessage = signal("");

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly loadErrorMessage = computed(() =>
    this.knowledgebaseItemQuery.isError() ? "INTERNAL_SERVER_ERROR" : undefined,
  );

  protected onTagInputChange(event: Event) {
    this.tagInput.set((event.target as HTMLInputElement).value);
  }

  protected onTagOptionSelected(event: MatAutocompleteSelectedEvent) {
    this.addTag(event.option.viewValue);
    this.tagInput.set("");
    event.option.deselect();
  }

  protected onTagAdded(event: MatChipInputEvent) {
    this.addTag(event.value);
    event.chipInput.clear();
    this.tagInput.set("");
  }

  protected onTagRemoved(name: string) {
    const currentTags = this.knowledgebaseForm.tags().value();

    this.knowledgebaseForm
      .tags()
      .value.set(currentTags.filter((tag) => tag !== name));
  }

  private addTag(name: string) {
    const trimmed = name.trim();

    if (!trimmed) {
      return;
    }

    const currentTags = this.knowledgebaseForm.tags().value();

    if (
      currentTags.some((tag) => tag.toLowerCase() === trimmed.toLowerCase())
    ) {
      return;
    }

    this.knowledgebaseForm.tags().value.set([...currentTags, trimmed]);
  }

  async onSubmit(event: Event) {
    event.preventDefault();

    await submit(this.knowledgebaseForm, async () => {
      try {
        this.errorMessage.set("");

        const model = this.knowledgebaseModel();
        const request: SaveAdminKnowledgebaseRequest = {
          audience: model.audience,
          title: model.title,
          mainContent: model.mainContent,
          additionalContent: model.additionalContent.trim()
            ? model.additionalContent
            : null,
          publishedAt: toApiDate(model.publishedAt!),
          tags: model.tags,
        };

        const numericId = this.numericId();

        if (numericId === undefined) {
          await this.createKnowledgebaseMutation.mutateAsync(request);
        } else {
          await this.updateKnowledgebaseMutation.mutateAsync({
            id: numericId,
            request,
          });
        }

        this.router.navigate(["/admin/tudasbazis"]);
      } catch (error) {
        if (error instanceof ZephyrHttpError) {
          this.errorMessage.set(error.code);
        } else {
          this.errorMessage.set("INTERNAL_SERVER_ERROR");
        }
      }
    });
  }
}
