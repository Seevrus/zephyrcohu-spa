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
  type AdminTagCollectionResponse,
  type AdminTagItemResponse,
  type AdminTagResponse,
  type SaveAdminTagRequest,
} from "../../types/admin-tags";
import { throwHttpError } from "../../utils/throwHttpError";
import { mutationKeys, queryKeys } from "./queryKeys";

@Service()
export class AdminTagsQueryService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);

  getAdminTags() {
    return queryOptions<AdminTagResponse[], ZephyrHttpError>({
      queryKey: queryKeys.adminTags,
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<AdminTagCollectionResponse>(`${environment.apiUrl}/admin/tags`)
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map((response) => response.data),
            ),
        ),
    });
  }

  updateAdminTag() {
    return mutationOptions<
      AdminTagResponse,
      ZephyrHttpError,
      { id: number; request: SaveAdminTagRequest }
    >({
      mutationKey: mutationKeys.updateAdminTag,
      mutationFn: ({ id, request }) =>
        lastValueFrom(
          this.http
            .put<AdminTagItemResponse>(
              `${environment.apiUrl}/admin/tags/${id}`,
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
        this.invalidateTagQueries();
      },
    });
  }

  deleteAdminTag() {
    return mutationOptions<void, ZephyrHttpError, number>({
      mutationKey: mutationKeys.deleteAdminTag,
      mutationFn: (id) =>
        lastValueFrom(
          this.http
            .delete<void>(`${environment.apiUrl}/admin/tags/${id}`)
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
            ),
        ),
      onSuccess: () => {
        this.invalidateTagQueries();
      },
    });
  }

  private invalidateTagQueries() {
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.adminKnowledgebase,
    });
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.adminKnowledgebaseItem(),
    });
    this.queryClient.invalidateQueries({ queryKey: queryKeys.adminTags });

    this.queryClient.invalidateQueries({ queryKey: queryKeys.knowledgebase() });
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.knowledgebaseTags,
    });
  }
}
