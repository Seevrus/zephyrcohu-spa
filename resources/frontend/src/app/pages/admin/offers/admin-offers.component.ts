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
import { type AdminOfferItem } from "../../../../types/admin-offers";
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
import { AdminOffersQueryService } from "../../../services/admin-offers.query.service";

@Component({
  selector: "app-admin-offers",
  host: {
    class: "app-admin-offers",
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
  templateUrl: "./admin-offers.component.html",
  styleUrl: "./admin-offers.component.scss",
})
export class AdminOffersComponent {
  private readonly adminOffersQueryService = inject(AdminOffersQueryService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  private readonly adminOffersQuery = injectQuery(() =>
    this.adminOffersQueryService.getAdminOffers(),
  );

  protected readonly deleteAdminOfferMutation = injectMutation(() =>
    this.adminOffersQueryService.deleteAdminOffer(),
  );

  protected readonly searchTerm = signal("");

  private readonly debouncedSearchTerm = toSignal(
    toObservable(this.searchTerm).pipe(debounceTime(SEARCH_DEBOUNCE_MS)),
    { initialValue: "" },
  );

  private readonly offers = computed(() => this.adminOffersQuery.data() ?? []);

  protected readonly filteredOffers = computed(() => {
    const term = this.debouncedSearchTerm().trim().toLowerCase();

    if (!term) {
      return this.offers();
    }

    return this.offers().filter((offer) =>
      offer.title.toLowerCase().includes(term),
    );
  });

  protected readonly isLoading = computed(() =>
    this.adminOffersQuery.isPending(),
  );

  protected readonly isEmpty = computed(
    () => this.adminOffersQuery.isSuccess() && this.offers().length === 0,
  );

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly errorMessage = computed(
    () => this.adminOffersQuery.error()?.code,
  );

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly deleteErrorMessage = computed(() =>
    this.deleteAdminOfferMutation.isError()
      ? "INTERNAL_SERVER_ERROR"
      : undefined,
  );

  protected readonly theme = zephyrGridTheme;
  protected readonly gridModules = adminGridModules;
  protected readonly defaultColDef = adminGridDefaultColumnDefinition;
  protected readonly paginationPanels = adminPaginationPanels;
  protected readonly localeText = adminGridLocaleText;

  protected readonly columnDefinitions: ColDef<AdminOfferItem>[] = [
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
        rowLabel: (row: AdminOfferItem) => row.title,
        onAction: (action: AdminRowAction, row: AdminOfferItem) => {
          this.onRowAction(action, row);
        },
      } satisfies Partial<AdminActionParameters<AdminOfferItem>>,
    },
  ];

  protected onSearchInput(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  private onRowAction(action: AdminRowAction, row: AdminOfferItem) {
    if (action === "edit") {
      this.router.navigate(["/admin/ajanlatok", row.id]);
    } else if (action === "delete") {
      this.onDeleteOffer(row);
    }
  }

  private onDeleteOffer(row: AdminOfferItem) {
    const dialogRef = this.dialog.open<
      ConfirmDialogComponent,
      ConfirmDialogData,
      boolean
    >(ConfirmDialogComponent, {
      data: {
        title: "Ajánlat törlése",
        message: `Biztosan törölni szeretnéd a(z) „${row.title}” című ajánlatot?`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteAdminOfferMutation.mutate(row.id);
      }
    });
  }
}
