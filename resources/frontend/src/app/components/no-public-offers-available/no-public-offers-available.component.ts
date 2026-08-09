import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-no-public-offers-available",
  host: {
    class: "app-no-public-offers-available",
  },
  imports: [RouterLink],
  templateUrl: "./no-public-offers-available.component.html",
  styleUrl: "./no-public-offers-available.component.scss",
})
export class NoPublicOffersAvailableComponent {
  numberOfAdditionalOffers = input.required<number>();
}
