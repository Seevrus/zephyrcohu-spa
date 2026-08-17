import { HttpClient, type HttpErrorResponse } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import {
  keepPreviousData,
  mutationOptions,
  QueryClient,
  queryOptions,
} from "@tanstack/angular-query-experimental";
import { catchError, lastValueFrom, map, throwError } from "rxjs";

import { type ZephyrHttpError } from "../../api/ZephyrHttpError";
import { environment } from "../../environments/environment";
import {
  type KnowledgebaseCollection,
  type KnowledgebaseCollectionResponse,
  type KnowledgebaseItem,
  type KnowledgebaseItemResponse,
  type Tag,
  type TagsResponse,
} from "../../types/knowledgebase";
import { throwHttpError } from "../../utils/throwHttpError";
import { mutationKeys, queryKeys } from "./queryKeys";

@Service()
export class KnowledgebaseQueryService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);

  getKnowledgebase(page: number | undefined, tag: number | undefined) {
    return queryOptions<KnowledgebaseCollection, ZephyrHttpError>({
      queryKey: queryKeys.knowledgebase(page, tag),
      queryFn: () => {
        const queryParameters = new URLSearchParams();
        if (page !== undefined) {
          queryParameters.set("page", page.toString());
        }
        if (tag !== undefined) {
          queryParameters.set("tag", tag.toString());
        }

        return lastValueFrom(
          this.http
            .get<KnowledgebaseCollectionResponse>(
              `${environment.apiUrl}/knowledgebase?${queryParameters.toString()}`,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map(this.mapKnowledgebaseResponse.bind(this)),
            ),
        );
      },
      enabled: page !== undefined,
      placeholderData: keepPreviousData,
    });
  }

  getKnowledgebaseItem(id: number | undefined) {
    return queryOptions<KnowledgebaseItem, ZephyrHttpError>({
      queryKey: queryKeys.knowledgebaseItem(id),
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<KnowledgebaseItemResponse>(
              `${environment.apiUrl}/knowledgebase/${id}`,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map(KnowledgebaseQueryService.mapKnowledgebaseItemResponse),
            ),
        ),
      enabled: id !== undefined,
    });
  }

  getKnowledgebaseTags() {
    return queryOptions<Tag[], ZephyrHttpError>({
      queryKey: queryKeys.knowledgebaseTags,
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<TagsResponse>(`${environment.apiUrl}/knowledgebase/tags`)
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map((response) => response.data as Tag[]),
            ),
        ),
    });
  }

  markKnowledgebaseItemAsRead() {
    return mutationOptions<void, ZephyrHttpError, number>({
      mutationKey: mutationKeys.markKnowledgebaseItemAsRead,
      mutationFn: (id) =>
        lastValueFrom(
          this.http
            .post<void>(`${environment.apiUrl}/knowledgebase/${id}/read`, null)
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
            ),
        ),
      onSuccess: (_data, id) => {
        this.queryClient.invalidateQueries({
          queryKey: queryKeys.knowledgebaseItem(id),
        });
        this.queryClient.invalidateQueries({
          queryKey: queryKeys.knowledgebase(),
        });
      },
    });
  }

  private mapKnowledgebaseResponse(
    response: KnowledgebaseCollectionResponse,
  ): KnowledgebaseCollection {
    return {
      ...response,
      data: response.data.map((knowledgebaseItem) => {
        const item = {
          ...knowledgebaseItem,
          publishedAt: new Date(knowledgebaseItem.publishedAt),
          createdAt: new Date(knowledgebaseItem.createdAt),
          updatedAt: new Date(knowledgebaseItem.updatedAt),
        };

        this.queryClient.setQueryData(
          queryKeys.knowledgebaseItem(item.id),
          item,
        );
        return item;
      }),
    };
  }

  private static mapKnowledgebaseItemResponse(
    response: KnowledgebaseItemResponse,
  ): KnowledgebaseItem {
    return {
      ...response.data,
      publishedAt: new Date(response.data.publishedAt),
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  }
}
