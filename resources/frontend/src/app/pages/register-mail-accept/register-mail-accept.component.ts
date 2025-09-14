import { Component, inject, type OnInit, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { injectMutation } from "@tanstack/angular-query-experimental";

import { ZephyrHttpError } from "../../../api/ZephyrHttpError";
import { zephyr } from "../../../constants/email";
import { type QueryParamsByPath } from "../../app.routes";
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
export class RegisterMailAcceptComponent implements OnInit {
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly usersQueryService = inject(UsersQueryService);

  readonly confirmEmailMutation = injectMutation(() =>
    this.usersQueryService.confirmEmail(),
  );

  /**
   * BAD_EMAIL_CODE
   * || BAD_QUERY_PARAMS
   * || INTERNAL_SERVER_ERROR
   * || INVALID_REQUEST_DATA
   * || USER_ALREADY_CONFIRMED
   */
  readonly confirmError = signal<string>("");
  readonly zephyrEmail = zephyr;

  ngOnInit() {
    this.route.queryParams.subscribe(
      ({ code, email }: QueryParamsByPath["regisztracio/megerosit"]) => {
        if (code === undefined || email === undefined) {
          this.confirmError.set("BAD_QUERY_PARAMS");
        } else {
          this.confirmEmail(code, email);
        }
      },
    );
  }

  private async confirmEmail(code: string, email: string) {
    try {
      await this.confirmEmailMutation.mutateAsync({
        code,
        email,
      });
    } catch (error) {
      if (error instanceof ZephyrHttpError) {
        this.confirmError.set(error.code);
      } else {
        this.confirmError.set("INTERNAL_SERVER_ERROR");
      }
    }
  }
}
