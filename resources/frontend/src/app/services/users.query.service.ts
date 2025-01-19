import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import {
  QueryClient,
  queryOptions,
} from "@tanstack/angular-query-experimental";
import { catchError, lastValueFrom, map, of, throwError } from "rxjs";

import { environment } from "../../environments/environment";
import { type SessionResponse, type UserSession } from "../../types/users";

@Injectable({
  providedIn: "root",
})
export class UsersQueryService {
  private http = inject(HttpClient);
  private queryClient = inject(QueryClient);

  session() {
    return queryOptions<UserSession | null, HttpErrorResponse>({
      queryKey: ["session"],
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<SessionResponse>(`${environment.apiUrl}/users/session`)
            .pipe(
              catchError((error: HttpErrorResponse) => {
                if (error.status === 401) {
                  this.queryClient.invalidateQueries();
                  return of({});
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

  private static mapSessionResponse(
    response: SessionResponse,
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
