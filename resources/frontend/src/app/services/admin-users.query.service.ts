import { HttpClient, type HttpErrorResponse } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { queryOptions } from "@tanstack/angular-query-experimental";
import { catchError, lastValueFrom, map, throwError } from "rxjs";

import { type ZephyrHttpError } from "../../api/ZephyrHttpError";
import { environment } from "../../environments/environment";
import {
  type AdminUser,
  type AdminUserCollectionResponse,
  type AdminUserResponse,
} from "../../types/admin-users";
import { throwHttpError } from "../../utils/throwHttpError";
import { queryKeys } from "./queryKeys";

@Service()
export class AdminUsersQueryService {
  private readonly http = inject(HttpClient);

  getAdminUsers() {
    return queryOptions<AdminUser[], ZephyrHttpError>({
      queryKey: queryKeys.adminUsers,
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<AdminUserCollectionResponse>(
              `${environment.apiUrl}/admin/users`,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map((response) =>
                response.data.map(AdminUsersQueryService.mapAdminUserResponse),
              ),
            ),
        ),
    });
  }

  private static mapAdminUserResponse(response: AdminUserResponse): AdminUser {
    return {
      ...response,
      passwordSetAt: new Date(response.passwordSetAt),
      lastActive: response.lastActive ? new Date(response.lastActive) : null,
    };
  }
}
