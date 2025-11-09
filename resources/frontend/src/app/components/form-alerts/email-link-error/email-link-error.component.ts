import { Component } from "@angular/core";

import { zephyr } from "../../../../constants/forms";
import { ErrorCardComponent } from "../../error-card/error-card.component";

@Component({
  selector: "app-email-link-error",
  imports: [ErrorCardComponent],
  templateUrl: "./email-link-error.component.html",
})
export class EmailLinkErrorComponent {
  protected readonly zephyrEmail = zephyr;
}
