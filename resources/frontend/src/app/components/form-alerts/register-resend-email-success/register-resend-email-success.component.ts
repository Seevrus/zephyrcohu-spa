import { Component, input } from "@angular/core";

import { zephyr } from "../../../../constants/forms";
import { SuccessCardComponent } from "../../success-card/success-card.component";

@Component({
  selector: "app-register-resend-email-success",
  imports: [SuccessCardComponent],
  templateUrl: "./register-resend-email-success.component.html",
})
export class RegisterResendEmailSuccessComponent {
  resentEmail = input.required<string>();

  protected readonly zephyrEmail = zephyr;
}
