import { Component, inject, type OnInit, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { injectMutation } from "@tanstack/angular-query-experimental";

import { ZephyrHttpError } from "../../../api/ZephyrHttpError";
import { zephyr } from "../../../constants/forms";
import { type QueryParamsByPath } from "../../app.routes";
import { UsersQueryService } from "../../services/users.query.service";

@Component({
  host: {
    class: "app-register-mail-decline",
  },
  imports: [RouterLink],
  selector: "app-register-mail-decline",
  styleUrl: "./register-mail-decline.component.scss",
  templateUrl: "./register-mail-decline.component.html",
})
export class RegisterMailDeclineComponent implements OnInit {
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly usersQueryService = inject(UsersQueryService);

  readonly revokeRegistrationMutation = injectMutation(() =>
    this.usersQueryService.registerRevoke(),
  );

  readonly revokedEmail = signal<string>("");
  /**
   * BAD_EMAIL_CODE
   * || BAD_QUERY_PARAMS
   * || INTERNAL_SERVER_ERROR
   * || INVALID_REQUEST_DATA
   * || USER_ALREADY_CONFIRMED
   */
  readonly revokeError = signal<string>("");
  readonly zephyrEmail = zephyr;

  ngOnInit() {
    this.route.queryParams.subscribe(
      ({ code, email }: QueryParamsByPath["regisztracio/elvet"]) => {
        if (code === undefined || email === undefined) {
          this.revokeError.set("BAD_QUERY_PARAMS");
        } else {
          this.revokeRegistration(
            decodeURIComponent(code),
            decodeURIComponent(email),
          );
        }
      },
    );
  }

  private async revokeRegistration(code: string, email: string) {
    try {
      await this.revokeRegistrationMutation.mutateAsync({
        code,
        email,
      });

      this.revokedEmail.set(email);
    } catch (error) {
      if (error instanceof ZephyrHttpError) {
        this.revokeError.set(error.code);
      } else {
        this.revokeError.set("INTERNAL_SERVER_ERROR");
      }
    }
  }
}
