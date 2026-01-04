import { NgOptimizedImage } from "@angular/common";
import { Component } from "@angular/core";

import { zephyr } from "../../../constants/forms";

@Component({
  selector: "app-not-found",
  host: {
    class: "app-main",
  },
  imports: [NgOptimizedImage],
  templateUrl: "./not-found.component.html",
  styleUrl: "./not-found.component.scss",
})
export class NotFoundComponent {
  protected readonly zephyrEmail = zephyr;
}
