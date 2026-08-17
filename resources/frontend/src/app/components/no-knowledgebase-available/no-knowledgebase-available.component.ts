import { Component } from "@angular/core";

import { zephyr } from "../../../constants/forms";

@Component({
  selector: "app-no-knowledgebase-available",
  host: {
    class: "app-no-knowledgebase-available",
  },
  imports: [],
  templateUrl: "./no-knowledgebase-available.component.html",
  styleUrl: "./no-knowledgebase-available.component.scss",
})
export class NoKnowledgebaseAvailableComponent {
  protected readonly zephyrEmail = zephyr;
}
