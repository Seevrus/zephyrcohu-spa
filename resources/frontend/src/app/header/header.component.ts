/* eslint-disable @typescript-eslint/consistent-type-imports */
import { NgOptimizedImage } from "@angular/common";
import { Component, OnDestroy, type OnInit } from "@angular/core";
import { MatAnchor } from "@angular/material/button";
import { Subscription } from "rxjs";

import { BreadcrumbService } from "../services/breadcrumb.service";
import { DesktopNavComponent } from "./desktop-nav/desktop-nav.component";
import { MobileNavComponent } from "./mobile-nav/mobile-nav.component";

@Component({
  selector: "app-header",
  imports: [
    DesktopNavComponent,
    MatAnchor,
    MobileNavComponent,
    NgOptimizedImage,
  ],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent implements OnInit, OnDestroy {
  breadcrumb: string | undefined;
  breadcrumbSubscription: Subscription | undefined;

  constructor(private readonly breadcrumbService: BreadcrumbService) {}

  ngOnInit() {
    this.breadcrumbSubscription =
      this.breadcrumbService.breadcrumbChanged.subscribe(
        (breadcrumb) => (this.breadcrumb = breadcrumb),
      );
  }

  ngOnDestroy() {
    this.breadcrumbSubscription?.unsubscribe();
  }
}
