import { Component, output } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { RouterLinkActive } from "@angular/router";

@Component({
  selector: "app-admin-nav",
  imports: [
    MatButton,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    RouterLinkActive,
  ],
  templateUrl: "./admin-nav.component.html",
  styleUrl: "./admin-nav.component.scss",
})
export class AdminNavComponent {
  readonly deactivateAdminNavigation = output<void>();

  protected onDeactivateAdminNavigation() {
    this.deactivateAdminNavigation.emit();
  }
}
