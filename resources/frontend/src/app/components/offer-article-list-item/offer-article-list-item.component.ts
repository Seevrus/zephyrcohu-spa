import {
  Component,
  computed,
  inject,
  input,
  SecurityContext,
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { RouterLink } from "@angular/router";

import { formatDisplayDate } from "../../../mappers/dates";

@Component({
  selector: "app-offer-article-list-item",
  host: {
    class: "app-offer-article-list-item",
  },
  imports: [RouterLink],
  templateUrl: "./offer-article-list-item.component.html",
  styleUrl: "./offer-article-list-item.component.scss",
})
export class OfferArticleListItemComponent {
  private readonly sanitizer = inject(DomSanitizer);

  additionalContent = input.required<string | null>();
  id = input.required<number>();
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
