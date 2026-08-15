import { Component } from "@angular/core";

import { zephyr } from "../../../constants/forms";

@Component({
  selector: "app-no-integra-documents-available",
  host: {
    class: "app-no-integra-documents-available",
  },
  imports: [],
  templateUrl: "./no-integra-documents-available.component.html",
  styleUrl: "./no-integra-documents-available.component.scss",
})
export class NoIntegraDocumentsAvailableComponent {
  protected readonly zephyrEmail = zephyr;
}
