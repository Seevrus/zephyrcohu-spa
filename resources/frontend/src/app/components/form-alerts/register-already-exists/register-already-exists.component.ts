import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

import { zephyr } from "../../../../constants/email";
import { ErrorCardComponent } from "../../error-card/error-card.component";

@Component({
  selector: "app-register-already-exists",
  imports: [ErrorCardComponent, RouterLink],
  templateUrl: "./register-already-exists.component.html",
})
export class RegisterAlreadyExistsComponent {
  protected readonly zephyrEmail = zephyr;
}
