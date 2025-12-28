import { inject, Injectable, signal } from "@angular/core";
import { injectMutation } from "@tanstack/angular-query-experimental";

import { ZephyrHttpError } from "../../api/ZephyrHttpError";
import { UsersQueryService } from "./users.query.service";

@Injectable({
  providedIn: "root",
})
export class ResendConfirmationEmailService {
  private readonly usersQueryService = inject(UsersQueryService);

  /**
   * | EMAIL_NOT_FOUND
   * | INTERNAL_SERVER_ERROR
   * | USER_ALREADY_CONFIRMED
   *
   * But we will be a bit optimistic here. Given how the action is enabled, only unexpected errors will occur.
   */
  readonly resendConfirmationEmailErrorMessage = signal("");
  readonly resentEmail = signal("");

  private readonly resendRegistrationEmailMutation = injectMutation(() =>
    this.usersQueryService.resendRegistrationConfirmEmail(),
  );

  async onResendConfirmationEmail(email: string) {
    try {
      this.resendConfirmationEmailErrorMessage.set("");
      this.resentEmail.set("");

      await this.resendRegistrationEmailMutation.mutateAsync({ email });
      this.resentEmail.set(email);
    } catch (error) {
      if (error instanceof ZephyrHttpError) {
        this.resendConfirmationEmailErrorMessage.set(error.code);
      } else {
        this.resendConfirmationEmailErrorMessage.set("INTERNAL_SERVER_ERROR");
      }
    }
  }
}
