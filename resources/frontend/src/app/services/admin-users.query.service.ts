import { HttpClient, type HttpErrorResponse } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import {
  mutationOptions,
  QueryClient,
  queryOptions,
} from "@tanstack/angular-query-experimental";
import { catchError, lastValueFrom, map, throwError } from "rxjs";

import { type ZephyrHttpError } from "../../api/ZephyrHttpError";
import { environment } from "../../environments/environment";
import {
  type AdminUser,
  type AdminUserCollectionResponse,
  type AdminUserItemResponse,
  type AdminUserResponse,
  type UpdateAdminUserRequest,
} from "../../types/admin-users";
import { throwHttpError } from "../../utils/throwHttpError";
import { throwValidationHttpError } from "../../utils/throwValidationHttpError";
import { mutationKeys, queryKeys } from "./queryKeys";

@Service()
export class AdminUsersQueryService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);

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

  updateAdminUser() {
    return mutationOptions<
      AdminUser,
      ZephyrHttpError,
      { id: number; request: UpdateAdminUserRequest }
    >({
      mutationKey: mutationKeys.updateAdminUser,
      mutationFn: ({ id, request }) =>
        lastValueFrom(
          this.http
            .put<AdminUserItemResponse>(
              `${environment.apiUrl}/admin/users/${id}`,
              request,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwValidationHttpError(error)),
              ),
              map((response) =>
                AdminUsersQueryService.mapAdminUserResponse(response.data),
              ),
            ),
        ),
      onSuccess: () => {
        this.queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
        this.queryClient.invalidateQueries({ queryKey: queryKeys.session });
      },
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
