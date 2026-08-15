import { AG_GRID_LOCALE_HU } from "@ag-grid-community/locale";
import { Component, computed, effect, inject, input } from "@angular/core";
import { MatProgressBar } from "@angular/material/progress-bar";
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
import { FormUnexpectedErrorComponent } from "../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { NoIntegraDocumentsAvailableComponent } from "../../components/no-integra-documents-available/no-integra-documents-available.component";
import { BreadcrumbService } from "../../services/breadcrumb.service";
import { IntegraQueryService } from "../../services/integra.query.service";
import { RegisteredOnlyComponent } from "../registered-only/registered-only.component";

@Component({
  selector: "app-integra",
  host: {
    class: "app-integra",
  },
  imports: [
    AgGridAngular,
    FormUnexpectedErrorComponent,
    MatProgressBar,
    NoIntegraDocumentsAvailableComponent,
    RegisteredOnlyComponent,
  ],
  templateUrl: "./integra.component.html",
  styleUrl: "./integra.component.scss",
})
export class IntegraComponent {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly integraQueryService = inject(IntegraQueryService);

  readonly kategoria = input<IntegraCategorySlug>();

  private readonly category = computed(() => {
    const slug = this.kategoria();
    return slug ? INTEGRA_CATEGORIES[slug] : undefined;
  });

  private readonly breadcrumbEffect = effect(() => {
    const slug = this.kategoria();
    if (slug) {
      this.breadcrumbService.setIntegraBreadcrumb(slug);
    }
  });

  private readonly integraDocumentsQuery = injectQuery(() =>
    this.integraQueryService.getIntegraDocuments(this.category()),
  );

  protected readonly documents = computed(
    () => this.integraDocumentsQuery.data()?.data ?? [],
  );

  /**
   * GENERIC_UNAUTHORIZED
   * || INTERNAL_SERVER_ERROR
   */
  protected readonly errorMessage = computed(
    () => this.integraDocumentsQuery.error()?.code,
  );

  protected readonly isEmpty = computed(
    () =>
      this.integraDocumentsQuery.isSuccess() && this.documents().length === 0,
  );

  protected readonly isLoading = computed(() =>
    this.integraDocumentsQuery.isPending(),
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
