import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-additional-knowledgebase-available",
  host: {
    class: "app-additional-knowledgebase-available",
  },
  imports: [RouterLink],
  templateUrl: "./additional-knowledgebase-available.component.html",
  styleUrl: "./additional-knowledgebase-available.component.scss",
})
export class AdditionalKnowledgebaseAvailableComponent {
  numberOfAdditionalKnowledgebase = input.required<number>();
}
