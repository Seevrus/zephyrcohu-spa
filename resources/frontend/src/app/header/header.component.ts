import { NgOptimizedImage } from "@angular/common";
import { Component } from "@angular/core";
import { MatAnchor } from "@angular/material/button";

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
export class HeaderComponent {}
