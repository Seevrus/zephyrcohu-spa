import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { queryOptions } from "@tanstack/angular-query-experimental";
import { lastValueFrom, map } from "rxjs";

import { environment } from "../../environments/environment";
import { type ErrorResponse } from "../../types/errors";
import { type SessionResponse, type UserSession } from "../../types/user";

@Injectable({
  providedIn: "root",
})
export class UsersQueryService {
  private http = inject(HttpClient);

  session() {
    return queryOptions<UserSession, ErrorResponse>({
      queryKey: ["session"],
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<SessionResponse>(`${environment.apiUrl}/users/session`)
            .pipe(map(UsersQueryService.mapSessionResponse)),
        ),
      retry(failureCount, error) {
        if (error.status === 401) {
          return false;
        }

        return failureCount < 3;
      },
    });
  }

  private static mapSessionResponse(response: SessionResponse): UserSession {
    return {
      ...response.data,
      passwordSetAt: new Date(response.data.passwordSetAt),
    };
  }
}
