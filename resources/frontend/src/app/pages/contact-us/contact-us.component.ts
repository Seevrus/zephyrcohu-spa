import { Component } from "@angular/core";
import { MatLine } from "@angular/material/core";
import { MatIcon } from "@angular/material/icon";
import { MatList, MatListItem, MatListItemIcon } from "@angular/material/list";

import { zephyr, zephyrInfo } from "../../../constants/forms";

@Component({
  selector: "app-contact-us",
  host: {
    class: "app-contact-us",
  },
  imports: [MatIcon, MatLine, MatList, MatListItem, MatListItemIcon],
  templateUrl: "./contact-us.component.html",
  styleUrl: "./contact-us.component.scss",
})
export class ContactUsComponent {
  protected readonly zephyrEmail = zephyr;
  protected readonly zephyrInfo = zephyrInfo;
}
