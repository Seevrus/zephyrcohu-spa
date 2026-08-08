import {
  Component,
  computed,
  effect,
  inject,
  input,
  SecurityContext,
} from "@angular/core";
import { MatChip } from "@angular/material/chips";
import { MatDivider } from "@angular/material/list";
import { MatProgressBar } from "@angular/material/progress-bar";
import { DomSanitizer, Title } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { injectQuery } from "@tanstack/angular-query-experimental";

import { formatDisplayDate } from "../../../mappers/dates";
import { BreadcrumbService } from "../../services/breadcrumb.service";
import { NewsQueryService } from "../../services/news.query.service";

@Component({
  selector: "app-news-article",
  host: {
    class: "app-news-article",
  },
  imports: [MatChip, MatDivider, MatProgressBar],
  templateUrl: "./news-article.component.html",
  styleUrl: "./news-article.component.scss",
})
export class NewsArticleComponent {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly newsQueryService = inject(NewsQueryService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly titleService = inject(Title);

  readonly id = input.required<string>();

  private readonly newsItemId = computed(() => {
    const numericId = Number(this.id());
    return Number.isInteger(numericId) ? numericId : undefined;
  });

  private readonly newsItemQuery = injectQuery(() =>
    this.newsQueryService.getNewsItem(this.newsItemId()),
  );

  protected readonly additionalContentHtml = computed(() => {
    const additionalContent = this.newsItemQuery.data()?.additionalContent;
    return additionalContent
      ? this.sanitizer.sanitize(SecurityContext.HTML, additionalContent)
      : "";
  });
  protected readonly displayUpdatedAt = computed(() => {
    const updatedAt = this.newsItemQuery.data()?.updatedAt;
    return updatedAt ? formatDisplayDate(updatedAt) : "";
  });
  protected readonly isLoading = computed(() => this.newsItemQuery.isPending());
  protected readonly isRead = computed(() => this.newsItemQuery.data()?.isRead);
  protected readonly mainContentHtml = computed(() => {
    const mainContent = this.newsItemQuery.data()?.mainContent;
    return mainContent
      ? this.sanitizer.sanitize(SecurityContext.HTML, mainContent)
      : "";
  });
  protected readonly title = computed(() => this.newsItemQuery.data()?.title);

  private readonly breadcrumbEffect = effect(() => {
    const title = this.title();
    if (title) {
      this.breadcrumbService.setBreadcrumb(`Hírek - ${title}`);
      this.titleService.setTitle(title);
    }
  });

  private readonly redirectOnInvalidIdEffect = effect(() => {
    if (this.newsItemId() === undefined) {
      this.router.navigate(["/hirek"], { replaceUrl: true });
    }
  });

  protected onMarkedAsRead() {
    // Intentionally empty: marking articles as read is not implemented yet.
  }
}
