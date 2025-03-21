import { NgOptimizedImage } from "@angular/common";
import { Component, inject, type OnDestroy, type OnInit } from "@angular/core";
import { MatAnchor } from "@angular/material/button";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { injectQuery } from "@tanstack/angular-query-experimental";
import { type Subscription } from "rxjs";

import { BreadcrumbService } from "../services/breadcrumb.service";
import { UsersQueryService } from "../services/users.query.service";
import { DesktopNavComponent } from "./desktop-nav/desktop-nav.component";
import { MobileNavComponent } from "./mobile-nav/mobile-nav.component";

@Component({
  selector: "app-header",
  imports: [
    DesktopNavComponent,
    MatAnchor,
    MobileNavComponent,
    NgOptimizedImage,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly usersQueryService = inject(UsersQueryService);

  breadcrumb: string | undefined;
  private breadcrumbSubscription: Subscription | undefined;

  ngOnInit() {
    this.breadcrumbSubscription =
      this.breadcrumbService.breadcrumbChanged.subscribe((breadcrumb) => {
        this.breadcrumb = breadcrumb;
      });
  }

  ngOnDestroy() {
    this.breadcrumbSubscription?.unsubscribe();
  }

  private readonly sessionQuery = injectQuery(() =>
    this.usersQueryService.session(),
  );

  readonly showLogin = this.sessionQuery.isError() || !this.sessionQuery.data();
}
