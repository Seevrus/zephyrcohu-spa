import {
  Component,
  computed,
  inject,
  input,
  SecurityContext,
} from "@angular/core";
import { MatChip } from "@angular/material/chips";
import { DomSanitizer } from "@angular/platform-browser";
import { RouterLink } from "@angular/router";

import { formatDisplayDate } from "../../../mappers/dates";

@Component({
  selector: "app-news-article-list-item",
  host: {
    class: "app-news-article-list-item",
  },
  imports: [MatChip, RouterLink],
  templateUrl: "./news-article-list-item.component.html",
  styleUrl: "./news-article-list-item.component.scss",
})
export class NewsArticleListItemComponent {
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

  protected readonly mainContentHtml = computed(() =>
    this.sanitizer.sanitize(SecurityContext.HTML, this.mainContent()),
  );
}
