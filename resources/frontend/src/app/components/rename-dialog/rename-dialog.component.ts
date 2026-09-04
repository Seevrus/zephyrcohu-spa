import { Component, inject, signal } from "@angular/core";
import { form, FormField, required } from "@angular/forms/signals";
import { MatButton } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from "@angular/material/dialog";
import { MatError, MatFormField, MatLabel } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";

export type RenameDialogData = {
  title: string;
  label: string;
  initialValue: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /**
   * Shown inline above the field. Set by the caller when it reopens this
   * dialog after a failed save, so the admin can correct the value without
   * losing what they typed.
   */
  errorMessage?: string;
};

type RenameFormModel = {
  value: string;
};

@Component({
  selector: "app-rename-dialog",
  imports: [
    FormField,
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
  ],
  templateUrl: "./rename-dialog.component.html",
  styleUrl: "./rename-dialog.component.scss",
})
export class RenameDialogComponent {
  protected readonly data = inject<RenameDialogData>(MAT_DIALOG_DATA);

  private readonly dialogRef = inject(MatDialogRef<RenameDialogComponent>);

  protected readonly confirmLabel = this.data.confirmLabel ?? "Mentés";
  protected readonly cancelLabel = this.data.cancelLabel ?? "Mégsem";

  protected readonly model = signal<RenameFormModel>({
    value: this.data.initialValue,
  });

  protected readonly renameForm = form(this.model, (schemaPath) => {
    required(schemaPath.value);
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();

    if (this.renameForm().invalid()) {
      return;
    }

    this.dialogRef.close(this.model().value.trim());
  }

  protected onCancel(): void {
    this.dialogRef.close();
  }
}
