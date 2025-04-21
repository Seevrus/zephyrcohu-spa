import { Component, Input } from "@angular/core";
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardSubtitle,
} from "@angular/material/card";

@Component({
  selector: "app-error-card",
  host: {
    class: "app-error-card",
  },
  imports: [MatCard, MatCardContent, MatCardHeader, MatCardSubtitle],
  templateUrl: "./error-card.component.html",
  styleUrl: "./error-card.component.scss",
})
export class ErrorCardComponent {
  @Input({ required: true }) public title = "";
  @Input({ required: true }) public message = "";
}
