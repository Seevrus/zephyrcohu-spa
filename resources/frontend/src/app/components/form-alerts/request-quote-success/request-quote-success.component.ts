import { Component } from "@angular/core";

import { zephyr } from "../../../../constants/forms";
import { SuccessCardComponent } from "../../success-card/success-card.component";

@Component({
  selector: "app-request-quote-success",
  imports: [SuccessCardComponent],
  templateUrl: "./request-quote-success.component.html",
})
export class RequestQuoteSuccessComponent {
  protected readonly zephyrEmail = zephyr;
}
