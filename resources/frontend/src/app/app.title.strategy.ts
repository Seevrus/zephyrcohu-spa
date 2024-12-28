/* eslint-disable @typescript-eslint/consistent-type-imports */
import { Injectable } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { type RouterStateSnapshot, TitleStrategy } from "@angular/router";

import { BreadcrumbService } from "./breadcrumb.service";

@Injectable({ providedIn: "root" })
export class AppTitleStrategy extends TitleStrategy {
  constructor(
    private readonly breadCrumbService: BreadcrumbService,
    private readonly title: Title,
  ) {
    super();
  }

  updateTitle(snapshot: RouterStateSnapshot): void {
    const routeTitle = this.buildTitle(snapshot);

    if (routeTitle !== undefined) {
      this.title.setTitle(`${routeTitle} - Zephyr Bt.`);
      this.breadCrumbService.setBreadCrumb(routeTitle);
    }
  }
}
