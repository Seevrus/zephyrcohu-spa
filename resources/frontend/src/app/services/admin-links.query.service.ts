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
  type AdminLinkCategoryCollectionResponse,
  type AdminLinkCategoryResponse,
  type AdminLinkCollectionResponse,
  type AdminLinkItemResponse,
  type AdminLinkResponse,
  type SaveAdminLinkRequest,
} from "../../types/admin-links";
import { throwHttpError } from "../../utils/throwHttpError";
import { mutationKeys, queryKeys } from "./queryKeys";

@Service()
export class AdminLinksQueryService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);

  getAdminLinks() {
    return queryOptions<AdminLinkResponse[], ZephyrHttpError>({
      queryKey: queryKeys.adminLinks,
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<AdminLinkCollectionResponse>(
              `${environment.apiUrl}/admin/links`,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map((response) => response.data),
            ),
        ),
    });
  }

  getAdminLink(id: number | undefined) {
    return queryOptions<AdminLinkResponse, ZephyrHttpError>({
      queryKey: queryKeys.adminLinkItem(id),
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<AdminLinkItemResponse>(
              `${environment.apiUrl}/admin/links/${id}`,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map((response) => response.data),
            ),
        ),
      enabled: id !== undefined,
    });
  }

  getAdminLinkCategories() {
    return queryOptions<AdminLinkCategoryResponse[], ZephyrHttpError>({
      queryKey: queryKeys.adminLinkCategories,
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<AdminLinkCategoryCollectionResponse>(
              `${environment.apiUrl}/admin/link_categories`,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map((response) => response.data),
            ),
        ),
    });
  }

  createAdminLink() {
    return mutationOptions<
      AdminLinkResponse,
      ZephyrHttpError,
      SaveAdminLinkRequest
    >({
      mutationKey: mutationKeys.createAdminLink,
      mutationFn: (request) =>
        lastValueFrom(
          this.http
            .post<AdminLinkItemResponse>(
              `${environment.apiUrl}/admin/links`,
              request,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map((response) => response.data),
            ),
        ),
      onSuccess: () => {
        this.invalidateLinkQueries();
      },
    });
  }

  updateAdminLink() {
    return mutationOptions<
      AdminLinkResponse,
      ZephyrHttpError,
      { id: number; request: SaveAdminLinkRequest }
    >({
      mutationKey: mutationKeys.updateAdminLink,
      mutationFn: ({ id, request }) =>
        lastValueFrom(
          this.http
            .put<AdminLinkItemResponse>(
              `${environment.apiUrl}/admin/links/${id}`,
              request,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map((response) => response.data),
            ),
        ),
      onSuccess: (_data, { id }) => {
        this.invalidateLinkQueries(id);
      },
    });
  }

  deleteAdminLink() {
    return mutationOptions<void, ZephyrHttpError, number>({
      mutationKey: mutationKeys.deleteAdminLink,
      mutationFn: (id) =>
        lastValueFrom(
          this.http
            .delete<void>(`${environment.apiUrl}/admin/links/${id}`)
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
            ),
        ),
      onSuccess: (_data, id) => {
        this.invalidateLinkQueries(id);
      },
    });
  }

  private invalidateLinkQueries(id?: number) {
    this.queryClient.invalidateQueries({ queryKey: queryKeys.adminLinks });
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.adminLinkCategories,
    });
    this.queryClient.invalidateQueries({ queryKey: queryKeys.links });

    if (id !== undefined) {
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.adminLinkItem(id),
      });
    }
  }
}
