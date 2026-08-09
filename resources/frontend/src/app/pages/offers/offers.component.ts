import {
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from "@angular/core";
import { type PageEvent } from "@angular/material/paginator";
import { MatProgressBar } from "@angular/material/progress-bar";
import { injectQuery } from "@tanstack/angular-query-experimental";

import { AdditionalOffersAvailableComponent } from "../../components/additional-offers-available/additional-offers-available.component";
import { FormUnexpectedErrorComponent } from "../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { NoOffersAvailableComponent } from "../../components/no-offers-available/no-offers-available.component";
import { NoPublicOffersAvailableComponent } from "../../components/no-public-offers-available/no-public-offers-available.component";
import { OfferArticleListItemComponent } from "../../components/offer-article-list-item/offer-article-list-item.component";
import { PaginatorHuComponent } from "../../components/paginator-hu/paginator-hu.component";
import { OffersQueryService } from "../../services/offers.query.service";

@Component({
  selector: "app-offers",
  host: {
    class: "app-offers",
  },
  imports: [
    AdditionalOffersAvailableComponent,
    FormUnexpectedErrorComponent,
    MatProgressBar,
    NoOffersAvailableComponent,
    NoPublicOffersAvailableComponent,
    OfferArticleListItemComponent,
    PaginatorHuComponent,
  ],
  templateUrl: "./offers.component.html",
  styleUrl: "./offers.component.scss",
})
export class OffersComponent {
  private readonly offersQueryService = inject(OffersQueryService);

  readonly oldal = input<string>();

  private readonly pageFromQueryParam = computed(() => {
    const pageNumber = this.oldal() ? Number(this.oldal()) : undefined;
    return Number.isInteger(pageNumber) ? pageNumber : 1;
  });

  protected readonly currentPage = linkedSignal(() =>
    this.pageFromQueryParam(),
  );

  private readonly offersQuery = injectQuery(() =>
    this.offersQueryService.getOffers(this.currentPage()),
  );

  protected readonly numberOfAdditionalOffers = computed(() => {
    const { count = 0, total = 0 } = this.offersQuery.data()?.meta ?? {};
    return total - count;
  });

  protected readonly areAdditionalOffersAvailable = computed(
    () => !this.offersQuery.isPending() && this.numberOfAdditionalOffers() > 0,
  );

  protected readonly areOffersError = computed(() =>
    this.offersQuery.isError(),
  );
  protected readonly areOffersFetching = this.offersQuery.isFetching;

  protected readonly offers = computed(
    () => this.offersQuery.data()?.data ?? [],
  );

  protected readonly numberOfOffersAvailable = computed(
    () => this.offersQuery.data()?.meta.count ?? 0,
  );

  protected readonly noOffersAvailable = computed(
    () =>
      !this.offersQuery.isPending() &&
      this.offersQuery.data()?.meta.total === 0,
  );

  protected readonly noPublicOffersAvailable = computed(
    () =>
      !this.offersQuery.isPending() &&
      this.numberOfOffersAvailable() === 0 &&
      this.numberOfAdditionalOffers() > 0,
  );

  protected onPaginationModelChange({ pageIndex }: PageEvent) {
    this.currentPage.set(pageIndex + 1);
  }
}
