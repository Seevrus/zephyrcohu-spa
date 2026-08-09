import { Component } from "@angular/core";

import { zephyr } from "../../../constants/forms";

@Component({
  selector: "app-no-offers-available",
  host: {
    class: "app-no-offers-available",
  },
  imports: [],
  templateUrl: "./no-offers-available.component.html",
  styleUrl: "./no-offers-available.component.scss",
})
export class NoOffersAvailableComponent {
  protected readonly zephyrEmail = zephyr;
}
