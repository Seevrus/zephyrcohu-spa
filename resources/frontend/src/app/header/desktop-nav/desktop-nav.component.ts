import { Component, computed, input, output } from "@angular/core";
import { MatAnchor, MatButton } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { RouterLink, RouterLinkActive } from "@angular/router";

@Component({
  selector: "app-desktop-nav",
  imports: [
    MatAnchor,
    MatButton,
    MatIconModule,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: "./desktop-nav.component.html",
  styleUrl: "./desktop-nav.component.scss",
})
export class DesktopNavComponent {
  readonly activateAdminNavigation = output<void>();
  readonly currentUrl = input.required<string>();
  readonly showAdminNavigation = input.required<boolean>();

  protected readonly isAdminActive = computed(() =>
    this.currentUrl().startsWith("/admin"),
  );

  protected readonly isIntegraActive = computed(() =>
    this.currentUrl().startsWith("/integra"),
  );

  protected readonly isKbActive = computed(() =>
    this.currentUrl().startsWith("/tudasbazis"),
  );

  protected onActivateAdminNavigation() {
    this.activateAdminNavigation.emit();
  }
}
