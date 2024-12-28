import { NgOptimizedImage } from "@angular/common";
import { Component } from "@angular/core";
import { MatButton } from "@angular/material/button";

import { DesktopNavComponent } from "./desktop-nav/desktop-nav.component";
import { MobileNavComponent } from "./mobile-nav/mobile-nav.component";

@Component({
  selector: "app-header",
  imports: [
    DesktopNavComponent,
    MatButton,
    MobileNavComponent,
    NgOptimizedImage,
  ],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent {}
