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
import {
  injectMutation,
  injectQuery,
} from "@tanstack/angular-query-experimental";

import { formatDisplayDate } from "../../../mappers/dates";
import { FormUnexpectedErrorComponent } from "../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { BreadcrumbService } from "../../services/breadcrumb.service";
import { NewsQueryService } from "../../services/news.query.service";
import { NotFoundComponent } from "../not-found/not-found.component";
import { RegisteredOnlyComponent } from "../registered-only/registered-only.component";

@Component({
  selector: "app-news-article",
  host: {
    class: "app-news-article",
  },
  imports: [
    FormUnexpectedErrorComponent,
    MatChip,
    MatDivider,
    MatProgressBar,
    NotFoundComponent,
    RegisteredOnlyComponent,
  ],
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

  private readonly markNewsItemAsReadMutation = injectMutation(() =>
    this.newsQueryService.markNewsItemAsRead(),
  );

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

  /**
   * GENERIC_UNAUTHORIZED
   * || GENERIC_NOT_FOUND
   * || INTERNAL_SERVER_ERROR
   */
  protected readonly errorMessage = computed(
    () => this.newsItemQuery.error()?.code,
  );

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
    const newsItemId = this.newsItemId();
    if (newsItemId !== undefined) {
      this.markNewsItemAsReadMutation.mutate(newsItemId);
    }
  }
}
