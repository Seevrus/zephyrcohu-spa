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
  type CreateUserRequest,
  type SessionData,
  type SessionResponse,
  type UserSession,
} from "../../types/users";
import { throwHttpError } from "../../utils/throwHttpError";
import { queryKeys } from "./queryKeys";

@Injectable({
  providedIn: "root",
})
export class UsersQueryService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);

  register() {
    return mutationOptions<UserSession, ZephyrHttpError, CreateUserRequest>({
      mutationKey: ["register"],
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
