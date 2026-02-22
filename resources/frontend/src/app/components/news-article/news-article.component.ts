import {
  Component,
  computed,
  inject,
  input,
  output,
  SecurityContext,
  signal,
} from "@angular/core";
import {
  MatExpansionPanel,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
} from "@angular/material/expansion";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: "app-news-article",
  host: {
    class: "app-news-article",
  },
  imports: [
    MatExpansionPanel,
    MatExpansionPanelDescription,
    MatExpansionPanelHeader,
  ],
  templateUrl: "./news-article.component.html",
  styleUrl: "./news-article.component.scss",
})
export class NewsArticleComponent {
  private readonly sanitizer = inject(DomSanitizer);

  additionalContent = input.required<string | null>();
  id = input.required<number>();
  isRead = input.required<boolean | null>();
  mainContent = input.required<string>();
  title = input.required<string>();
  updatedAt = input.required<Date>();

  markedAsRead = output<number>();

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
