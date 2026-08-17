import {
  Component,
  computed,
  effect,
  inject,
  input,
  SecurityContext,
} from "@angular/core";
import { MatProgressBar } from "@angular/material/progress-bar";
import { DomSanitizer, Title } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { injectQuery } from "@tanstack/angular-query-experimental";

import { formatDisplayDate } from "../../../mappers/dates";
import { FormUnexpectedErrorComponent } from "../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { BreadcrumbService } from "../../services/breadcrumb.service";
import { OffersQueryService } from "../../services/offers.query.service";
import { NotFoundComponent } from "../not-found/not-found.component";
import { RegisteredOnlyComponent } from "../registered-only/registered-only.component";

@Component({
  selector: "app-offer",
  host: {
    class: "app-offer",
  },
  imports: [
    FormUnexpectedErrorComponent,
    MatProgressBar,
    NotFoundComponent,
    RegisteredOnlyComponent,
  ],
  templateUrl: "./offer.component.html",
  styleUrl: "./offer.component.scss",
})
export class OfferComponent {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly offersQueryService = inject(OffersQueryService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly titleService = inject(Title);

  readonly id = input.required<string>();

  private readonly offerItemId = computed(() => {
    const numericId = Number(this.id());
    return Number.isInteger(numericId) ? numericId : undefined;
  });

  private readonly offerItemQuery = injectQuery(() =>
    this.offersQueryService.getOfferItem(this.offerItemId()),
  );

  protected readonly additionalContentHtml = computed(() => {
    const additionalContent = this.offerItemQuery.data()?.additionalContent;
    return additionalContent
      ? this.sanitizer.sanitize(SecurityContext.HTML, additionalContent)
      : "";
  });
  protected readonly displayUpdatedAt = computed(() => {
    const updatedAt = this.offerItemQuery.data()?.updatedAt;
    return updatedAt ? formatDisplayDate(updatedAt) : "";
  });

  /**
   * GENERIC_UNAUTHORIZED
   * || GENERIC_NOT_FOUND
   * || INTERNAL_SERVER_ERROR
   */
  protected readonly errorMessage = computed(
    () => this.offerItemQuery.error()?.code,
  );

  protected readonly isLoading = computed(() =>
    this.offerItemQuery.isPending(),
  );
  protected readonly mainContentHtml = computed(() => {
    const mainContent = this.offerItemQuery.data()?.mainContent;
    return mainContent
      ? this.sanitizer.sanitize(SecurityContext.HTML, mainContent)
      : "";
  });
  protected readonly title = computed(() => this.offerItemQuery.data()?.title);

  private readonly breadcrumbEffect = effect(() => {
    const title = this.title();
    if (title) {
      this.breadcrumbService.setBreadcrumb(`Ajánlatok - ${title}`);
      this.titleService.setTitle(`${title} - Zephyr Bt.`);
    }
  });

  private readonly redirectOnInvalidIdEffect = effect(() => {
    if (this.offerItemId() === undefined) {
      this.router.navigate(["/ajanlatok"], { replaceUrl: true });
    }
  });
}
