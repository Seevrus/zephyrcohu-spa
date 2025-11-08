import { Component, input } from "@angular/core";

import { zephyr } from "../../../../constants/forms";
import { SuccessCardComponent } from "../../success-card/success-card.component";

@Component({
  selector: "app-register-success",
  imports: [SuccessCardComponent],
  templateUrl: "./register-success.component.html",
})
export class RegisterSuccessComponent {
  registeredEmail = input.required<string>();

  protected readonly zephyrEmail = zephyr;
}
