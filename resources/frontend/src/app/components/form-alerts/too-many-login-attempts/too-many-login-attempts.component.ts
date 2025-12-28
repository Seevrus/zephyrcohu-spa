import { Component } from "@angular/core";

import { ErrorCardComponent } from "../../error-card/error-card.component";

@Component({
  selector: "app-too-many-login-attempts",
  imports: [ErrorCardComponent],
  templateUrl: "./too-many-login-attempts.component.html",
})
export class TooManyLoginAttemptsComponent {}
