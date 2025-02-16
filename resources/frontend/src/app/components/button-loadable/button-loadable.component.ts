import { Component, Input } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatProgressSpinner } from "@angular/material/progress-spinner";

@Component({
  selector: "app-button-loadable",
  imports: [MatButton, MatProgressSpinner],
  templateUrl: "./button-loadable.component.html",
  styleUrl: "./button-loadable.component.scss",
})
export class ButtonLoadableComponent {
  @Input() public loading = false;
  @Input() public disabled = false;
  @Input() public type = "button";
}
