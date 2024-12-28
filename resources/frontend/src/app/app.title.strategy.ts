import { Injectable } from "@angular/core";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { Title } from "@angular/platform-browser";
import { type RouterStateSnapshot, TitleStrategy } from "@angular/router";

@Injectable({ providedIn: "root" })
export class AppTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  updateTitle(snapshot: RouterStateSnapshot): void {
    const routeTitle = this.buildTitle(snapshot);

    if (routeTitle !== undefined) {
      this.title.setTitle(`${routeTitle} - Zephyr Bt.`);
    }
  }
}
