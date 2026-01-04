import { NgOptimizedImage } from "@angular/common";
import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

import { zephyr } from "../../../constants/forms";

@Component({
  selector: "app-registered-only",
  host: {
    class: "app-main",
  },
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: "./registered-only.component.html",
  styleUrl: "./registered-only.component.scss",
})
export class RegisteredOnlyComponent {
  protected readonly zephyrEmail = zephyr;
}
