import { Component, computed, inject } from "@angular/core";
import { MatLine } from "@angular/material/core";
import { MatIcon } from "@angular/material/icon";
import {
  MatListItem,
  MatListItemIcon,
  MatListSubheaderCssMatStyler,
  MatNavList,
} from "@angular/material/list";
import { RouterLink } from "@angular/router";
import { injectQuery } from "@tanstack/angular-query-experimental";

import { UsersQueryService } from "../../services/users.query.service";

@Component({
  selector: "app-sitemap",
  host: {
    class: "app-sitemap",
  },
  imports: [
    MatIcon,
    MatLine,
    MatListItem,
    MatListItemIcon,
    MatListSubheaderCssMatStyler,
    MatNavList,
    RouterLink,
  ],
  templateUrl: "./sitemap.component.html",
  styleUrl: "./sitemap.component.scss",
})
export class SitemapComponent {
  private readonly usersQueryService = inject(UsersQueryService);

  private readonly sessionQuery = injectQuery(() =>
    this.usersQueryService.session(),
  );

  protected readonly showLogin = computed(
    () =>
      !this.sessionQuery.isPending() &&
      (this.sessionQuery.isError() || !this.sessionQuery.data()),
  );
  protected readonly showProfile = computed(
    () => !this.sessionQuery.isPending() && !!this.sessionQuery.data(),
  );
}
