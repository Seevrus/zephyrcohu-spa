import { Component, effect, inject, input, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { injectMutation } from "@tanstack/angular-query-experimental";

import { ZephyrHttpError } from "../../../api/ZephyrHttpError";
import { zephyr } from "../../../constants/forms";
import { UsersQueryService } from "../../services/users.query.service";

@Component({
  host: {
    class: "app-register-mail-accept",
  },
  imports: [RouterLink],
  selector: "app-register-mail-accept",
  styleUrl: "./register-mail-accept.component.scss",
  templateUrl: "./register-mail-accept.component.html",
})
export class RegisterMailAcceptComponent {
  private readonly usersQueryService = inject(UsersQueryService);

  readonly code = input<string>();
  readonly email = input<string>();

  readonly confirmEmailMutation = injectMutation(() =>
    this.usersQueryService.registerConfirmEmail(),
  );

  readonly confirmedEmail = signal<string>("");
  /**
   * BAD_EMAIL_CODE
   * || BAD_QUERY_PARAMS
   * || INTERNAL_SERVER_ERROR
   * || INVALID_REQUEST_DATA
   * || USER_ALREADY_CONFIRMED
   */
  readonly confirmError = signal<string>("");
  readonly zephyrEmail = zephyr;

  private readonly confirmEmailEffect = effect(() => {
    const code = this.code();
    const email = this.email();

    if (code === undefined || email === undefined) {
      this.confirmError.set("BAD_QUERY_PARAMS");
    } else {
      this.confirmEmail(decodeURIComponent(code), decodeURIComponent(email));
    }
  });

  private async confirmEmail(code: string, email: string) {
    try {
      await this.confirmEmailMutation.mutateAsync({
        code,
        email,
      });

      this.confirmedEmail.set(email);
    } catch (error) {
      if (error instanceof ZephyrHttpError) {
        this.confirmError.set(error.code);
      } else {
        this.confirmError.set("INTERNAL_SERVER_ERROR");
      }
    }
  }
}
