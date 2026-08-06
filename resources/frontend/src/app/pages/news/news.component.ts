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

import { AdditionalNewsAvailableComponent } from "../../components/additional-news-available/additional-news-available.component";
import { FormUnexpectedErrorComponent } from "../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { NewsArticleListItemComponent } from "../../components/news-article-list-item/news-article-list-item.component";
import { NoNewsAvailableComponent } from "../../components/no-news-available/no-news-available.component";
import { NoPublicNewsAvailableComponent } from "../../components/no-public-news-available/no-public-news-available.component";
import { PaginatorHuComponent } from "../../components/paginator-hu/paginator-hu.component";
import { NewsQueryService } from "../../services/news.query.service";

@Component({
  selector: "app-news",
  host: {
    class: "app-news",
  },
  imports: [
    AdditionalNewsAvailableComponent,
    FormUnexpectedErrorComponent,
    MatProgressBar,
    NewsArticleListItemComponent,
    NoNewsAvailableComponent,
    NoPublicNewsAvailableComponent,
    PaginatorHuComponent,
  ],
  templateUrl: "./news.component.html",
  styleUrl: "./news.component.scss",
})
export class NewsComponent {
  private readonly newsQueryService = inject(NewsQueryService);

  readonly oldal = input<string>();

  private readonly pageFromQueryParam = computed(() => {
    const pageNumber = this.oldal() ? Number(this.oldal()) : undefined;
    return Number.isInteger(pageNumber) ? pageNumber : 1;
  });

  protected readonly currentPage = linkedSignal(() =>
    this.pageFromQueryParam(),
  );

  private readonly newsQuery = injectQuery(() =>
    this.newsQueryService.getNews(this.currentPage()),
  );

  protected readonly numberOfAdditionalNews = computed(() => {
    const { count = 0, total = 0 } = this.newsQuery.data()?.meta ?? {};
    return total - count;
  });

  protected readonly areAdditionalNewsAvailable = computed(
    () => !this.newsQuery.isPending() && this.numberOfAdditionalNews() > 0,
  );

  protected readonly areNewsError = computed(() => this.newsQuery.isError());
  protected readonly areNewsFetching = this.newsQuery.isFetching;

  protected readonly news = computed(() => this.newsQuery.data()?.data ?? []);

  protected readonly numberOfNewsAvailable = computed(
    () => this.newsQuery.data()?.meta.count ?? 0,
  );

  protected readonly noNewsAvailable = computed(
    () =>
      !this.newsQuery.isPending() && this.newsQuery.data()?.meta.total === 0,
  );

  protected readonly noPublicNewsAvailable = computed(
    () =>
      !this.newsQuery.isPending() &&
      this.numberOfNewsAvailable() === 0 &&
      this.numberOfAdditionalNews() > 0,
  );

  protected onPaginationModelChange({ pageIndex }: PageEvent) {
    this.currentPage.set(pageIndex + 1);
  }
}
