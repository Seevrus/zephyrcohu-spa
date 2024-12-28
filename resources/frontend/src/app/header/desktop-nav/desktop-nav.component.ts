import { Component } from "@angular/core";
import { MatAnchor, MatButton } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";

@Component({
  selector: "app-desktop-nav",
  imports: [
    MatAnchor,
    MatButton,
    MatIconModule,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
  ],
  templateUrl: "./desktop-nav.component.html",
  styleUrl: "./desktop-nav.component.scss",
})
export class DesktopNavComponent {}
