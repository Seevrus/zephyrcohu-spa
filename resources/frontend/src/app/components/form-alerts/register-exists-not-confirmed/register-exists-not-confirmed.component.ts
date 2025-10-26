import { Component, input, output } from "@angular/core";

import { zephyr } from "../../../../constants/email";
import { ErrorCardComponent } from "../../error-card/error-card.component";

@Component({
  selector: "app-register-exists-not-confirmed",
  imports: [ErrorCardComponent],
  templateUrl: "./register-exists-not-confirmed.component.html",
})
export class RegisterExistsNotConfirmedComponent {
  readonly email = input.required<string>();
  readonly resendConfirmationEmail = output<Promise<void>>();

  protected readonly zephyrEmail = zephyr;

  onResendConfirmationEmail() {
    this.resendConfirmationEmail.emit();
  }
}
