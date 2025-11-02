import { Component, input } from "@angular/core";

import { zephyr } from "../../../../constants/email";
import { SuccessCardComponent } from "../../success-card/success-card.component";

@Component({
  selector: "app-forgot-password-email-sent",
  imports: [SuccessCardComponent],
  templateUrl: "./forgot-password-email-sent.component.html",
})
export class ForgotPasswordEmailSentComponent {
  readonly email = input.required<string>();
  protected readonly zephyrEmail = zephyr;
}
