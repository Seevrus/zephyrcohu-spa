import {
  Component,
  computed,
  inject,
  type OnDestroy,
  type OnInit,
  signal,
} from "@angular/core";
import { type PageEvent } from "@angular/material/paginator";
import { MatProgressBar } from "@angular/material/progress-bar";
import { ActivatedRoute } from "@angular/router";
import { injectQuery } from "@tanstack/angular-query-experimental";
import type { Subscription } from "rxjs";

import { type QueryParamsByPath } from "../../app.routes";
import { AdditionalNewsAvailableComponent } from "../../components/additional-news-available/additional-news-available.component";
import { NewsArticleExpandableComponent } from "../../components/news-article-expandable/news-article-expandable.component";
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
    MatProgressBar,
    NewsArticleExpandableComponent,
    NoNewsAvailableComponent,
    NoPublicNewsAvailableComponent,
    PaginatorHuComponent,
  ],
  templateUrl: "./news.component.html",
  styleUrl: "./news.component.scss",
})
export class NewsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly newsQueryService = inject(NewsQueryService);

  private queryParamsSubscription: Subscription | null = null;

  protected readonly currentPage = signal<number | undefined>(undefined);

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

  ngOnInit() {
    this.queryParamsSubscription = this.route.queryParams.subscribe(
      ({ oldal }: QueryParamsByPath["hirek"]) => {
        const pageNumber = oldal ? Number(oldal) : undefined;
        this.currentPage.set(Number.isInteger(pageNumber) ? pageNumber : 1);
      },
    );
  }

  ngOnDestroy() {
    this.queryParamsSubscription?.unsubscribe();
  }

  protected onPaginationModelChange({ pageIndex }: PageEvent) {
    this.currentPage.set(pageIndex + 1);
  }
}
