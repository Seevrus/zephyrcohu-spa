import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import {
  mutationOptions,
  QueryClient,
  queryOptions,
} from "@tanstack/angular-query-experimental";
import { catchError, lastValueFrom, map, of, throwError } from "rxjs";

import { type ZephyrHttpError } from "../../api/ZephyrHttpError";
import { environment } from "../../environments/environment";
import {
  type ConfirmOrRevokeEmailRequest,
  type CreateUserRequest,
  type LoginRequest,
  type RequestNewPasswordRequest,
  type ResendRegistrationEmailRequest,
  type ResetPasswordRequest,
  type SessionData,
  type SessionResponse,
  type UserSession,
} from "../../types/users";
import { throwHttpError } from "../../utils/throwHttpError";
import { mutationKeys, queryKeys } from "./queryKeys";

@Injectable({
  providedIn: "root",
})
export class UsersQueryService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);

  login() {
    return mutationOptions<UserSession, ZephyrHttpError, LoginRequest>({
      mutationKey: mutationKeys.login,
      mutationFn: (request) =>
        lastValueFrom(
          this.http
            .post<SessionResponse>(`${environment.apiUrl}/users/login`, request)
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map<SessionResponse, UserSession>(
                UsersQueryService.mapSessionResponse,
              ),
            ),
        ),
      onSuccess: async () => {
        await this.queryClient.invalidateQueries({
          queryKey: ["session"],
        });
      },
    });
  }

  logout() {
    return mutationOptions<void, ZephyrHttpError>({
      mutationKey: mutationKeys.logout,
      mutationFn: () =>
        lastValueFrom(
          this.http
            .post<void>(`${environment.apiUrl}/users/login`, null)
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
            ),
        ),
      onSuccess: async () => {
        await this.queryClient.invalidateQueries({
          queryKey: ["session"],
        });
      },
    });
  }

  register() {
    return mutationOptions<UserSession, ZephyrHttpError, CreateUserRequest>({
      mutationKey: mutationKeys.register,
      mutationFn: (request) =>
        lastValueFrom(
          this.http
            .post<SessionResponse>(
              `${environment.apiUrl}/users/register`,
              request,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map<SessionResponse, UserSession>(
                UsersQueryService.mapSessionResponse,
              ),
            ),
        ),
      onSuccess: async () => {
        await this.queryClient.invalidateQueries({
          queryKey: ["session"],
        });
      },
    });
  }

  registerConfirmEmail() {
    return mutationOptions<
      SessionResponse,
      ZephyrHttpError,
      ConfirmOrRevokeEmailRequest
    >({
      mutationKey: mutationKeys.registerConfirmEmail,
      mutationFn: (request) =>
        lastValueFrom(
          this.http
            .post<SessionResponse>(
              `${environment.apiUrl}/users/register/confirm_email`,
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

  registerRevoke() {
    return mutationOptions<
      undefined,
      ZephyrHttpError,
      ConfirmOrRevokeEmailRequest
    >({
      mutationKey: mutationKeys.registerRevoke,
      mutationFn: (request) =>
        lastValueFrom(
          this.http
            .post<undefined>(
              `${environment.apiUrl}/users/register/revoke`,
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

  requestNewPassword() {
    return mutationOptions<
      undefined,
      ZephyrHttpError,
      RequestNewPasswordRequest
    >({
      mutationKey: mutationKeys.requestNewPassword,
      mutationFn: (request) =>
        lastValueFrom(
          this.http
            .post<undefined>(
              `${environment.apiUrl}/users/profile/request_new_password`,
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

  resendRegistrationConfirmEmail() {
    return mutationOptions<
      undefined,
      ZephyrHttpError,
      ResendRegistrationEmailRequest
    >({
      mutationKey: mutationKeys.registerResendConfirmationEmail,
      mutationFn: (request) =>
        lastValueFrom(
          this.http
            .post<undefined>(
              `${environment.apiUrl}/users/register/resend_confirm_email`,
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

  resetPassword() {
    return mutationOptions<UserSession, ZephyrHttpError, ResetPasswordRequest>({
      mutationKey: mutationKeys.register,
      mutationFn: (request) =>
        lastValueFrom(
          this.http
            .post<SessionResponse>(
              `${environment.apiUrl}/users/profile/reset_password`,
              request,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map<SessionResponse, UserSession>(
                UsersQueryService.mapSessionResponse,
              ),
            ),
        ),
      onSuccess: async () => {
        await this.queryClient.invalidateQueries({
          queryKey: ["session"],
        });
      },
    });
  }

  session() {
    return queryOptions<UserSession | null, HttpErrorResponse>({
      queryKey: queryKeys.session,
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<SessionResponse>(`${environment.apiUrl}/users/session`)
            .pipe<SessionResponse<SessionData | null>, UserSession | null>(
              catchError((error: HttpErrorResponse) => {
                if (error.status === 401) {
                  // TODO: invalidate some queries as they come in
                  // this.queryClient.invalidateQueries();

                  return of({
                    data: null,
                  } as SessionResponse<null>);
                }

                return throwError(
                  () =>
                    new HttpErrorResponse({
                      ...error,
                      url: error.url ?? undefined,
                    }),
                );
              }),
              map(UsersQueryService.mapSessionResponse),
            ),
        ),
    });
  }

  private static mapSessionResponse(response: SessionResponse): UserSession;
  private static mapSessionResponse(
    response: SessionResponse<SessionData | null>,
  ): UserSession | null;

  private static mapSessionResponse(
    response: SessionResponse<SessionData | null>,
  ): UserSession | null {
    if (!response.data) {
      return null;
    }

    return {
      ...response.data,
      passwordSetAt: new Date(response.data.passwordSetAt),
    };
  }
}
