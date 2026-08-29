import { Component, computed, inject, signal } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
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
import { debounceTime } from "rxjs";

import { SEARCH_DEBOUNCE_MS } from "../../../../constants/debounce";
import { formatDisplayDateWithoutDay } from "../../../../mappers/dates";
import {
  adminGridDefaultColumnDefinition,
  adminGridLocaleText,
  adminGridModules,
  adminPaginationPanels,
} from "../../../../shared/admin-grid";
import { zephyrGridTheme } from "../../../../shared/ag-grid-theme";
import { type AdminKnowledgebaseItem } from "../../../../types/admin-knowledgebase";
import { type TagResponse } from "../../../../types/knowledgebase";
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
import { AdminKnowledgebaseQueryService } from "../../../services/admin-knowledgebase.query.service";

@Component({
  selector: "app-admin-knowledgebase",
  host: {
    class: "app-admin-knowledgebase",
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
  templateUrl: "./admin-knowledgebase.component.html",
  styleUrl: "./admin-knowledgebase.component.scss",
})
export class AdminKnowledgebaseComponent {
  private readonly adminKnowledgebaseQueryService = inject(
    AdminKnowledgebaseQueryService,
  );
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  private readonly adminKnowledgebaseQuery = injectQuery(() =>
    this.adminKnowledgebaseQueryService.getAdminKnowledgebase(),
  );

  protected readonly deleteAdminKnowledgebaseMutation = injectMutation(() =>
    this.adminKnowledgebaseQueryService.deleteAdminKnowledgebase(),
  );

  protected readonly searchTerm = signal("");

  private readonly debouncedSearchTerm = toSignal(
    toObservable(this.searchTerm).pipe(debounceTime(SEARCH_DEBOUNCE_MS)),
    { initialValue: "" },
  );

  private readonly knowledgebase = computed(
    () => this.adminKnowledgebaseQuery.data() ?? [],
  );

  protected readonly filteredKnowledgebase = computed(() => {
    const term = this.debouncedSearchTerm().trim().toLowerCase();

    if (!term) {
      return this.knowledgebase();
    }

    return this.knowledgebase().filter((article) =>
      article.title.toLowerCase().includes(term),
    );
  });

  protected readonly isLoading = computed(() =>
    this.adminKnowledgebaseQuery.isPending(),
  );

  protected readonly isEmpty = computed(
    () =>
      this.adminKnowledgebaseQuery.isSuccess() &&
      this.knowledgebase().length === 0,
  );

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly errorMessage = computed(
    () => this.adminKnowledgebaseQuery.error()?.code,
  );

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly deleteErrorMessage = computed(() =>
    this.deleteAdminKnowledgebaseMutation.isError()
      ? "INTERNAL_SERVER_ERROR"
      : undefined,
  );

  protected readonly theme = zephyrGridTheme;
  protected readonly gridModules = adminGridModules;
  protected readonly defaultColDef = adminGridDefaultColumnDefinition;
  protected readonly paginationPanels = adminPaginationPanels;
  protected readonly localeText = adminGridLocaleText;

  protected readonly columnDefinitions: ColDef<AdminKnowledgebaseItem>[] = [
    {
      headerName: "Kiknek szól",
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
      headerName: "Címkék",
      field: "tags",
      flex: 1.5,
      wrapText: true,
      autoHeight: true,
      valueFormatter: ({ value }) =>
        (value as TagResponse[])
          .map((tag) => tag.name)
          .sort((a, b) => a.localeCompare(b))
          .join("; "),
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
        rowLabel: (row: AdminKnowledgebaseItem) => row.title,
        onAction: (action: AdminRowAction, row: AdminKnowledgebaseItem) => {
          this.onRowAction(action, row);
        },
      } satisfies Partial<AdminActionParameters<AdminKnowledgebaseItem>>,
    },
  ];

  protected onSearchInput(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  private onRowAction(action: AdminRowAction, row: AdminKnowledgebaseItem) {
    if (action === "edit") {
      this.router.navigate(["/admin/tudasbazis", row.id]);
    } else if (action === "delete") {
      this.onDeleteKnowledgebaseItem(row);
    }
  }

  private onDeleteKnowledgebaseItem(row: AdminKnowledgebaseItem) {
    const dialogRef = this.dialog.open<
      ConfirmDialogComponent,
      ConfirmDialogData,
      boolean
    >(ConfirmDialogComponent, {
      data: {
        title: "Tudásbázis cikk törlése",
        message: `Biztosan törölni szeretnéd a(z) „${row.title}” című cikket?`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteAdminKnowledgebaseMutation.mutate(row.id);
      }
    });
  }
}
