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
import { toApiDate } from "../../../../mappers/dates";
import {
  type AdminNewsItem,
  type SaveAdminNewsRequest,
} from "../../../../types/admin-news";
import { ButtonLoadableComponent } from "../../../components/button-loadable/button-loadable.component";
import { FormUnexpectedErrorComponent } from "../../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { RichTextEditorComponent } from "../../../components/rich-text-editor/rich-text-editor.component";
import { AdminNewsQueryService } from "../../../services/admin-news.query.service";
import { BreadcrumbService } from "../../../services/breadcrumb.service";
import { richTextRequiredValidator } from "../../../validators/richTextRequiredValidator";

type AdminNewsFormModel = {
  audience: "A" | "P";
  title: string;
  mainContent: string;
  additionalContent: string;
  publishedAt: Date | null;
};

const EMPTY_NEWS_MODEL: AdminNewsFormModel = {
  audience: "P",
  title: "",
  mainContent: "",
  additionalContent: "",
  publishedAt: null,
};

@Component({
  selector: "app-admin-news-form",
  host: {
    class: "app-admin-news-form",
  },
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: "hu-HU" },
  ],
  imports: [
    ButtonLoadableComponent,
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
    RichTextEditorComponent,
    RouterLink,
  ],
  templateUrl: "./admin-news-form.component.html",
  styleUrl: "./admin-news-form.component.scss",
})
export class AdminNewsFormComponent {
  private readonly adminNewsQueryService = inject(AdminNewsQueryService);
  private readonly breadcrumbService = inject(BreadcrumbService);
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
   * The route had an `:id` segment, but it wasn't a valid integer
   * (e.g. `/admin/hirek/ujjjj` falling through to `hirek/:id` instead of
   * matching the literal `hirek/uj` route). Redirected away rather than
   * silently falling back to create mode or querying `/admin/news/NaN` —
   * mirrors `NewsArticleComponent`'s `redirectOnInvalidIdEffect`.
   */
  private readonly hasInvalidId = computed(
    () => this.id() !== undefined && this.numericId() === undefined,
  );

  protected readonly isEditMode = computed(() => this.id() !== undefined);

  private readonly newsItemQuery = injectQuery(() =>
    this.adminNewsQueryService.getAdminNewsItem(this.numericId()),
  );

  private readonly redirectOnInvalidIdEffect = effect(() => {
    if (this.hasInvalidId()) {
      this.router.navigate(["/admin/hirek"], { replaceUrl: true });
    }
  });

  private readonly pageTitleEffect = effect(() => {
    const title = this.newsItemQuery.data()?.title;
    if (title) {
      this.breadcrumbService.setBreadcrumb(
        `Admin - Hír szerkesztése - ${title}`,
      );
      this.titleService.setTitle(`${title} - Zephyr Bt.`);
    }
  });

  protected readonly newsModel = linkedSignal<
    AdminNewsItem | undefined,
    AdminNewsFormModel
  >({
    source: () => this.newsItemQuery.data(),
    computation: (data, previous): AdminNewsFormModel => {
      if (previous?.source !== undefined) {
        return previous.value;
      }

      if (!data) {
        return EMPTY_NEWS_MODEL;
      }

      return {
        audience: data.audience,
        title: data.title,
        mainContent: data.mainContent,
        additionalContent: data.additionalContent ?? "",
        publishedAt: data.publishedAt,
      };
    },
  });

  readonly newsForm = form(this.newsModel, (schemaPath) => {
    required(schemaPath.audience);
    required(schemaPath.title);
    maxLength(schemaPath.title, 255);
    required(schemaPath.publishedAt);
    validate(schemaPath.mainContent, richTextRequiredValidator);
  });

  protected readonly createNewsMutation = injectMutation(() =>
    this.adminNewsQueryService.createAdminNews(),
  );

  protected readonly updateNewsMutation = injectMutation(() =>
    this.adminNewsQueryService.updateAdminNews(),
  );

  protected readonly isSubmitting = computed(
    () =>
      this.createNewsMutation.isPending() ||
      this.updateNewsMutation.isPending(),
  );

  protected readonly submitLabel = computed(() =>
    this.isEditMode() ? "Hír módosítása" : "Beküldés",
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
    this.newsItemQuery.isError() ? "INTERNAL_SERVER_ERROR" : undefined,
  );

  async onSubmit(event: Event) {
    event.preventDefault();

    await submit(this.newsForm, async () => {
      try {
        this.errorMessage.set("");

        const model = this.newsModel();
        const request: SaveAdminNewsRequest = {
          audience: model.audience,
          title: model.title,
          mainContent: model.mainContent,
          additionalContent: model.additionalContent.trim()
            ? model.additionalContent
            : null,
          publishedAt: toApiDate(model.publishedAt!),
        };

        const numericId = this.numericId();

        if (numericId === undefined) {
          await this.createNewsMutation.mutateAsync(request);
        } else {
          await this.updateNewsMutation.mutateAsync({
            id: numericId,
            request,
          });
        }

        this.router.navigate(["/admin/hirek"]);
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
