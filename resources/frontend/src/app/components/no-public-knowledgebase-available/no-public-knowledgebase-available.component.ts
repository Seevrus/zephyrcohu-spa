import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-no-public-knowledgebase-available",
  host: {
    class: "app-no-public-knowledgebase-available",
  },
  imports: [RouterLink],
  templateUrl: "./no-public-knowledgebase-available.component.html",
  styleUrl: "./no-public-knowledgebase-available.component.scss",
})
export class NoPublicKnowledgebaseAvailableComponent {
  numberOfAdditionalKnowledgebase = input.required<number>();
}
