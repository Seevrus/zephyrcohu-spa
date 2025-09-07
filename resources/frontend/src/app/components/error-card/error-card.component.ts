import { Component, input } from "@angular/core";
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardSubtitle,
} from "@angular/material/card";

@Component({
  host: {
    class: "app-error-card",
  },
  imports: [MatCard, MatCardContent, MatCardHeader, MatCardSubtitle],
  selector: "app-error-card",
  styleUrl: "./error-card.component.scss",
  templateUrl: "./error-card.component.html",
})
export class ErrorCardComponent {
  title = input.required<string>();
}
