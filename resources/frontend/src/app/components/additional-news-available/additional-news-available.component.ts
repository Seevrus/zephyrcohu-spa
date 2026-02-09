import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-additional-news-available",
  host: {
    class: "app-additional-news-available",
  },
  imports: [RouterLink],
  templateUrl: "./additional-news-available.component.html",
  styleUrl: "./additional-news-available.component.scss",
})
export class AdditionalNewsAvailableComponent {
  numberOfAdditionalNews = input.required<number>();
}
