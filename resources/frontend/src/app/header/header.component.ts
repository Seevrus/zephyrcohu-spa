import { NgOptimizedImage } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { MatAnchor, MatButton } from "@angular/material/button";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { injectQuery } from "@tanstack/angular-query-experimental";

import { BreadcrumbService } from "../services/breadcrumb.service";
import { UsersQueryService } from "../services/users.query.service";
import { DesktopNavComponent } from "./desktop-nav/desktop-nav.component";
import { MobileNavComponent } from "./mobile-nav/mobile-nav.component";

@Component({
  selector: "app-header",
  imports: [
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
  private readonly usersQueryService = inject(UsersQueryService);

  private readonly sessionQuery = injectQuery(() =>
    this.usersQueryService.session(),
  );

  readonly breadcrumb = this.breadcrumbService.breadcrumb;
  readonly email = signal(this.sessionQuery.data()?.email);
  readonly showLogin = computed(
    () =>
      !this.sessionQuery.isPending() &&
      (this.sessionQuery.isError() || !this.sessionQuery.data()),
  );
  readonly showProfile = computed(
    () => !this.sessionQuery.isPending() && !!this.sessionQuery.data(),
  );

  onLogout() {
    console.log("Kijelentkezés...");
  }
}
