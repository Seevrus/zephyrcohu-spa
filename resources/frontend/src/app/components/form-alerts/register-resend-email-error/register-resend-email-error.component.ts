import { Component } from "@angular/core";

import { zephyr } from "../../../../constants/forms";
import { ErrorCardComponent } from "../../error-card/error-card.component";

@Component({
  selector: "app-register-resend-email-error",
  imports: [ErrorCardComponent],
  templateUrl: "./register-resend-email-error.component.html",
})
export class RegisterResendEmailErrorComponent {
  protected readonly zephyrEmail = zephyr;
}
