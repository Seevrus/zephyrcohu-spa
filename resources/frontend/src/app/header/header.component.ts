import { NgOptimizedImage } from "@angular/common";
import { Component } from "@angular/core";

import { MobileNavComponent } from "./mobile-nav/mobile-nav.component";

@Component({
  selector: "app-header",
  imports: [NgOptimizedImage, MobileNavComponent],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent {}
