import { Component, input, output } from "@angular/core";
import {
  MatPaginator,
  MatPaginatorIntl,
  type PageEvent,
} from "@angular/material/paginator";

import { PaginatorHuService } from "./paginator-hu.service";

@Component({
  selector: "app-paginator-hu",
  host: {
    class: "app-paginator-hu",
  },
  imports: [MatPaginator],
  providers: [{ provide: MatPaginatorIntl, useClass: PaginatorHuService }],
  templateUrl: "./paginator-hu.component.html",
  styleUrl: "./paginator-hu.component.scss",
})
export class PaginatorHuComponent {
  currentPage = input.required<number>();
  disabled = input.required<boolean>();
  total = input.required<number>();

  pageChanged = output<PageEvent>();
}
