import { Component, computed, inject, signal } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
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
import { type AdminNewsItem } from "../../../../types/admin-news";
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
import { AdminNewsQueryService } from "../../../services/admin-news.query.service";

@Component({
  selector: "app-admin-news",
  host: {
    class: "app-admin-news",
  },
  imports: [
    AgGridAngular,
    FormUnexpectedErrorComponent,
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    MatProgressBar,
    RouterLink,
  ],
  templateUrl: "./admin-news.component.html",
  styleUrl: "./admin-news.component.scss",
})
export class AdminNewsComponent {
  private readonly adminNewsQueryService = inject(AdminNewsQueryService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  private readonly adminNewsQuery = injectQuery(() =>
    this.adminNewsQueryService.getAdminNews(),
  );

  protected readonly deleteAdminNewsMutation = injectMutation(() =>
    this.adminNewsQueryService.deleteAdminNews(),
  );

  protected readonly searchTerm = signal("");

  private readonly news = computed(() => this.adminNewsQuery.data() ?? []);

  protected readonly filteredNews = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.news();
    }

    return this.news().filter((newsItem) =>
      newsItem.title.toLowerCase().includes(term),
    );
  });

  protected readonly isLoading = computed(() =>
    this.adminNewsQuery.isPending(),
  );

  protected readonly isEmpty = computed(
    () => this.adminNewsQuery.isSuccess() && this.news().length === 0,
  );

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly errorMessage = computed(
    () => this.adminNewsQuery.error()?.code,
  );

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly deleteErrorMessage = computed(() =>
    this.deleteAdminNewsMutation.isError()
      ? "INTERNAL_SERVER_ERROR"
      : undefined,
  );

  protected readonly theme = zephyrGridTheme;
  protected readonly gridModules = adminGridModules;
  protected readonly defaultColDef = adminGridDefaultColumnDefinition;
  protected readonly paginationPanels = adminPaginationPanels;
  protected readonly localeText = adminGridLocaleText;

  protected readonly columnDefinitions: ColDef<AdminNewsItem>[] = [
    {
      headerName: "Kinek szól",
      field: "audience",
      flex: 1,
      wrapText: true,
      autoHeight: true,
      valueFormatter: ({ value }) =>
        value === "A" ? "Regisztrált felhasználók" : "Mindenki",
    },
    {
      headerName: "Cím",
      field: "title",
      flex: 2,
      wrapText: true,
      autoHeight: true,
    },
    {
      headerName: "Közzététel dátuma",
      field: "publishedAt",
      flex: 1,
      cellDataType: "date",
      valueFormatter: ({ value }) => formatDisplayDateWithoutDay(value as Date),
      cellClass: ({ data }) =>
        data && data.publishedAt > new Date() ? "admin-news-unpublished" : "",
    },
    {
      headerName: "Olvasottság",
      field: "readerCount",
      flex: 0.5,
      minWidth: 150,
    },
    {
      headerName: "Olvasók",
      field: "readers",
      flex: 2,
      wrapText: true,
      autoHeight: true,
      valueFormatter: ({ value }) => (value as string[]).join("; "),
    },
    {
      headerName: "Kezelés",
      flex: 0,
      width: 110,
      resizable: false,
      cellRenderer: AdminActionsCellRendererComponent,
      cellRendererParams: {
        actions: ["edit", "delete"] satisfies readonly AdminRowAction[],
        rowLabel: (row: AdminNewsItem) => row.title,
        onAction: (action: AdminRowAction, row: AdminNewsItem) => {
          this.onRowAction(action, row);
        },
      } satisfies Partial<AdminActionParameters<AdminNewsItem>>,
    },
  ];

  protected onSearchInput(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  private onRowAction(action: AdminRowAction, row: AdminNewsItem) {
    if (action === "edit") {
      this.router.navigate(["/admin/hirek", row.id]);
    } else if (action === "delete") {
      this.onDeleteNews(row);
    }
  }

  private onDeleteNews(row: AdminNewsItem) {
    const dialogRef = this.dialog.open<
      ConfirmDialogComponent,
      ConfirmDialogData,
      boolean
    >(ConfirmDialogComponent, {
      data: {
        title: "Hír törlése",
        message: `Biztosan törölni szeretnéd a(z) „${row.title}” című hírt?`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteAdminNewsMutation.mutate(row.id);
      }
    });
  }
}
