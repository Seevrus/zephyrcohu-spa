import { HttpClient, type HttpErrorResponse } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { queryOptions } from "@tanstack/angular-query-experimental";
import { catchError, lastValueFrom, map, throwError } from "rxjs";

import { type ZephyrHttpError } from "../../api/ZephyrHttpError";
import { environment } from "../../environments/environment";
import {
  type IntegraCategory,
  type IntegraCollection,
  type IntegraCollectionResponse,
} from "../../types/integra";
import { throwHttpError } from "../../utils/throwHttpError";
import { queryKeys } from "./queryKeys";

@Service()
export class IntegraQueryService {
  private readonly http = inject(HttpClient);

  getIntegraDocuments(category: IntegraCategory | undefined) {
    return queryOptions<IntegraCollection, ZephyrHttpError>({
      queryKey: queryKeys.integra(category),
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<IntegraCollectionResponse>(
              `${environment.apiUrl}/documents/integra/${category}`,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map(IntegraQueryService.mapDocumentsResponse),
            ),
        ),
      enabled: category !== undefined,
    });
  }

  private static mapDocumentsResponse(
    response: IntegraCollectionResponse,
  ): IntegraCollection {
    return {
      data: response.data.map((document) => ({
        ...document,
        publishedAt: new Date(document.publishedAt),
      })),
    };
  }
}
