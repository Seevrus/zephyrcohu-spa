import { Component, computed, inject } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatProgressBar } from "@angular/material/progress-bar";
import { RouterLink } from "@angular/router";
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
import { type AdminLinkCategoryResponse } from "../../../../types/admin-links";
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
import { AdminLinksQueryService } from "../../../services/admin-links.query.service";

/**
 * Kept in sync with `Link::UNCATEGORISED_NAME` (BE) — the reserved category
 * name that always means "no category" and can never be renamed to.
 */
const UNCATEGORISED_NAME = "Egyéb";

type RenameDialogRetryOptions = {
  initialValue: string;
  errorMessage: string;
};

@Component({
  selector: "app-admin-link-categories",
  host: {
    class: "app-admin-link-categories",
  },
  imports: [
    AgGridAngular,
    FormUnexpectedErrorComponent,
    MatButton,
    MatProgressBar,
    RouterLink,
  ],
  templateUrl: "./admin-link-categories.component.html",
  styleUrl: "./admin-link-categories.component.scss",
})
export class AdminLinkCategoriesComponent {
  private readonly adminLinksQueryService = inject(AdminLinksQueryService);
  private readonly dialog = inject(MatDialog);

  private readonly adminLinkCategoriesQuery = injectQuery(() =>
    this.adminLinksQueryService.getAdminLinkCategories(),
  );

  protected readonly updateAdminLinkCategoryMutation = injectMutation(() =>
    this.adminLinksQueryService.updateAdminLinkCategory(),
  );

  protected readonly deleteAdminLinkCategoryMutation = injectMutation(() =>
    this.adminLinksQueryService.deleteAdminLinkCategory(),
  );

  protected readonly categories = computed(
    () => this.adminLinkCategoriesQuery.data() ?? [],
  );

  protected readonly isLoading = computed(() =>
    this.adminLinkCategoriesQuery.isPending(),
  );

  protected readonly isEmpty = computed(
    () =>
      this.adminLinkCategoriesQuery.isSuccess() &&
      this.categories().length === 0,
  );

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly errorMessage = computed(
    () => this.adminLinkCategoriesQuery.error()?.code,
  );

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly deleteErrorMessage = computed(() =>
    this.deleteAdminLinkCategoryMutation.isError()
      ? "INTERNAL_SERVER_ERROR"
      : undefined,
  );

  /**
   * INTERNAL_SERVER_ERROR
   *
   * A 422 (duplicate or reserved name) is handled by reopening the rename
   * dialog with an inline message instead, so it never reaches this banner.
   */
  protected readonly renameErrorMessage = computed(() =>
    this.updateAdminLinkCategoryMutation.isError() &&
    this.updateAdminLinkCategoryMutation.error()?.code !==
      "INVALID_REQUEST_DATA"
      ? "INTERNAL_SERVER_ERROR"
      : undefined,
  );

  protected readonly theme = zephyrGridTheme;
  protected readonly gridModules = adminGridModules;
  protected readonly defaultColDef = adminGridDefaultColumnDefinition;
  protected readonly paginationPanels = adminPaginationPanels;
  protected readonly localeText = adminGridLocaleText;

  protected readonly columnDefinitions: ColDef<AdminLinkCategoryResponse>[] = [
    {
      headerName: "Kategória",
      field: "name",
      flex: 2,
      wrapText: true,
      autoHeight: true,
    },
    {
      headerName: "Linkek száma",
      field: "linkCount",
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
        rowLabel: (row: AdminLinkCategoryResponse) => row.name,
        onAction: (action: AdminRowAction, row: AdminLinkCategoryResponse) => {
          this.onRowAction(action, row);
        },
      } satisfies Partial<AdminActionParameters<AdminLinkCategoryResponse>>,
    },
  ];

  private onRowAction(action: AdminRowAction, row: AdminLinkCategoryResponse) {
    if (action === "edit") {
      this.onRenameCategory(row);
    } else if (action === "delete") {
      this.onDeleteCategory(row);
    }
  }

  private onRenameCategory(
    row: AdminLinkCategoryResponse,
    options?: RenameDialogRetryOptions,
  ) {
    const dialogRef = this.dialog.open<
      RenameDialogComponent,
      RenameDialogData,
      string
    >(RenameDialogComponent, {
      data: {
        title: "Kategória átnevezése",
        label: "Kategória",
        initialValue: options?.initialValue ?? row.name,
        errorMessage: options?.errorMessage,
      },
    });

    dialogRef.afterClosed().subscribe((name) => {
      if (name !== undefined) {
        this.saveCategoryName(row, name);
      }
    });
  }

  private saveCategoryName(row: AdminLinkCategoryResponse, name: string) {
    this.updateAdminLinkCategoryMutation.mutate(
      { id: row.id, request: { name } },
      {
        onError: (error) => {
          if (
            error instanceof ZephyrHttpError &&
            error.code === "INVALID_REQUEST_DATA"
          ) {
            this.onRenameCategory(row, {
              initialValue: name,
              errorMessage:
                name.trim() === UNCATEGORISED_NAME
                  ? "Ez a kategórianév foglalt."
                  : "Ilyen nevű kategória már létezik.",
            });
          }
        },
      },
    );
  }

  private onDeleteCategory(row: AdminLinkCategoryResponse) {
    const dialogRef = this.dialog.open<
      ConfirmDialogComponent,
      ConfirmDialogData,
      boolean
    >(ConfirmDialogComponent, {
      data: {
        title: "Kategória törlése",
        message: `Biztosan törölni szeretnéd a(z) „${row.name}” kategóriát?`,
        warning:
          row.linkCount > 0
            ? `A kategóriához tartozó ${row.linkCount} link megmarad, és az „Egyéb” csoportba kerül.`
            : undefined,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteAdminLinkCategoryMutation.mutate(row.id);
      }
    });
  }
}
