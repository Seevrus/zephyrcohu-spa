import { Component } from "@angular/core";

import { ErrorCardComponent } from "../../error-card/error-card.component";

@Component({
  selector: "app-user-already-logged-in",
  imports: [ErrorCardComponent],
  templateUrl: "./user-already-logged-in.component.html",
})
export class UserAlreadyLoggedInComponent {}
