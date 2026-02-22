import {
  Component,
  computed,
  inject,
  input,
  SecurityContext,
  signal,
} from "@angular/core";
import { MatChip } from "@angular/material/chips";
import {
  MatExpansionPanel,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
} from "@angular/material/expansion";
import { DomSanitizer } from "@angular/platform-browser";

import { formatDisplayDate } from "../../../mappers/dates";

@Component({
  selector: "app-news-article-expandable",
  host: {
    class: "app-news-article-expandable",
  },
  imports: [
    MatChip,
    MatExpansionPanel,
    MatExpansionPanelDescription,
    MatExpansionPanelHeader,
  ],
  templateUrl: "./news-article-expandable.component.html",
  styleUrl: "./news-article-expandable.component.scss",
})
export class NewsArticleExpandableComponent {
  private readonly sanitizer = inject(DomSanitizer);

  additionalContent = input.required<string | null>();
  id = input.required<number>();
  isRead = input.required<boolean | undefined>();
  mainContent = input.required<string>();
  title = input.required<string>();
  updatedAt = input.required<Date>();

  protected readonly displayUpdatedAt = computed(() =>
    formatDisplayDate(this.updatedAt()),
  );

  protected readonly isNewsExpanded = signal(false);

  protected readonly mainContentHtml = computed(() =>
    this.sanitizer.sanitize(SecurityContext.HTML, this.mainContent()),
  );

  protected readonly additionalContentHtml = computed(() => {
    const additionalContent = this.additionalContent();

    return additionalContent
      ? this.sanitizer.sanitize(SecurityContext.HTML, additionalContent)
      : additionalContent;
  });

  protected toggleNews(state: boolean) {
    this.isNewsExpanded.set(state);
  }
}
