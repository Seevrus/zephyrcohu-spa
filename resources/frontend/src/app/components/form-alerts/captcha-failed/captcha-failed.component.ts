import { Component } from "@angular/core";

import { zephyr } from "../../../../constants/forms";
import { ErrorCardComponent } from "../../error-card/error-card.component";

@Component({
  selector: "app-captcha-failed",
  imports: [ErrorCardComponent],
  templateUrl: "./captcha-failed.component.html",
})
export class CaptchaFailedComponent {
  protected readonly zephyrEmail = zephyr;
}
