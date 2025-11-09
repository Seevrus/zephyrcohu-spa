import { Component } from "@angular/core";

import { ErrorCardComponent } from "../../error-card/error-card.component";

@Component({
  selector: "app-bad-credentials",
  imports: [ErrorCardComponent],
  templateUrl: "./bad-credentials.component.html",
})
export class BadCredentialsComponent {}
