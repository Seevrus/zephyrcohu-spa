import { Component, computed, inject } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatProgressBar } from "@angular/material/progress-bar";
import { Router, RouterLink } from "@angular/router";
import { injectQuery } from "@tanstack/angular-query-experimental";
import { AgGridAngular } from "ag-grid-angular";
import { type ColDef } from "ag-grid-community";

import { formatDisplayDateWithoutDay } from "../../../../mappers/dates";
import {
  adminGridDefaultColumnDefinition,
  adminGridLocaleText,
  adminGridModules,
  adminPaginationPanels,
} from "../../../../shared/admin-grid";
import { zephyrGridTheme } from "../../../../shared/ag-grid-theme";
import { type AdminNewsletterCollectionItem } from "../../../../types/admin-newsletters";
import {
  type AdminActionParameters,
  AdminActionsCellRendererComponent,
  type AdminRowAction,
} from "../../../components/ag-grid/admin-actions-cell-renderer/admin-actions-cell-renderer.component";
import { NewsletterProgressCellRendererComponent } from "../../../components/ag-grid/newsletter-progress-cell-renderer/newsletter-progress-cell-renderer.component";
import { FormUnexpectedErrorComponent } from "../../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { AdminNewslettersQueryService } from "../../../services/admin-newsletters.query.service";

@Component({
  selector: "app-admin-newsletters",
  host: {
    class: "app-admin-newsletters",
  },
  imports: [
    AgGridAngular,
    FormUnexpectedErrorComponent,
    MatButton,
    MatProgressBar,
    RouterLink,
  ],
  templateUrl: "./admin-newsletters.component.html",
  styleUrl: "./admin-newsletters.component.scss",
})
export class AdminNewslettersComponent {
  private readonly adminNewslettersQueryService = inject(
    AdminNewslettersQueryService,
  );
  private readonly router = inject(Router);

  private readonly adminNewslettersQuery = injectQuery(() =>
    this.adminNewslettersQueryService.getAdminNewsletters(),
  );

  protected readonly newsletters = computed(
    () => this.adminNewslettersQuery.data() ?? [],
  );

  protected readonly isLoading = computed(() =>
    this.adminNewslettersQuery.isPending(),
  );

  protected readonly isEmpty = computed(
    () =>
      this.adminNewslettersQuery.isSuccess() && this.newsletters().length === 0,
  );

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly errorMessage = computed(
    () => this.adminNewslettersQuery.error()?.code,
  );

  protected readonly theme = zephyrGridTheme;
  protected readonly gridModules = adminGridModules;
  protected readonly defaultColDef = adminGridDefaultColumnDefinition;
  protected readonly paginationPanels = adminPaginationPanels;
  protected readonly localeText = adminGridLocaleText;

  protected readonly columnDefinitions: ColDef<AdminNewsletterCollectionItem>[] =
    [
      {
        headerName: "Dátum",
        field: "createdAt",
        flex: 1,
        cellDataType: "date",
        wrapText: true,
        autoHeight: true,
        valueFormatter: ({ value }) =>
          value ? formatDisplayDateWithoutDay(value as Date) : "",
      },
      {
        headerName: "Tárgy",
        field: "subject",
        flex: 2,
        wrapText: true,
        autoHeight: true,
      },
      {
        headerName: "Kiküldés",
        colId: "progress",
        flex: 1,
        sortable: false,
        autoHeight: true,
        cellRenderer: NewsletterProgressCellRendererComponent,
      },
      {
        headerName: "Kezelés",
        flex: 0,
        width: 110,
        resizable: false,
        cellRenderer: AdminActionsCellRendererComponent,
        cellRendererParams: {
          actions: ["info"] satisfies readonly AdminRowAction[],
          rowLabel: (row: AdminNewsletterCollectionItem) => row.subject,
          onAction: (
            _action: AdminRowAction,
            row: AdminNewsletterCollectionItem,
          ) => {
            this.router.navigate(["/admin/hirlevel", row.id]);
          },
        } satisfies Partial<
          AdminActionParameters<AdminNewsletterCollectionItem>
        >,
      },
    ];
}
