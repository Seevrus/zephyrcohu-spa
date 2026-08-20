import {
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from "@angular/core";
import { type PageEvent } from "@angular/material/paginator";
import { MatProgressBar } from "@angular/material/progress-bar";
import { RouterLink } from "@angular/router";
import { injectQuery } from "@tanstack/angular-query-experimental";

import { AdditionalKnowledgebaseAvailableComponent } from "../../components/additional-knowledgebase-available/additional-knowledgebase-available.component";
import { FormUnexpectedErrorComponent } from "../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { KnowledgebaseArticleListItemComponent } from "../../components/knowledgebase-article-list-item/knowledgebase-article-list-item.component";
import { NoKnowledgebaseAvailableComponent } from "../../components/no-knowledgebase-available/no-knowledgebase-available.component";
import { NoPublicKnowledgebaseAvailableComponent } from "../../components/no-public-knowledgebase-available/no-public-knowledgebase-available.component";
import { PaginatorHuComponent } from "../../components/paginator-hu/paginator-hu.component";
import { TagCloudComponent } from "../../components/tag-cloud/tag-cloud.component";
import { KnowledgebaseQueryService } from "../../services/knowledgebase.query.service";

@Component({
  selector: "app-knowledgebase",
  host: {
    class: "app-knowledgebase",
  },
  imports: [
    AdditionalKnowledgebaseAvailableComponent,
    FormUnexpectedErrorComponent,
    KnowledgebaseArticleListItemComponent,
    MatProgressBar,
    NoKnowledgebaseAvailableComponent,
    NoPublicKnowledgebaseAvailableComponent,
    PaginatorHuComponent,
    RouterLink,
    TagCloudComponent,
  ],
  templateUrl: "./knowledgebase.component.html",
  styleUrl: "./knowledgebase.component.scss",
})
export class KnowledgebaseComponent {
  private readonly knowledgebaseQueryService = inject(
    KnowledgebaseQueryService,
  );

  readonly oldal = input<string>();
  readonly cimke = input<string>();

  private readonly pageFromQueryParam = computed(() => {
    const pageNumber = this.oldal() ? Number(this.oldal()) : undefined;
    return Number.isInteger(pageNumber) ? pageNumber : 1;
  });

  protected readonly currentPage = linkedSignal(() =>
    this.pageFromQueryParam(),
  );

  protected readonly activeTag = computed(() => {
    const tagId = this.cimke() ? Number(this.cimke()) : undefined;
    return Number.isInteger(tagId) ? tagId : undefined;
  });

  private readonly knowledgebaseQuery = injectQuery(() =>
    this.knowledgebaseQueryService.getKnowledgebase(
      this.currentPage(),
      this.activeTag(),
    ),
  );

  private readonly tagsQuery = injectQuery(() =>
    this.knowledgebaseQueryService.getKnowledgebaseTags(),
  );

  protected readonly tags = computed(() => this.tagsQuery.data() ?? []);

  protected readonly activeTagName = computed(() => {
    const tagId = this.activeTag();
    return tagId === undefined
      ? undefined
      : this.tags().find((tag) => tag.id === tagId)?.name;
  });

  protected readonly numberOfAdditionalKnowledgebase = computed(() => {
    const { count = 0, total = 0 } = this.knowledgebaseQuery.data()?.meta ?? {};
    return total - count;
  });

  protected readonly areAdditionalKnowledgebaseAvailable = computed(
    () =>
      !this.knowledgebaseQuery.isPending() &&
      this.numberOfAdditionalKnowledgebase() > 0,
  );

  protected readonly areKnowledgebaseError = computed(() =>
    this.knowledgebaseQuery.isError(),
  );
  protected readonly areKnowledgebaseFetching =
    this.knowledgebaseQuery.isFetching;

  protected readonly knowledgebase = computed(
    () => this.knowledgebaseQuery.data()?.data ?? [],
  );

  protected readonly numberOfKnowledgebaseAvailable = computed(
    () => this.knowledgebaseQuery.data()?.meta.count ?? 0,
  );

  protected readonly noKnowledgebaseAvailable = computed(
    () =>
      !this.knowledgebaseQuery.isPending() &&
      this.knowledgebaseQuery.data()?.meta.total === 0,
  );

  protected readonly noPublicKnowledgebaseAvailable = computed(
    () =>
      !this.knowledgebaseQuery.isPending() &&
      this.numberOfKnowledgebaseAvailable() === 0 &&
      this.numberOfAdditionalKnowledgebase() > 0,
  );

  protected onPaginationModelChange({ pageIndex }: PageEvent) {
    this.currentPage.set(pageIndex + 1);
  }
}
