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
import { NewsQueryService } from "../../services/news.query.service";

@Component({
  selector: "app-news",
  imports: [],
  templateUrl: "./news.component.html",
  styleUrl: "./news.component.scss",
})
export class NewsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly newsQueryService = inject(NewsQueryService);

  private pathParamsSubscription: Subscription | null = null;

  private readonly newsQuery = injectQuery(() =>
    this.newsQueryService.getNews(this.currentPage()),
  );

  private readonly currentPage = signal<number | undefined>(undefined);

  private readonly numberOfAdditionalNews = computed(() => {
    const { count = 0, total = 0 } = this.newsQuery.data()?.meta ?? {};
    return total - count;
  });

  ngOnInit() {
    this.pathParamsSubscription = this.route.paramMap.subscribe((params) => {
      const page = params.get("page");
      const pageNumber = page ? Number(page) : undefined;
      this.currentPage.set(Number.isInteger(pageNumber) ? pageNumber : 1);
    });
  }

  ngOnDestroy() {
    this.pathParamsSubscription?.unsubscribe();
  }
}
