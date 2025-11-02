import { Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatError, MatFormField } from "@angular/material/form-field";
import { MatInput, MatLabel } from "@angular/material/input";
import { injectMutation } from "@tanstack/angular-query-experimental";

import { ZephyrHttpError } from "../../../api/ZephyrHttpError";
import { ButtonLoadableComponent } from "../../components/button-loadable/button-loadable.component";
import { UsersQueryService } from "../../services/users.query.service";

@Component({
  selector: "app-forgot-password",
  host: {
    class: "app-forgot-password",
  },
  imports: [
    ReactiveFormsModule,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    ButtonLoadableComponent,
  ],
  templateUrl: "./forgot-password.component.html",
  styleUrl: "./forgot-password.component.scss",
})
export class ForgotPasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly usersQueryService = inject(UsersQueryService);

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly requestPasswordResetErrorMessage = signal("");

  protected readonly forgotPasswordForm = this.formBuilder.group({
    email: ["", [Validators.required, Validators.email]],
  });

  protected get email() {
    return this.forgotPasswordForm.get("email");
  }

  protected async onRequestPasswordReset() {
    try {
      this.requestPasswordResetErrorMessage.set("");
      this.forgotPasswordForm.markAsPristine();

      const email = this.email?.value ?? "";

      await this.requestNewPasswordMutation.mutateAsync({ email });
    } catch (error) {
      if (error instanceof ZephyrHttpError) {
        this.requestPasswordResetErrorMessage.set(error.code);
      } else {
        this.requestPasswordResetErrorMessage.set("INTERNAL_SERVER_ERROR");
      }
    }
  }

  protected readonly requestNewPasswordMutation = injectMutation(() =>
    this.usersQueryService.requestNewPassword(),
  );
}
