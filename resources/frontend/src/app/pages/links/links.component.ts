import { Component, computed, inject } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import {
  MatDivider,
  MatListItem,
  MatListItemIcon,
  MatListItemTitle,
  MatNavList,
} from "@angular/material/list";
import { MatProgressBar } from "@angular/material/progress-bar";
import { injectQuery } from "@tanstack/angular-query-experimental";

import { type LinkResponse } from "../../../types/links";
import { FormUnexpectedErrorComponent } from "../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { LinksQueryService } from "../../services/links.query.service";

type LinksByCategory = Record<string, LinkResponse[]>;

@Component({
  selector: "app-links",
  host: {
    class: "app-links",
  },
  imports: [
    FormUnexpectedErrorComponent,
    MatDivider,
    MatIcon,
    MatListItem,
    MatListItemIcon,
    MatListItemTitle,
    MatNavList,
    MatProgressBar,
  ],
  templateUrl: "./links.component.html",
  styleUrl: "./links.component.scss",
})
export class LinksComponent {
  private readonly linksQueryService = inject(LinksQueryService);

  private readonly linksQuery = injectQuery(() =>
    this.linksQueryService.getLinks(),
  );

  protected readonly isError = computed(() => this.linksQuery.isError());
  protected readonly isLoading = computed(() => this.linksQuery.isPending());

  protected readonly links = computed(() => this.linksQuery.data() ?? []);

  protected readonly isEmpty = computed(
    () => this.linksQuery.isSuccess() && this.links().length === 0,
  );

  protected readonly linkCategories = computed(() =>
    Object.keys(this.linksByCategory()),
  );

  protected readonly linksByCategory = computed(() =>
    this.links().reduce<LinksByCategory>((linksByCategory, link) => {
      if (linksByCategory[link.category] === undefined) {
        linksByCategory[link.category] = [link];
      } else {
        linksByCategory[link.category].push(link);
      }

      return linksByCategory;
    }, {}),
  );
}
