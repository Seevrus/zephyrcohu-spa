import { Injectable } from "@angular/core";
import { type MatPaginatorIntl } from "@angular/material/paginator";
import { Subject } from "rxjs";

@Injectable()
export class PaginatorHuService implements MatPaginatorIntl {
  changes = new Subject<void>();

  firstPageLabel = "Első oldal";
  itemsPerPageLabel = "Oldalméret:";
  nextPageLabel = "Következő";
  previousPageLabel = "Előző";
  lastPageLabel = "Utolsó oldal";

  getRangeLabel(page: number, pageSize: number, length: number) {
    const numberOfPages = Math.ceil(length / pageSize);
    return `${page + 1} / ${numberOfPages} oldal`;
  }
}
