import { Component, input, output } from "@angular/core";

@Component({
  selector: "app-news-article",
  imports: [],
  templateUrl: "./news-article.component.html",
  styleUrl: "./news-article.component.scss",
})
export class NewsArticleComponent {
  additionalContent = input.required<string | null>();
  id = input.required<number>();
  isRead = input.required<boolean | null>();
  mainContent = input.required<string>();
  title = input.required<string>();
  updatedAt = input.required<Date>();

  markedAsRead = output<number>();
}
