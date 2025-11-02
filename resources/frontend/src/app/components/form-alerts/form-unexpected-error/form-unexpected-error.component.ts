import { Component } from "@angular/core";

import { zephyr } from "../../../../constants/email";
import { ErrorCardComponent } from "../../error-card/error-card.component";

@Component({
  selector: "app-form-unexpected-error",
  imports: [ErrorCardComponent],
  templateUrl: "./form-unexpected-error.component.html",
})
export class FormUnexpectedErrorComponent {
  protected readonly zephyrEmail = zephyr;
}
