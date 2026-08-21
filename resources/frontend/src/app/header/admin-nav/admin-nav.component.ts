import { Component, computed, input, output } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { RouterLink, RouterLinkActive } from "@angular/router";

@Component({
  selector: "app-admin-nav",
  imports: [
    MatButton,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: "./admin-nav.component.html",
  styleUrl: "./admin-nav.component.scss",
})
export class AdminNavComponent {
  readonly currentUrl = input.required<string>();
  readonly deactivateAdminNavigation = output<void>();

  protected readonly isAdminActive = computed(() =>
    this.currentUrl().startsWith("/admin"),
  );

  protected readonly isIntegraActive = computed(() =>
    this.currentUrl().startsWith("/admin/integra"),
  );

  protected readonly isKbActive = computed(() =>
    this.currentUrl().startsWith("/admin/tudasbazis"),
  );

  protected readonly isLinksActive = computed(() =>
    this.currentUrl().startsWith("/admin/linkek"),
  );

  protected readonly isNewsActive = computed(() =>
    this.currentUrl().startsWith("/admin/hirek"),
  );

  protected readonly isNewsLettersActive = computed(() =>
    this.currentUrl().startsWith("/admin/hirek-iratkozok"),
  );

  protected readonly isOffersActive = computed(() =>
    this.currentUrl().startsWith("/admin/ajanlatok"),
  );

  protected onDeactivateAdminNavigation() {
    this.deactivateAdminNavigation.emit();
  }
}
