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
import { KnowledgebaseQueryService } from "../../services/knowledgebase.query.service";
import { NotFoundComponent } from "../not-found/not-found.component";
import { RegisteredOnlyComponent } from "../registered-only/registered-only.component";

@Component({
  selector: "app-knowledgebase-article",
  host: {
    class: "app-knowledgebase-article",
  },
  imports: [
    FormUnexpectedErrorComponent,
    MatChip,
    MatDivider,
    MatProgressBar,
    NotFoundComponent,
    RegisteredOnlyComponent,
  ],
  templateUrl: "./knowledgebase-article.component.html",
  styleUrl: "./knowledgebase-article.component.scss",
})
export class KnowledgebaseArticleComponent {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly knowledgebaseQueryService = inject(
    KnowledgebaseQueryService,
  );
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly titleService = inject(Title);

  readonly id = input.required<string>();

  private readonly knowledgebaseItemId = computed(() => {
    const numericId = Number(this.id());
    return Number.isInteger(numericId) ? numericId : undefined;
  });

  private readonly markKnowledgebaseItemAsReadMutation = injectMutation(() =>
    this.knowledgebaseQueryService.markKnowledgebaseItemAsRead(),
  );

  private readonly knowledgebaseItemQuery = injectQuery(() =>
    this.knowledgebaseQueryService.getKnowledgebaseItem(
      this.knowledgebaseItemId(),
    ),
  );

  protected readonly additionalContentHtml = computed(() => {
    const additionalContent =
      this.knowledgebaseItemQuery.data()?.additionalContent;
    return additionalContent
      ? this.sanitizer.sanitize(SecurityContext.HTML, additionalContent)
      : "";
  });
  protected readonly displayUpdatedAt = computed(() => {
    const updatedAt = this.knowledgebaseItemQuery.data()?.updatedAt;
    return updatedAt ? formatDisplayDate(updatedAt) : "";
  });

  /**
   * GENERIC_UNAUTHORIZED
   * || GENERIC_NOT_FOUND
   * || INTERNAL_SERVER_ERROR
   */
  protected readonly errorMessage = computed(
    () => this.knowledgebaseItemQuery.error()?.code,
  );

  protected readonly isLoading = computed(() =>
    this.knowledgebaseItemQuery.isPending(),
  );
  protected readonly isRead = computed(
    () => this.knowledgebaseItemQuery.data()?.isRead,
  );
  protected readonly mainContentHtml = computed(() => {
    const mainContent = this.knowledgebaseItemQuery.data()?.mainContent;
    return mainContent
      ? this.sanitizer.sanitize(SecurityContext.HTML, mainContent)
      : "";
  });
  protected readonly tags = computed(
    () => this.knowledgebaseItemQuery.data()?.tags ?? [],
  );
  protected readonly title = computed(
    () => this.knowledgebaseItemQuery.data()?.title,
  );

  private readonly breadcrumbEffect = effect(() => {
    const title = this.title();
    if (title) {
      this.breadcrumbService.setBreadcrumb(`Tudásbázis - Cikkek - ${title}`);
      this.titleService.setTitle(`${title} - Zephyr Bt.`);
    }
  });

  private readonly redirectOnInvalidIdEffect = effect(() => {
    if (this.knowledgebaseItemId() === undefined) {
      this.router.navigate(["/tudasbazis/cikkek"], { replaceUrl: true });
    }
  });

  protected onMarkedAsRead() {
    const knowledgebaseItemId = this.knowledgebaseItemId();
    if (knowledgebaseItemId !== undefined) {
      this.markKnowledgebaseItemAsReadMutation.mutate(knowledgebaseItemId);
    }
  }
}
