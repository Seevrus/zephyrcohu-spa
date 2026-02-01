import {
  Component,
  inject,
  type OnDestroy,
  type OnInit,
  signal,
} from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { injectMutation } from "@tanstack/angular-query-experimental";
import { type Subscription } from "rxjs";

import { ZephyrHttpError } from "../../../api/ZephyrHttpError";
import { zephyr } from "../../../constants/forms";
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
export class RegisterMailAcceptComponent implements OnInit, OnDestroy {
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly usersQueryService = inject(UsersQueryService);

  private queryParamsSubscription: Subscription | null = null;

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

  ngOnInit() {
    this.queryParamsSubscription = this.route.queryParams.subscribe(
      ({ code, email }: QueryParamsByPath["regisztracio/megerosit"]) => {
        if (code === undefined || email === undefined) {
          this.confirmError.set("BAD_QUERY_PARAMS");
        } else {
          this.confirmEmail(
            decodeURIComponent(code),
            decodeURIComponent(email),
          );
        }
      },
    );
  }

  ngOnDestroy() {
    this.queryParamsSubscription?.unsubscribe();
  }

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
