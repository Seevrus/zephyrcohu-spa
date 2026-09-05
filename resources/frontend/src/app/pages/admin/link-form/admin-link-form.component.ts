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
  pattern,
  required,
  submit,
  validate,
} from "@angular/forms/signals";
import { MatButton } from "@angular/material/button";
import {
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
} from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import {
  MatOption,
  MatSelect,
  type MatSelectChange,
} from "@angular/material/select";
import { Title } from "@angular/platform-browser";
import { Router, RouterLink } from "@angular/router";
import {
  injectMutation,
  injectQuery,
} from "@tanstack/angular-query-experimental";

import { ZephyrHttpError } from "../../../../api/ZephyrHttpError";
import {
  type AdminLinkResponse,
  type SaveAdminLinkRequest,
} from "../../../../types/admin-links";
import { ButtonLoadableComponent } from "../../../components/button-loadable/button-loadable.component";
import { ErrorCardComponent } from "../../../components/error-card/error-card.component";
import { FormUnexpectedErrorComponent } from "../../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { AdminLinksQueryService } from "../../../services/admin-links.query.service";
import { BreadcrumbService } from "../../../services/breadcrumb.service";

const URL_PATTERN = /^https?:\/\/.+/i;

/**
 * Kept in sync with `Link::UNCATEGORISED_NAME` (BE) — the reserved category
 * name that always means "no category" and can never be created by hand.
 */
const UNCATEGORISED_NAME = "Egyéb";

type CategorySelection = number | "none" | "new";

type AdminLinkFormModel = {
  categorySelection: CategorySelection;
  newCategoryName: string;
  title: string;
  url: string;
};

const EMPTY_LINK_MODEL: AdminLinkFormModel = {
  categorySelection: "none",
  newCategoryName: "",
  title: "",
  url: "",
};

@Component({
  selector: "app-admin-link-form",
  host: {
    class: "app-admin-link-form",
  },
  imports: [
    ButtonLoadableComponent,
    ErrorCardComponent,
    FormField,
    FormUnexpectedErrorComponent,
    MatButton,
    MatError,
    MatFormField,
    MatHint,
    MatInput,
    MatLabel,
    MatOption,
    MatSelect,
    RouterLink,
  ],
  templateUrl: "./admin-link-form.component.html",
  styleUrl: "./admin-link-form.component.scss",
})
export class AdminLinkFormComponent {
  private readonly adminLinksQueryService = inject(AdminLinksQueryService);
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

  private readonly hasInvalidId = computed(
    () => this.id() !== undefined && this.numericId() === undefined,
  );

  protected readonly isEditMode = computed(() => this.id() !== undefined);

  private readonly linkItemQuery = injectQuery(() =>
    this.adminLinksQueryService.getAdminLink(this.numericId()),
  );

  protected readonly categoriesQuery = injectQuery(() =>
    this.adminLinksQueryService.getAdminLinkCategories(),
  );

  protected readonly categories = computed(
    () => this.categoriesQuery.data() ?? [],
  );

  private readonly redirectOnInvalidIdEffect = effect(() => {
    if (this.hasInvalidId()) {
      this.router.navigate(["/admin/linkek"], { replaceUrl: true });
    }
  });

  private readonly pageTitleEffect = effect(() => {
    const title = this.linkItemQuery.data()?.title;
    if (title) {
      this.breadcrumbService.setBreadcrumb(
        `Admin - Link szerkesztése - ${title}`,
      );
      this.titleService.setTitle(`${title} - Zephyr Bt.`);
    }
  });

  protected readonly linkModel = linkedSignal<
    AdminLinkResponse | undefined,
    AdminLinkFormModel
  >({
    source: () => this.linkItemQuery.data(),
    computation: (data, previous): AdminLinkFormModel => {
      if (previous?.source !== undefined) {
        return previous.value;
      }

      if (!data) {
        return EMPTY_LINK_MODEL;
      }

      return {
        categorySelection: data.category?.id ?? "none",
        newCategoryName: "",
        title: data.title,
        url: data.url,
      };
    },
  });

  readonly linkForm = form(this.linkModel, (schemaPath) => {
    required(schemaPath.categorySelection);
    required(schemaPath.newCategoryName, {
      when: ({ valueOf }) => valueOf(schemaPath.categorySelection) === "new",
      message: "Kötelező mező",
    });
    maxLength(schemaPath.newCategoryName, 255);
    validate(schemaPath.newCategoryName, ({ value, valueOf }) => {
      if (valueOf(schemaPath.categorySelection) !== "new") {
        return null;
      }

      if (value().trim() !== UNCATEGORISED_NAME) {
        return null;
      }

      return { kind: "reserved", message: "Ez a kategórianév foglalt." };
    });
    required(schemaPath.title);
    maxLength(schemaPath.title, 500);
    required(schemaPath.url);
    maxLength(schemaPath.url, 500);
    pattern(schemaPath.url, URL_PATTERN, {
      message: "A cím protokollal együtt adható meg (pl.: https://)",
    });
  });

  protected readonly isNewCategory = computed(
    () => this.linkForm.categorySelection().value() === "new",
  );

  protected readonly createLinkMutation = injectMutation(() =>
    this.adminLinksQueryService.createAdminLink(),
  );

  protected readonly updateLinkMutation = injectMutation(() =>
    this.adminLinksQueryService.updateAdminLink(),
  );

  protected readonly isSubmitting = computed(
    () =>
      this.createLinkMutation.isPending() ||
      this.updateLinkMutation.isPending(),
  );

  protected readonly submitLabel = computed(() =>
    this.isEditMode() ? "Link módosítása" : "Beküldés",
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
    this.linkItemQuery.isError() || this.categoriesQuery.isError()
      ? "INTERNAL_SERVER_ERROR"
      : undefined,
  );

  protected onCategorySelectionChange(event: MatSelectChange): void {
    if (event.value !== "new") {
      this.linkForm.newCategoryName().value.set("");
    }
  }

  async onSubmit(event: Event) {
    event.preventDefault();

    await submit(this.linkForm, async () => {
      try {
        this.errorMessage.set("");

        const model = this.linkModel();
        const request: SaveAdminLinkRequest = {
          title: model.title,
          url: model.url,
          categoryName: this.resolveCategoryName(model),
        };

        const numericId = this.numericId();

        if (numericId === undefined) {
          await this.createLinkMutation.mutateAsync(request);
        } else {
          await this.updateLinkMutation.mutateAsync({
            id: numericId,
            request,
          });
        }

        this.router.navigate(["/admin/linkek"]);
      } catch (error) {
        if (error instanceof ZephyrHttpError) {
          this.errorMessage.set(error.code);
        } else {
          this.errorMessage.set("INTERNAL_SERVER_ERROR");
        }
      }
    });
  }

  private resolveCategoryName(model: AdminLinkFormModel): string | null {
    if (model.categorySelection === "none") {
      return null;
    }

    if (model.categorySelection === "new") {
      return model.newCategoryName.trim();
    }

    return (
      this.categories().find(
        (category) => category.id === model.categorySelection,
      )?.name ?? null
    );
  }
}
