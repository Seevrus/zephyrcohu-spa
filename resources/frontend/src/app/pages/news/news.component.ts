import {
  Component,
  computed,
  inject,
  type OnDestroy,
  type OnInit,
  signal,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { injectQuery } from "@tanstack/angular-query-experimental";
import type { Subscription } from "rxjs";

import { type QueryParamsByPath } from "../../app.routes";
import { AdditionalNewsAvailableComponent } from "../../components/additional-news-available/additional-news-available.component";
import { NewsArticleComponent } from "../../components/news-article/news-article.component";
import { NoNewsAvailableComponent } from "../../components/no-news-available/no-news-available.component";
import { NoPublicNewsAvailableComponent } from "../../components/no-public-news-available/no-public-news-available.component";
import { NewsQueryService } from "../../services/news.query.service";
import { UsersQueryService } from "../../services/users.query.service";

@Component({
  selector: "app-news",
  host: {
    class: "app-news",
  },
  imports: [
    AdditionalNewsAvailableComponent,
    NewsArticleComponent,
    NoNewsAvailableComponent,
    NoPublicNewsAvailableComponent,
  ],
  templateUrl: "./news.component.html",
  styleUrl: "./news.component.scss",
})
export class NewsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly newsQueryService = inject(NewsQueryService);
  private readonly usersQueryService = inject(UsersQueryService);

  private queryParamsSubscription: Subscription | null = null;

  private readonly newsQuery = injectQuery(() =>
    this.newsQueryService.getNews(this.currentPage()),
  );

  private readonly sessionQuery = injectQuery(() =>
    this.usersQueryService.session(),
  );

  private readonly currentPage = signal<number | undefined>(undefined);

  protected readonly news = computed(() => this.newsQuery.data()?.data ?? []);

  protected readonly noNewsAvailable = computed(
    () =>
      !this.newsQuery.isPending() && this.newsQuery.data()?.meta.total === 0,
  );

  protected readonly noPublicNewsAvailable = computed(
    () =>
      !this.newsQuery.isPending() &&
      this.newsQuery.data()?.meta.count === 0 &&
      this.numberOfAdditionalNews() > 0,
  );

  protected readonly numberOfAdditionalNews = computed(() => {
    const { count = 0, total = 0 } = this.newsQuery.data()?.meta ?? {};
    return total - count;
  });

  protected readonly showReadStatus = computed(
    () => !this.sessionQuery.isPending() && !!this.sessionQuery.data(),
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

  onMarkAsRead(id: number) {
    console.log(id);
  }
}
