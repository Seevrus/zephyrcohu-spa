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

import {
  adminGridDefaultColumnDefinition,
  adminGridLocaleText,
  adminGridModules,
  adminPaginationPanels,
} from "../../../../shared/admin-grid";
import { zephyrGridTheme } from "../../../../shared/ag-grid-theme";
import {
  type AdminLinkCategory,
  type AdminLinkResponse,
} from "../../../../types/admin-links";
import {
  type AdminActionParameters,
  AdminActionsCellRendererComponent,
  type AdminRowAction,
} from "../../../components/ag-grid/admin-actions-cell-renderer/admin-actions-cell-renderer.component";
import { LinkUrlCellRendererComponent } from "../../../components/ag-grid/link-url-cell-renderer/link-url-cell-renderer.component";
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
} from "../../../components/confirm-dialog/confirm-dialog.component";
import { FormUnexpectedErrorComponent } from "../../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { AdminLinksQueryService } from "../../../services/admin-links.query.service";

const UNCATEGORISED_NAME = "Egyéb";

@Component({
  selector: "app-admin-links",
  host: {
    class: "app-admin-links",
  },
  imports: [
    AgGridAngular,
    FormUnexpectedErrorComponent,
    MatButton,
    MatProgressBar,
    RouterLink,
  ],
  templateUrl: "./admin-links.component.html",
  styleUrl: "./admin-links.component.scss",
})
export class AdminLinksComponent {
  private readonly adminLinksQueryService = inject(AdminLinksQueryService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  private readonly adminLinksQuery = injectQuery(() =>
    this.adminLinksQueryService.getAdminLinks(),
  );

  protected readonly deleteAdminLinkMutation = injectMutation(() =>
    this.adminLinksQueryService.deleteAdminLink(),
  );

  protected readonly links = computed(() => this.adminLinksQuery.data() ?? []);

  protected readonly isLoading = computed(() =>
    this.adminLinksQuery.isPending(),
  );

  protected readonly isEmpty = computed(
    () => this.adminLinksQuery.isSuccess() && this.links().length === 0,
  );

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly errorMessage = computed(
    () => this.adminLinksQuery.error()?.code,
  );

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly deleteErrorMessage = computed(() =>
    this.deleteAdminLinkMutation.isError()
      ? "INTERNAL_SERVER_ERROR"
      : undefined,
  );

  protected readonly theme = zephyrGridTheme;
  protected readonly gridModules = adminGridModules;
  protected readonly defaultColDef = adminGridDefaultColumnDefinition;
  protected readonly paginationPanels = adminPaginationPanels;
  protected readonly localeText = adminGridLocaleText;

  protected readonly columnDefinitions: ColDef<AdminLinkResponse>[] = [
    {
      headerName: "Kategória",
      field: "category",
      flex: 1,
      wrapText: true,
      autoHeight: true,
      valueFormatter: ({ value }) =>
        (value as AdminLinkCategory)?.name ?? UNCATEGORISED_NAME,
    },
    {
      headerName: "Hivatkozás szövege",
      field: "title",
      flex: 2,
      wrapText: true,
      autoHeight: true,
    },
    {
      headerName: "Hivatkozás URI címe",
      field: "url",
      flex: 2,
      wrapText: true,
      autoHeight: true,
      cellRenderer: LinkUrlCellRendererComponent,
    },
    {
      headerName: "Kezelés",
      flex: 0,
      width: 110,
      resizable: false,
      cellRenderer: AdminActionsCellRendererComponent,
      cellRendererParams: {
        actions: ["edit", "delete"] satisfies readonly AdminRowAction[],
        rowLabel: (row: AdminLinkResponse) => row.title,
        onAction: (action: AdminRowAction, row: AdminLinkResponse) => {
          this.onRowAction(action, row);
        },
      } satisfies Partial<AdminActionParameters<AdminLinkResponse>>,
    },
  ];

  private onRowAction(action: AdminRowAction, row: AdminLinkResponse) {
    if (action === "edit") {
      this.router.navigate(["/admin/linkek", row.id]);
    } else if (action === "delete") {
      this.onDeleteLink(row);
    }
  }

  private onDeleteLink(row: AdminLinkResponse) {
    const dialogRef = this.dialog.open<
      ConfirmDialogComponent,
      ConfirmDialogData,
      boolean
    >(ConfirmDialogComponent, {
      data: {
        title: "Link törlése",
        message: `Biztosan törölni szeretnéd a(z) „${row.title}” linket?`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteAdminLinkMutation.mutate(row.id);
      }
    });
  }
}
