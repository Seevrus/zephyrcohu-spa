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
  type AdminOfferItem,
  type SaveAdminOfferRequest,
} from "../../../../types/admin-offers";
import { ButtonLoadableComponent } from "../../../components/button-loadable/button-loadable.component";
import { FormUnexpectedErrorComponent } from "../../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { RichTextEditorComponent } from "../../../components/rich-text-editor/rich-text-editor.component";
import { AdminOffersQueryService } from "../../../services/admin-offers.query.service";
import { BreadcrumbService } from "../../../services/breadcrumb.service";
import { richTextRequiredValidator } from "../../../validators/richTextRequiredValidator";

type AdminOfferFormModel = {
  audience: "A" | "P";
  title: string;
  mainContent: string;
  additionalContent: string;
  publishedAt: Date | null;
};

const EMPTY_OFFER_MODEL: AdminOfferFormModel = {
  audience: "P",
  title: "",
  mainContent: "",
  additionalContent: "",
  publishedAt: null,
};

@Component({
  selector: "app-admin-offer-form",
  host: {
    class: "app-admin-offer-form",
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
  templateUrl: "./admin-offer-form.component.html",
  styleUrl: "./admin-offer-form.component.scss",
})
export class AdminOfferFormComponent {
  private readonly adminOffersQueryService = inject(AdminOffersQueryService);
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
   * (e.g. `/admin/ajanlatok/ujjjj` falling through to `ajanlatok/:id` instead
   * of matching the literal `ajanlatok/uj` route). Redirected away rather
   * than silently falling back to create mode or querying
   * `/admin/offers/NaN` — mirrors `AdminNewsFormComponent`'s
   * `redirectOnInvalidIdEffect`.
   */
  private readonly hasInvalidId = computed(
    () => this.id() !== undefined && this.numericId() === undefined,
  );

  protected readonly isEditMode = computed(() => this.id() !== undefined);

  private readonly offerItemQuery = injectQuery(() =>
    this.adminOffersQueryService.getAdminOfferItem(this.numericId()),
  );

  private readonly redirectOnInvalidIdEffect = effect(() => {
    if (this.hasInvalidId()) {
      this.router.navigate(["/admin/ajanlatok"], { replaceUrl: true });
    }
  });

  private readonly pageTitleEffect = effect(() => {
    const title = this.offerItemQuery.data()?.title;
    if (title) {
      this.breadcrumbService.setBreadcrumb(
        `Admin - Ajánlat szerkesztése - ${title}`,
      );
      this.titleService.setTitle(`${title} - Zephyr Bt.`);
    }
  });

  protected readonly offerModel = linkedSignal<
    AdminOfferItem | undefined,
    AdminOfferFormModel
  >({
    source: () => this.offerItemQuery.data(),
    computation: (data, previous): AdminOfferFormModel => {
      if (previous?.source !== undefined) {
        return previous.value;
      }

      if (!data) {
        return EMPTY_OFFER_MODEL;
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

  readonly offerForm = form(this.offerModel, (schemaPath) => {
    required(schemaPath.audience);
    required(schemaPath.title);
    maxLength(schemaPath.title, 255);
    required(schemaPath.publishedAt);
    validate(schemaPath.mainContent, richTextRequiredValidator);
  });

  protected readonly createOfferMutation = injectMutation(() =>
    this.adminOffersQueryService.createAdminOffer(),
  );

  protected readonly updateOfferMutation = injectMutation(() =>
    this.adminOffersQueryService.updateAdminOffer(),
  );

  protected readonly isSubmitting = computed(
    () =>
      this.createOfferMutation.isPending() ||
      this.updateOfferMutation.isPending(),
  );

  protected readonly submitLabel = computed(() =>
    this.isEditMode() ? "Ajánlat módosítása" : "Beküldés",
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
    this.offerItemQuery.isError() ? "INTERNAL_SERVER_ERROR" : undefined,
  );

  async onSubmit(event: Event) {
    event.preventDefault();

    await submit(this.offerForm, async () => {
      try {
        this.errorMessage.set("");

        const model = this.offerModel();
        const request: SaveAdminOfferRequest = {
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
          await this.createOfferMutation.mutateAsync(request);
        } else {
          await this.updateOfferMutation.mutateAsync({
            id: numericId,
            request,
          });
        }

        this.router.navigate(["/admin/ajanlatok"]);
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
