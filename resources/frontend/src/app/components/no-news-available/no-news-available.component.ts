import { Component } from "@angular/core";

import { zephyr } from "../../../constants/forms";

@Component({
  selector: "app-no-news-available",
  host: {
    class: "app-no-news-available",
  },
  imports: [],
  templateUrl: "./no-news-available.component.html",
  styleUrl: "./no-news-available.component.scss",
})
export class NoNewsAvailableComponent {
  protected readonly zephyrEmail = zephyr;
}
