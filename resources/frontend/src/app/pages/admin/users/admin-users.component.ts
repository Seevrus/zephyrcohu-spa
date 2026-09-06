import { Component, computed, inject, signal } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatProgressBar } from "@angular/material/progress-bar";
import { Router } from "@angular/router";
import { injectQuery } from "@tanstack/angular-query-experimental";
import { AgGridAngular } from "ag-grid-angular";
import { type ColDef, type ICellRendererParams } from "ag-grid-community";

import { formatDisplayDateWithoutDay } from "../../../../mappers/dates";
import {
  adminGridDefaultColumnDefinition,
  adminGridLocaleText,
  adminGridModules,
  adminPaginationPanels,
} from "../../../../shared/admin-grid";
import { zephyrGridTheme } from "../../../../shared/ag-grid-theme";
import { type AdminUser } from "../../../../types/admin-users";
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
import { SuccessCardComponent } from "../../../components/success-card/success-card.component";
import { AdminUsersQueryService } from "../../../services/admin-users.query.service";
import { FlashMessageService } from "../../../services/flash-message.service";

@Component({
  selector: "app-admin-users",
  host: {
    class: "app-admin-users",
  },
  imports: [
    AgGridAngular,
    FormUnexpectedErrorComponent,
    MatProgressBar,
    SuccessCardComponent,
  ],
  templateUrl: "./admin-users.component.html",
  styleUrl: "./admin-users.component.scss",
})
export class AdminUsersComponent {
  private readonly adminUsersQueryService = inject(AdminUsersQueryService);
  private readonly dialog = inject(MatDialog);
  private readonly flashMessageService = inject(FlashMessageService);
  private readonly router = inject(Router);

  protected readonly userUpdateMessage = signal(
    this.flashMessageService.consume(),
  );

  private readonly adminUsersQuery = injectQuery(() =>
    this.adminUsersQueryService.getAdminUsers(),
  );

  protected readonly users = computed(() => this.adminUsersQuery.data() ?? []);

  protected readonly isLoading = computed(() =>
    this.adminUsersQuery.isPending(),
  );

  protected readonly isEmpty = computed(
    () => this.adminUsersQuery.isSuccess() && this.users().length === 0,
  );

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly errorMessage = computed(
    () => this.adminUsersQuery.error()?.code,
  );

  protected readonly theme = zephyrGridTheme;
  protected readonly gridModules = adminGridModules;
  protected readonly defaultColDef = adminGridDefaultColumnDefinition;
  protected readonly paginationPanels = adminPaginationPanels;
  protected readonly localeText = adminGridLocaleText;

  protected readonly columnDefinitions: ColDef<AdminUser>[] = [
    {
      headerName: "Email cím",
      field: "email",
      flex: 2,
      wrapText: true,
      autoHeight: true,
      valueFormatter: ({ data, value }) =>
        data?.isAdmin
          ? `${value as string} (Adminisztrátor)`
          : (value as string),
    },
    {
      headerName: "Megerősítve",
      field: "confirmed",
      flex: 1,
      cellDataType: "text",
      valueGetter: ({ data }) => (data?.confirmed ? "Igen" : "Nem"),
    },
    {
      headerName: "Hírlevél",
      field: "newsletter",
      flex: 1,
      cellDataType: "text",
      valueGetter: ({ data }) => (data?.newsletter ? "Igen" : "Nem"),
    },
    {
      headerName: "Utolsó aktivitás",
      field: "lastActive",
      flex: 1,
      cellDataType: "date",
      wrapText: true,
      autoHeight: true,
      valueFormatter: ({ value }) =>
        value ? formatDisplayDateWithoutDay(value as Date) : "",
    },
    {
      headerName: "Kezelés",
      flex: 0,
      width: 150,
      resizable: false,
      cellRendererSelector: ({ data }: ICellRendererParams<AdminUser>) => ({
        component: AdminActionsCellRendererComponent,
        params: {
          /**
           * The delete endpoint refuses admin accounts, so the action is left
           * out of those rows rather than rendered and then rejected.
           */
          actions: (data?.isAdmin
            ? ["edit", "email"]
            : ["edit", "email", "delete"]) satisfies readonly AdminRowAction[],
          rowLabel: (row: AdminUser) => row.email,
          onAction: (action: AdminRowAction, row: AdminUser) => {
            this.onRowAction(action, row);
          },
        } satisfies Partial<AdminActionParameters<AdminUser>>,
      }),
    },
  ];

  private onRowAction(action: AdminRowAction, row: AdminUser) {
    if (action === "edit") {
      this.router.navigate(["/admin/felhasznalok", row.id]);
    } else if (action === "email") {
      this.router.navigate(["/admin/felhasznalok", row.id, "email"]);
    } else if (action === "delete") {
      this.onDeleteUser(row);
    }
  }

  /**
   * The delete request itself is wired in Task 21, together with the dialog
   * that collects the mandatory reason.
   */
  private onDeleteUser(row: AdminUser) {
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: "Felhasználó törlése",
          message: `Biztosan törölni szeretnéd a(z) „${row.email}” felhasználót?`,
          warning:
            "A felhasználó és minden hozzá tartozó adat véglegesen törlődik.",
        },
      },
    );
  }
}
