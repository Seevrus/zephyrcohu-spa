import { Component, computed, inject, input, output } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatAnchor, MatButton } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from "@angular/router";
import { filter, map } from "rxjs";

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
  private readonly router = inject(Router);

  readonly activateAdminNavigation = output<void>();
  readonly showAdminNavigation = input.required<boolean>();

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
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
