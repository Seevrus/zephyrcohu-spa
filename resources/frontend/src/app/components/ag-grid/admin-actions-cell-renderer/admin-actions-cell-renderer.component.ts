import { Component, computed, signal } from "@angular/core";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-community";

export type AdminRowAction = "info" | "edit" | "email" | "delete";

export type AdminActionParameters<TRow> = ICellRendererParams<TRow> & {
  actions: readonly AdminRowAction[];
  labels?: Partial<Record<AdminRowAction, string>>;
  /** Builds the row-identifying suffix for aria-labels, e.g. a title or name. */
  rowLabel?: (row: TRow) => string;
  onAction: (action: AdminRowAction, row: TRow) => void;
};

const ADMIN_ACTION_ICONS: Record<AdminRowAction, string> = {
  info: "info",
  edit: "edit",
  email: "email",
  delete: "delete_forever",
};

const ADMIN_ACTION_DEFAULT_LABELS: Record<AdminRowAction, string> = {
  info: "Részletek",
  edit: "Szerkesztés",
  email: "Email küldése",
  delete: "Törlés",
};

@Component({
  selector: "app-admin-actions-cell-renderer",
  imports: [MatIcon, MatIconButton],
  templateUrl: "./admin-actions-cell-renderer.component.html",
  styleUrl: "./admin-actions-cell-renderer.component.scss",
})
export class AdminActionsCellRendererComponent<
  TRow = unknown,
> implements ICellRendererAngularComp {
  private readonly adminActionParameters = signal<
    AdminActionParameters<TRow> | undefined
  >(undefined);

  protected readonly adminRowActions = computed(
    () => this.adminActionParameters()?.actions ?? [],
  );

  agInit(params: AdminActionParameters<TRow>) {
    this.adminActionParameters.set(params);
  }

  refresh() {
    return false;
  }

  protected getAriaLabel(action: AdminRowAction) {
    const actionParameters = this.adminActionParameters();
    const row = actionParameters?.data;

    const label =
      actionParameters?.labels?.[action] ?? ADMIN_ACTION_DEFAULT_LABELS[action];

    const labelSuffix = row ? actionParameters?.rowLabel?.(row) : undefined;

    return labelSuffix ? `${label}: ${labelSuffix}` : label;
  }

  protected getActionIcon(action: AdminRowAction) {
    return ADMIN_ACTION_ICONS[action];
  }

  protected onAction(action: AdminRowAction) {
    const actionParameters = this.adminActionParameters();

    if (actionParameters?.data) {
      actionParameters.onAction(action, actionParameters.data);
    }
  }
}
