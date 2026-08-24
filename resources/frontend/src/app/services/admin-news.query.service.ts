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
  type AdminNewsCollectionResponse,
  type AdminNewsItem,
  type AdminNewsItemResponse,
  type AdminNewsResponse,
  type SaveAdminNewsRequest,
} from "../../types/admin-news";
import { throwHttpError } from "../../utils/throwHttpError";
import { mutationKeys, queryKeys } from "./queryKeys";

@Service()
export class AdminNewsQueryService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);

  getAdminNews() {
    return queryOptions<AdminNewsItem[], ZephyrHttpError>({
      queryKey: queryKeys.adminNews,
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<AdminNewsCollectionResponse>(
              `${environment.apiUrl}/admin/news`,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map(this.mapAdminNewsResponse.bind(this)),
            ),
        ),
    });
  }

  getAdminNewsItem(id: number | undefined) {
    return queryOptions<AdminNewsItem, ZephyrHttpError>({
      queryKey: queryKeys.adminNewsItem(id),
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<AdminNewsItemResponse>(
              `${environment.apiUrl}/admin/news/${id}`,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map(AdminNewsQueryService.mapAdminNewsItemResponse),
            ),
        ),
      enabled: id !== undefined,
    });
  }

  createAdminNews() {
    return mutationOptions<
      AdminNewsItem,
      ZephyrHttpError,
      SaveAdminNewsRequest
    >({
      mutationKey: mutationKeys.createAdminNews,
      mutationFn: (request) =>
        lastValueFrom(
          this.http
            .post<AdminNewsItemResponse>(
              `${environment.apiUrl}/admin/news`,
              request,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map(AdminNewsQueryService.mapAdminNewsItemResponse),
            ),
        ),
      onSuccess: () => {
        this.invalidateNewsQueries();
      },
    });
  }

  updateAdminNews() {
    return mutationOptions<
      AdminNewsItem,
      ZephyrHttpError,
      { id: number; request: SaveAdminNewsRequest }
    >({
      mutationKey: mutationKeys.updateAdminNews,
      mutationFn: ({ id, request }) =>
        lastValueFrom(
          this.http
            .put<AdminNewsItemResponse>(
              `${environment.apiUrl}/admin/news/${id}`,
              request,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map(AdminNewsQueryService.mapAdminNewsItemResponse),
            ),
        ),
      onSuccess: (_data, { id }) => {
        this.invalidateNewsQueries(id);
      },
    });
  }

  deleteAdminNews() {
    return mutationOptions<void, ZephyrHttpError, number>({
      mutationKey: mutationKeys.deleteAdminNews,
      mutationFn: (id) =>
        lastValueFrom(
          this.http
            .delete<void>(`${environment.apiUrl}/admin/news/${id}`)
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
            ),
        ),
      onSuccess: (_data, id) => {
        this.invalidateNewsQueries(id);
      },
    });
  }

  private invalidateNewsQueries(id?: number) {
    this.queryClient.invalidateQueries({ queryKey: queryKeys.adminNews });
    this.queryClient.invalidateQueries({ queryKey: queryKeys.news() });

    if (id !== undefined) {
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.adminNewsItem(id),
      });
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.newsItem(id),
      });
    }
  }

  private mapAdminNewsResponse(
    response: AdminNewsCollectionResponse,
  ): AdminNewsItem[] {
    return response.data.map((news) => {
      const item = AdminNewsQueryService.toAdminNewsItem(news);
      this.queryClient.setQueryData(queryKeys.adminNewsItem(news.id), item);
      return item;
    });
  }

  private static mapAdminNewsItemResponse(
    response: AdminNewsItemResponse,
  ): AdminNewsItem {
    return AdminNewsQueryService.toAdminNewsItem(response.data);
  }

  private static toAdminNewsItem(news: AdminNewsResponse): AdminNewsItem {
    return {
      ...news,
      publishedAt: new Date(news.publishedAt),
      createdAt: new Date(news.createdAt),
      updatedAt: new Date(news.updatedAt),
    };
  }
}
