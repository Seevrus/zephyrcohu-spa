import {
  type AfterViewInit,
  Component,
  type QueryList,
  ViewChildren,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule, MatMenuTrigger } from "@angular/material/menu";

@Component({
  selector: "app-mobile-nav",
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: "./mobile-nav.component.html",
  styleUrl: "./mobile-nav.component.scss",
})
export class MobileNavComponent implements AfterViewInit {
  @ViewChildren(MatMenuTrigger)
  private triggerList: QueryList<MatMenuTrigger> | undefined;

  private integraTrigger: MatMenuTrigger | undefined;
  private kbTrigger: MatMenuTrigger | undefined;

  ngAfterViewInit(): void {
    const triggers: MatMenuTrigger[] = this.triggerList?.toArray() ?? [];

    this.integraTrigger = triggers[1];
    this.kbTrigger = triggers[2];
  }

  handleIntegraMenuClick(): void {
    this.kbTrigger?.closeMenu();
  }

  handleKbMenuClick(): void {
    this.integraTrigger?.closeMenu();
  }
}
