import { Component, inject } from "@angular/core";
import { MatButton } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from "@angular/material/dialog";

export type ConfirmDialogData = {
  title: string;
  message: string;
  warning?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

@Component({
  selector: "app-confirm-dialog",
  imports: [MatButton, MatDialogActions, MatDialogContent, MatDialogTitle],
  templateUrl: "./confirm-dialog.component.html",
  styleUrl: "./confirm-dialog.component.scss",
})
export class ConfirmDialogComponent {
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  protected readonly confirmLabel = this.data.confirmLabel ?? "Törlés";
  protected readonly cancelLabel = this.data.cancelLabel ?? "Mégsem";

  protected onConfirm(): void {
    this.dialogRef.close(true);
  }

  protected onCancel(): void {
    this.dialogRef.close(false);
  }
}
