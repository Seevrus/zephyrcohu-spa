import { Component, input } from "@angular/core";

import { SuccessCardComponent } from "../../success-card/success-card.component";

@Component({
  selector: "app-profile-email-updated",
  imports: [SuccessCardComponent],
  templateUrl: "./profile-email-updated.component.html",
})
export class ProfileEmailUpdatedComponent {
  confirmedNewEmail = input.required<string>();
}
