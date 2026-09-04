import { Component, computed, inject } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatProgressBar } from "@angular/material/progress-bar";
import {
  injectMutation,
  injectQuery,
} from "@tanstack/angular-query-experimental";
import { AgGridAngular } from "ag-grid-angular";
import { type ColDef } from "ag-grid-community";

import { ZephyrHttpError } from "../../../../api/ZephyrHttpError";
import {
  adminGridDefaultColumnDefinition,
  adminGridLocaleText,
  adminGridModules,
  adminPaginationPanels,
} from "../../../../shared/admin-grid";
import { zephyrGridTheme } from "../../../../shared/ag-grid-theme";
import { type AdminTagResponse } from "../../../../types/admin-tags";
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
import {
  RenameDialogComponent,
  type RenameDialogData,
} from "../../../components/rename-dialog/rename-dialog.component";
import { AdminTagsQueryService } from "../../../services/admin-tags.query.service";

type RenameDialogRetryOptions = {
  initialValue: string;
  errorMessage: string;
};

@Component({
  selector: "app-admin-tags",
  host: {
    class: "app-admin-tags",
  },
  imports: [AgGridAngular, FormUnexpectedErrorComponent, MatProgressBar],
  templateUrl: "./admin-tags.component.html",
  styleUrl: "./admin-tags.component.scss",
})
export class AdminTagsComponent {
  private readonly adminTagsQueryService = inject(AdminTagsQueryService);
  private readonly dialog = inject(MatDialog);

  private readonly adminTagsQuery = injectQuery(() =>
    this.adminTagsQueryService.getAdminTags(),
  );

  protected readonly updateAdminTagMutation = injectMutation(() =>
    this.adminTagsQueryService.updateAdminTag(),
  );

  protected readonly deleteAdminTagMutation = injectMutation(() =>
    this.adminTagsQueryService.deleteAdminTag(),
  );

  protected readonly tags = computed(() => this.adminTagsQuery.data() ?? []);

  protected readonly isLoading = computed(() =>
    this.adminTagsQuery.isPending(),
  );

  protected readonly isEmpty = computed(
    () => this.adminTagsQuery.isSuccess() && this.tags().length === 0,
  );

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly errorMessage = computed(
    () => this.adminTagsQuery.error()?.code,
  );

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly deleteErrorMessage = computed(() =>
    this.deleteAdminTagMutation.isError() ? "INTERNAL_SERVER_ERROR" : undefined,
  );

  /**
   * INTERNAL_SERVER_ERROR
   *
   * A 422 (duplicate name) is handled by reopening the rename dialog with
   * an inline message instead, so it never reaches this banner.
   */
  protected readonly renameErrorMessage = computed(() =>
    this.updateAdminTagMutation.isError() &&
    this.updateAdminTagMutation.error()?.code !== "INVALID_REQUEST_DATA"
      ? "INTERNAL_SERVER_ERROR"
      : undefined,
  );

  protected readonly theme = zephyrGridTheme;
  protected readonly gridModules = adminGridModules;
  protected readonly defaultColDef = adminGridDefaultColumnDefinition;
  protected readonly paginationPanels = adminPaginationPanels;
  protected readonly localeText = adminGridLocaleText;

  protected readonly columnDefinitions: ColDef<AdminTagResponse>[] = [
    {
      headerName: "Címke",
      field: "name",
      flex: 2,
      wrapText: true,
      autoHeight: true,
    },
    {
      headerName: "Cikkek száma",
      field: "count",
      flex: 1,
      cellDataType: "number",
    },
    {
      headerName: "Kezelés",
      flex: 0,
      width: 110,
      resizable: false,
      cellRenderer: AdminActionsCellRendererComponent,
      cellRendererParams: {
        actions: ["edit", "delete"] satisfies readonly AdminRowAction[],
        rowLabel: (row: AdminTagResponse) => row.name,
        onAction: (action: AdminRowAction, row: AdminTagResponse) => {
          this.onRowAction(action, row);
        },
      } satisfies Partial<AdminActionParameters<AdminTagResponse>>,
    },
  ];

  private onRowAction(action: AdminRowAction, row: AdminTagResponse) {
    if (action === "edit") {
      this.onRenameTag(row);
    } else if (action === "delete") {
      this.onDeleteTag(row);
    }
  }

  private onRenameTag(
    row: AdminTagResponse,
    options?: RenameDialogRetryOptions,
  ) {
    const dialogRef = this.dialog.open<
      RenameDialogComponent,
      RenameDialogData,
      string
    >(RenameDialogComponent, {
      data: {
        title: "Címke átnevezése",
        label: "Címke",
        initialValue: options?.initialValue ?? row.name,
        errorMessage: options?.errorMessage,
      },
    });

    dialogRef.afterClosed().subscribe((name) => {
      if (name !== undefined) {
        this.saveTagName(row, name);
      }
    });
  }

  private saveTagName(row: AdminTagResponse, name: string) {
    this.updateAdminTagMutation.mutate(
      { id: row.id, request: { name } },
      {
        onError: (error) => {
          if (
            error instanceof ZephyrHttpError &&
            error.code === "INVALID_REQUEST_DATA"
          ) {
            this.onRenameTag(row, {
              initialValue: name,
              errorMessage: "Ilyen nevű címke már létezik.",
            });
          }
        },
      },
    );
  }

  private onDeleteTag(row: AdminTagResponse) {
    const dialogRef = this.dialog.open<
      ConfirmDialogComponent,
      ConfirmDialogData,
      boolean
    >(ConfirmDialogComponent, {
      data: {
        title: "Címke törlése",
        message: `Biztosan törölni szeretnéd a(z) „${row.name}” címkét?`,
        warning:
          row.count > 0
            ? `A címke ${row.count} cikkről kerül eltávolításra. A cikkek megmaradnak.`
            : undefined,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteAdminTagMutation.mutate(row.id);
      }
    });
  }
}
