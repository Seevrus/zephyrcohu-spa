import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-no-public-news-available",
  host: {
    class: "app-no-public-news-available",
  },
  imports: [RouterLink],
  templateUrl: "./no-public-news-available.component.html",
  styleUrl: "./no-public-news-available.component.scss",
})
export class NoPublicNewsAvailableComponent {
  numberOfAdditionalNews = input.required<number>();
}
