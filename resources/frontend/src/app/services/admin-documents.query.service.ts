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
  type AdminDocumentCollectionResponse,
  type AdminDocumentItem,
  type AdminDocumentItemResponse,
  type AdminDocumentResponse,
  type SaveAdminDocumentRequest,
} from "../../types/admin-documents";
import { INTEGRA_CATEGORIES } from "../../types/integra";
import { throwHttpError } from "../../utils/throwHttpError";
import { throwValidationHttpError } from "../../utils/throwValidationHttpError";
import { mutationKeys, queryKeys } from "./queryKeys";

@Service()
export class AdminDocumentsQueryService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);

  getAdminDocuments() {
    return queryOptions<AdminDocumentItem[], ZephyrHttpError>({
      queryKey: queryKeys.adminDocuments,
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<AdminDocumentCollectionResponse>(
              `${environment.apiUrl}/admin/documents`,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map((response) =>
                response.data.map(
                  AdminDocumentsQueryService.mapAdminDocumentResponse,
                ),
              ),
            ),
        ),
    });
  }

  getAdminDocument(id: number | undefined) {
    return queryOptions<AdminDocumentItem, ZephyrHttpError>({
      queryKey: queryKeys.adminDocumentItem(id),
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<AdminDocumentItemResponse>(
              `${environment.apiUrl}/admin/documents/${id}`,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map((response) =>
                AdminDocumentsQueryService.mapAdminDocumentResponse(
                  response.data,
                ),
              ),
            ),
        ),
      enabled: id !== undefined,
    });
  }

  createAdminDocument() {
    return mutationOptions<
      AdminDocumentItem,
      ZephyrHttpError,
      SaveAdminDocumentRequest
    >({
      mutationKey: mutationKeys.createAdminDocument,
      mutationFn: (request) =>
        lastValueFrom(
          this.http
            .post<AdminDocumentItemResponse>(
              `${environment.apiUrl}/admin/documents`,
              AdminDocumentsQueryService.toFormData(request),
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwValidationHttpError(error)),
              ),
              map((response) =>
                AdminDocumentsQueryService.mapAdminDocumentResponse(
                  response.data,
                ),
              ),
            ),
        ),
      onSuccess: () => {
        this.invalidateDocumentQueries();
      },
    });
  }

  updateAdminDocument() {
    return mutationOptions<
      AdminDocumentItem,
      ZephyrHttpError,
      { id: number; request: SaveAdminDocumentRequest }
    >({
      mutationKey: mutationKeys.updateAdminDocument,
      mutationFn: ({ id, request }) =>
        lastValueFrom(
          this.http
            .post<AdminDocumentItemResponse>(
              `${environment.apiUrl}/admin/documents/${id}`,
              AdminDocumentsQueryService.toFormData(request),
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwValidationHttpError(error)),
              ),
              map((response) =>
                AdminDocumentsQueryService.mapAdminDocumentResponse(
                  response.data,
                ),
              ),
            ),
        ),
      onSuccess: (_data, { id }) => {
        this.invalidateDocumentQueries(id);
      },
    });
  }

  deleteAdminDocument() {
    return mutationOptions<void, ZephyrHttpError, number>({
      mutationKey: mutationKeys.deleteAdminDocument,
      mutationFn: (id) =>
        lastValueFrom(
          this.http
            .delete<void>(`${environment.apiUrl}/admin/documents/${id}`)
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
            ),
        ),
      onSuccess: (_data, id) => {
        this.invalidateDocumentQueries(id);
      },
    });
  }

  private invalidateDocumentQueries(id?: number) {
    this.queryClient.invalidateQueries({ queryKey: queryKeys.adminDocuments });

    if (id !== undefined) {
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.adminDocumentItem(id),
      });
    }

    for (const category of INTEGRA_CATEGORIES) {
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.integra(category),
      });
    }
  }

  /**
   * The `Content-Type` header is deliberately left unset so the browser can
   * add the multipart boundary itself.
   */
  private static toFormData(request: SaveAdminDocumentRequest): FormData {
    const body = new FormData();
    body.set("category", request.category);
    body.set("displayName", request.displayName);
    body.set("version", request.version);
    body.set("publishedAt", request.publishedAt);

    if (request.file) {
      body.set("file", request.file);
    }

    return body;
  }

  private static mapAdminDocumentResponse(
    response: AdminDocumentResponse,
  ): AdminDocumentItem {
    return {
      ...response,
      publishedAt: new Date(response.publishedAt),
    };
  }
}
