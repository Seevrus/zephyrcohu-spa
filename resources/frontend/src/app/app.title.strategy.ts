import { inject, Injectable } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { type RouterStateSnapshot, TitleStrategy } from "@angular/router";

import { BreadcrumbService } from "./services/breadcrumb.service";

@Injectable({ providedIn: "root" })
export class AppTitleStrategy extends TitleStrategy {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly title = inject(Title);

  updateTitle(snapshot: RouterStateSnapshot): void {
    const routeTitle = this.buildTitle(snapshot);

    if (routeTitle !== undefined) {
      this.title.setTitle(`${routeTitle} - Zephyr Bt.`);
      this.breadcrumbService.setBreadcrumb(routeTitle);
    }
  }
}
