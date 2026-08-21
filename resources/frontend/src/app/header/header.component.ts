import { NgOptimizedImage } from "@angular/common";
import { Component, computed, inject, linkedSignal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatAnchor, MatButton } from "@angular/material/button";
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from "@angular/router";
import {
  injectMutation,
  injectQuery,
} from "@tanstack/angular-query-experimental";
import { filter, map } from "rxjs";

import { BreadcrumbService } from "../services/breadcrumb.service";
import { UsersQueryService } from "../services/users.query.service";
import { AdminNavComponent } from "./admin-nav/admin-nav.component";
import { DesktopNavComponent } from "./desktop-nav/desktop-nav.component";
import { MobileNavComponent } from "./mobile-nav/mobile-nav.component";

@Component({
  selector: "app-header",
  imports: [
    AdminNavComponent,
    DesktopNavComponent,
    MatAnchor,
    MatButton,
    MobileNavComponent,
    NgOptimizedImage,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly router = inject(Router);
  private readonly usersQueryService = inject(UsersQueryService);

  private readonly logoutMutation = injectMutation(() =>
    this.usersQueryService.logout(),
  );

  private readonly sessionQuery = injectQuery(() =>
    this.usersQueryService.session(),
  );

  protected readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly breadcrumb = this.breadcrumbService.breadcrumb;
  protected readonly email = computed(() => this.sessionQuery.data()?.email);
  protected readonly isAdmin = computed(
    () => this.sessionQuery.data()?.isAdmin ?? false,
  );
  protected readonly showAdminNavigationBar = linkedSignal(() =>
    this.currentUrl().startsWith("/admin"),
  );
  protected readonly showLogin = computed(
    () =>
      !this.sessionQuery.isPending() &&
      (this.sessionQuery.isError() || !this.sessionQuery.data()),
  );
  protected readonly showProfile = computed(
    () => !this.sessionQuery.isPending() && !!this.sessionQuery.data(),
  );

  protected async onLogout() {
    await this.logoutMutation.mutateAsync();
    this.router.navigate(["/"]);
  }

  protected onToggleAdminNavigation() {
    this.showAdminNavigationBar.update((value) => !value);
  }
}
