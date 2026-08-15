import { AG_GRID_LOCALE_HU } from "@ag-grid-community/locale";
import { Component, computed, inject, input } from "@angular/core";
import { injectQuery } from "@tanstack/angular-query-experimental";
import { AgGridAngular } from "ag-grid-angular";
import {
  type AutoSizeStrategy,
  type ColDef,
  type PaginationPanel,
} from "ag-grid-community";

import { formatDisplayDateWithoutDay } from "../../../mappers/dates";
import { zephyrGridTheme } from "../../../shared/ag-grid-theme";
import {
  INTEGRA_CATEGORIES,
  type IntegraCategorySlug,
} from "../../../types/integra";
import { IntegraDocumentLinkCellRendererComponent } from "../../components/ag-grid/integra-document-link-cell-renderer/integra-document-link-cell-renderer.component";
import { IntegraQueryService } from "../../services/integra.query.service";

@Component({
  selector: "app-integra",
  host: {
    class: "app-integra",
  },
  imports: [AgGridAngular],
  templateUrl: "./integra.component.html",
  styleUrl: "./integra.component.scss",
})
export class IntegraComponent {
  private readonly integraQueryService = inject(IntegraQueryService);

  readonly kategoria = input<IntegraCategorySlug>();

  private readonly category = computed(() => {
    const slug = this.kategoria();
    return slug ? INTEGRA_CATEGORIES[slug] : undefined;
  });

  private readonly integraDocumentsQuery = injectQuery(() =>
    this.integraQueryService.getIntegraDocuments(this.category()),
  );

  protected readonly documents = computed(
    () => this.integraDocumentsQuery.data()?.data ?? [],
  );

  protected readonly autoSizeStrategy: AutoSizeStrategy = {
    type: "fitGridWidth",
  };

  protected readonly theme = zephyrGridTheme;

  protected readonly integraColumnDefinitions: ColDef[] = [
    {
      autoHeight: true,
      headerName: "Dokumentum neve",
      field: "displayName",
      wrapText: true,
      cellRenderer: IntegraDocumentLinkCellRendererComponent,
    },
    {
      autoHeight: true,
      headerName: "Verzió",
      field: "version",
      wrapText: true,
    },
    {
      autoHeight: true,
      cellDataType: "date",
      headerName: "Érvényes",
      field: "publishedAt",
      valueFormatter: ({ value }) => formatDisplayDateWithoutDay(value as Date),
      wrapText: true,
    },
  ];

  protected readonly localeText = AG_GRID_LOCALE_HU;

  protected readonly paginationPanels: PaginationPanel[] = [
    {
      type: "pageSummary",
      suppressPageInput: true,
    },
    "rowSummary",
    { type: "pageSize", paginationPageSize: 10 },
  ];
}
