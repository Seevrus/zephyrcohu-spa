import { Component, input } from "@angular/core";
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardSubtitle,
} from "@angular/material/card";

@Component({
  selector: "app-success-card",
  host: {
    class: "app-success-card",
  },
  imports: [MatCard, MatCardContent, MatCardHeader, MatCardSubtitle],
  templateUrl: "./success-card.component.html",
  styleUrl: "./success-card.component.scss",
})
export class SuccessCardComponent {
  title = input.required<string>();
}
