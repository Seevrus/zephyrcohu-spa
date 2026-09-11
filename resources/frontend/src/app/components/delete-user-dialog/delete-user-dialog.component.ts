import { Component, computed, inject, signal } from "@angular/core";
import { form, FormField, maxLength, required } from "@angular/forms/signals";
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
import { MatRadioButton, MatRadioGroup } from "@angular/material/radio";

import {
  type DeleteAdminUserReason,
  type DeleteAdminUserRequest,
} from "../../../types/admin-users";

export type DeleteUserDialogData = {
  email: string;
};

type DeleteUserFormModel = {
  subject: string;
  reason: DeleteAdminUserReason;
  customReason: string;
};

@Component({
  selector: "app-delete-user-dialog",
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
    MatRadioButton,
    MatRadioGroup,
  ],
  templateUrl: "./delete-user-dialog.component.html",
  styleUrl: "./delete-user-dialog.component.scss",
})
export class DeleteUserDialogComponent {
  protected readonly data = inject<DeleteUserDialogData>(MAT_DIALOG_DATA);

  private readonly dialogRef = inject(MatDialogRef<DeleteUserDialogComponent>);

  protected readonly model = signal<DeleteUserFormModel>({
    subject: "Regisztrációja törlésre került",
    reason: "asked",
    customReason: "",
  });

  protected readonly isCustomReason = computed(
    () => this.model().reason === "custom",
  );

  protected readonly deleteUserForm = form(this.model, (schemaPath) => {
    required(schemaPath.subject);
    maxLength(schemaPath.subject, 255);
    required(schemaPath.customReason, { when: () => this.isCustomReason() });
    maxLength(schemaPath.customReason, 500);
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();

    if (this.deleteUserForm().invalid()) {
      return;
    }

    const { subject, reason, customReason } = this.model();

    this.dialogRef.close({
      subject: subject.trim(),
      reason,
      customReason: reason === "custom" ? customReason.trim() : null,
    } satisfies DeleteAdminUserRequest);
  }

  protected onCancel(): void {
    this.dialogRef.close();
  }
}
