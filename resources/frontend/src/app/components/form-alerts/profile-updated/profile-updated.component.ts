import { Component, input } from "@angular/core";

import { SuccessCardComponent } from "../../success-card/success-card.component";

@Component({
  selector: "app-profile-updated",
  imports: [SuccessCardComponent],
  templateUrl: "./profile-updated.component.html",
})
export class ProfileUpdatedComponent {
  savedEmail = input.required<string | undefined>();
  isPasswordSaved = input.required<boolean>();
  savedNewsletter = input.required<boolean | undefined>();
}
