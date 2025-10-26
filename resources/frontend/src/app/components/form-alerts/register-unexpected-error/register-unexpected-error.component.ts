import { Component } from "@angular/core";

import { zephyr } from "../../../../constants/email";
import { ErrorCardComponent } from "../../error-card/error-card.component";

@Component({
  selector: "app-register-unexpected-error",
  imports: [ErrorCardComponent],
  templateUrl: "./register-unexpected-error.component.html",
  styleUrl: "./register-unexpected-error.component.scss",
})
export class RegisterUnexpectedErrorComponent {
  protected readonly zephyrEmail = zephyr;
}
