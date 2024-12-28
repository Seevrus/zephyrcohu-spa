import { Component } from "@angular/core";
import { MatAnchor } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: "app-footer",
  imports: [MatAnchor, MatIcon],
  templateUrl: "./footer.component.html",
  styleUrl: "./footer.component.scss",
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
