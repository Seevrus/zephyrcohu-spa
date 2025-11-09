import { Component } from "@angular/core";
import { ErrorCardComponent } from "../../error-card/error-card.component";

@Component({
  selector: "app-email-code-expired",
  imports: [ErrorCardComponent],
  templateUrl: "./email-code-expired.component.html",
})
export class EmailCodeExpiredComponent {}
