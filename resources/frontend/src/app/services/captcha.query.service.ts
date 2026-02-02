import { HttpClient, type HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { mutationOptions } from "@tanstack/angular-query-experimental";
import { catchError, lastValueFrom, throwError } from "rxjs";

import { type ZephyrHttpError } from "../../api/ZephyrHttpError";
import { environment } from "../../environments/environment";
import {
  type CheckRecaptchaTokenRequest,
  type RecaptchaTokenResponse,
} from "../../types/captcha";
import { throwHttpError } from "../../utils/throwHttpError";
import { mutationKeys } from "./queryKeys";

@Injectable({
  providedIn: "root",
})
export class CaptchaQueryService {
  private readonly http = inject(HttpClient);

  checkRecaptchaToken() {
    return mutationOptions<
      RecaptchaTokenResponse,
      ZephyrHttpError,
      CheckRecaptchaTokenRequest
    >({
      mutationKey: mutationKeys.checkRecaptchaToken,
      mutationFn: (request) =>
        lastValueFrom(
          this.http
            .post<RecaptchaTokenResponse>(
              `${environment.apiUrl}/captcha`,
              request,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
            ),
        ),
    });
  }
}
