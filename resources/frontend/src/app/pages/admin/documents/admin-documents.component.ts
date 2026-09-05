import { Component, computed, inject } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatProgressBar } from "@angular/material/progress-bar";
import { Router, RouterLink } from "@angular/router";
import {
  injectMutation,
  injectQuery,
} from "@tanstack/angular-query-experimental";
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
import { type AdminDocumentItem } from "../../../../types/admin-documents";
import {
  INTEGRA_CATEGORY_LABELS,
  type IntegraCategory,
} from "../../../../types/integra";
import {
  type AdminActionParameters,
  AdminActionsCellRendererComponent,
  type AdminRowAction,
} from "../../../components/ag-grid/admin-actions-cell-renderer/admin-actions-cell-renderer.component";
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
} from "../../../components/confirm-dialog/confirm-dialog.component";
import { FormUnexpectedErrorComponent } from "../../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { AdminDocumentsQueryService } from "../../../services/admin-documents.query.service";

@Component({
  selector: "app-admin-documents",
  host: {
    class: "app-admin-documents",
  },
  imports: [
    AgGridAngular,
    FormUnexpectedErrorComponent,
    MatButton,
    MatProgressBar,
    RouterLink,
  ],
  templateUrl: "./admin-documents.component.html",
  styleUrl: "./admin-documents.component.scss",
})
export class AdminDocumentsComponent {
  private readonly adminDocumentsQueryService = inject(
    AdminDocumentsQueryService,
  );
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  private readonly adminDocumentsQuery = injectQuery(() =>
    this.adminDocumentsQueryService.getAdminDocuments(),
  );

  protected readonly deleteAdminDocumentMutation = injectMutation(() =>
    this.adminDocumentsQueryService.deleteAdminDocument(),
  );

  protected readonly documents = computed(
    () => this.adminDocumentsQuery.data() ?? [],
  );

  protected readonly isLoading = computed(() =>
    this.adminDocumentsQuery.isPending(),
  );

  protected readonly isEmpty = computed(
    () => this.adminDocumentsQuery.isSuccess() && this.documents().length === 0,
  );

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly errorMessage = computed(
    () => this.adminDocumentsQuery.error()?.code,
  );

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly deleteErrorMessage = computed(() =>
    this.deleteAdminDocumentMutation.isError()
      ? "INTERNAL_SERVER_ERROR"
      : undefined,
  );

  protected readonly theme = zephyrGridTheme;
  protected readonly gridModules = adminGridModules;
  protected readonly defaultColDef = adminGridDefaultColumnDefinition;
  protected readonly paginationPanels = adminPaginationPanels;
  protected readonly localeText = adminGridLocaleText;

  protected readonly columnDefinitions: ColDef<AdminDocumentItem>[] = [
    {
      headerName: "Kategória",
      field: "category",
      flex: 1,
      wrapText: true,
      autoHeight: true,
      valueFormatter: ({ value }) =>
        INTEGRA_CATEGORY_LABELS[value as IntegraCategory],
    },
    {
      headerName: "Név",
      field: "displayName",
      flex: 2,
      wrapText: true,
      autoHeight: true,
    },
    {
      headerName: "Fájl",
      field: "fileName",
      flex: 2,
      wrapText: true,
      autoHeight: true,
    },
    {
      headerName: "Verzió",
      field: "version",
      flex: 1,
    },
    {
      headerName: "Közzététel dátuma",
      field: "publishedAt",
      flex: 1,
      cellDataType: "date",
      wrapText: true,
      autoHeight: true,
      valueFormatter: ({ value }) => formatDisplayDateWithoutDay(value as Date),
      cellClass: ({ data }) => {
        const cellClass = [this.defaultColDef.cellClass as string];

        const isUnpublished = data && data.publishedAt > new Date();
        if (isUnpublished) {
          cellClass.push("admin-grid-unpublished");
        }

        return cellClass;
      },
    },
    {
      headerName: "Kezelés",
      flex: 0,
      width: 110,
      resizable: false,
      cellRenderer: AdminActionsCellRendererComponent,
      cellRendererParams: {
        actions: ["edit", "delete"] satisfies readonly AdminRowAction[],
        rowLabel: (row: AdminDocumentItem) => row.displayName,
        onAction: (action: AdminRowAction, row: AdminDocumentItem) => {
          this.onRowAction(action, row);
        },
      } satisfies Partial<AdminActionParameters<AdminDocumentItem>>,
    },
  ];

  private onRowAction(action: AdminRowAction, row: AdminDocumentItem) {
    if (action === "edit") {
      this.router.navigate(["/admin/integra", row.id]);
    } else if (action === "delete") {
      this.onDeleteDocument(row);
    }
  }

  private onDeleteDocument(row: AdminDocumentItem) {
    const dialogRef = this.dialog.open<
      ConfirmDialogComponent,
      ConfirmDialogData,
      boolean
    >(ConfirmDialogComponent, {
      data: {
        title: "Fájl törlése",
        message: `Biztosan törölni szeretnéd a(z) „${row.displayName}” fájlt?`,
        warning: "A feltöltött fájl is véglegesen törlődik.",
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteAdminDocumentMutation.mutate(row.id);
      }
    });
  }
}
