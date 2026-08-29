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
  type AdminKnowledgebaseCollectionResponse,
  type AdminKnowledgebaseItem,
  type AdminKnowledgebaseItemResponse,
  type AdminKnowledgebaseResponse,
  type SaveAdminKnowledgebaseRequest,
} from "../../types/admin-knowledgebase";
import { throwHttpError } from "../../utils/throwHttpError";
import { mutationKeys, queryKeys } from "./queryKeys";

@Service()
export class AdminKnowledgebaseQueryService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);

  getAdminKnowledgebase() {
    return queryOptions<AdminKnowledgebaseItem[], ZephyrHttpError>({
      queryKey: queryKeys.adminKnowledgebase,
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<AdminKnowledgebaseCollectionResponse>(
              `${environment.apiUrl}/admin/knowledgebase`,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map(this.mapAdminKnowledgebaseResponse.bind(this)),
            ),
        ),
    });
  }

  getAdminKnowledgebaseItem(id: number | undefined) {
    return queryOptions<AdminKnowledgebaseItem, ZephyrHttpError>({
      queryKey: queryKeys.adminKnowledgebaseItem(id),
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<AdminKnowledgebaseItemResponse>(
              `${environment.apiUrl}/admin/knowledgebase/${id}`,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map(
                AdminKnowledgebaseQueryService.mapAdminKnowledgebaseItemResponse,
              ),
            ),
        ),
      enabled: id !== undefined,
    });
  }

  createAdminKnowledgebase() {
    return mutationOptions<
      AdminKnowledgebaseItem,
      ZephyrHttpError,
      SaveAdminKnowledgebaseRequest
    >({
      mutationKey: mutationKeys.createAdminKnowledgebase,
      mutationFn: (request) =>
        lastValueFrom(
          this.http
            .post<AdminKnowledgebaseItemResponse>(
              `${environment.apiUrl}/admin/knowledgebase`,
              request,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map(
                AdminKnowledgebaseQueryService.mapAdminKnowledgebaseItemResponse,
              ),
            ),
        ),
      onSuccess: () => {
        this.invalidateKnowledgebaseQueries();
      },
    });
  }

  updateAdminKnowledgebase() {
    return mutationOptions<
      AdminKnowledgebaseItem,
      ZephyrHttpError,
      { id: number; request: SaveAdminKnowledgebaseRequest }
    >({
      mutationKey: mutationKeys.updateAdminKnowledgebase,
      mutationFn: ({ id, request }) =>
        lastValueFrom(
          this.http
            .put<AdminKnowledgebaseItemResponse>(
              `${environment.apiUrl}/admin/knowledgebase/${id}`,
              request,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map(
                AdminKnowledgebaseQueryService.mapAdminKnowledgebaseItemResponse,
              ),
            ),
        ),
      onSuccess: (_data, { id }) => {
        this.invalidateKnowledgebaseQueries(id);
      },
    });
  }

  deleteAdminKnowledgebase() {
    return mutationOptions<void, ZephyrHttpError, number>({
      mutationKey: mutationKeys.deleteAdminKnowledgebase,
      mutationFn: (id) =>
        lastValueFrom(
          this.http
            .delete<void>(`${environment.apiUrl}/admin/knowledgebase/${id}`)
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
            ),
        ),
      onSuccess: (_data, id) => {
        this.invalidateKnowledgebaseQueries(id);
      },
    });
  }

  private invalidateKnowledgebaseQueries(id?: number) {
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.adminKnowledgebase,
    });
    this.queryClient.invalidateQueries({ queryKey: queryKeys.knowledgebase() });
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.knowledgebaseTags,
    });

    if (id !== undefined) {
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.adminKnowledgebaseItem(id),
      });
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.knowledgebaseItem(id),
      });
    }
  }

  private mapAdminKnowledgebaseResponse(
    response: AdminKnowledgebaseCollectionResponse,
  ): AdminKnowledgebaseItem[] {
    return response.data.map((item) => {
      const mapped =
        AdminKnowledgebaseQueryService.toAdminKnowledgebaseItem(item);
      this.queryClient.setQueryData(
        queryKeys.adminKnowledgebaseItem(item.id),
        mapped,
      );
      return mapped;
    });
  }

  private static mapAdminKnowledgebaseItemResponse(
    response: AdminKnowledgebaseItemResponse,
  ): AdminKnowledgebaseItem {
    return AdminKnowledgebaseQueryService.toAdminKnowledgebaseItem(
      response.data,
    );
  }

  private static toAdminKnowledgebaseItem(
    item: AdminKnowledgebaseResponse,
  ): AdminKnowledgebaseItem {
    return {
      ...item,
      publishedAt: new Date(item.publishedAt),
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    };
  }
}
