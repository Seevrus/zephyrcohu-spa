import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-additional-offers-available",
  host: {
    class: "app-additional-offers-available",
  },
  imports: [RouterLink],
  templateUrl: "./additional-offers-available.component.html",
  styleUrl: "./additional-offers-available.component.scss",
})
export class AdditionalOffersAvailableComponent {
  numberOfAdditionalOffers = input.required<number>();
}
