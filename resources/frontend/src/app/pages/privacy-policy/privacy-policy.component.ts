import { Component } from "@angular/core";
import { MatLine } from "@angular/material/core";
import {
  MatList,
  MatListItem,
  MatListItemLine,
  MatListItemTitle,
} from "@angular/material/list";

import { zephyr } from "../../../constants/forms";

@Component({
  selector: "app-privacy-policy",
  host: {
    class: "app-privacy-policy",
  },
  imports: [MatLine, MatList, MatListItem, MatListItemLine, MatListItemTitle],
  templateUrl: "./privacy-policy.component.html",
  styleUrl: "./privacy-policy.component.scss",
})
export class PrivacyPolicyComponent {
  protected readonly zephyrEmail = zephyr;
}
