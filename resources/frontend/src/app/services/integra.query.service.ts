import {
  HttpClient,
  type HttpErrorResponse,
  type HttpResponse,
} from "@angular/common/http";
import { inject, Service } from "@angular/core";
import {
  mutationOptions,
  queryOptions,
} from "@tanstack/angular-query-experimental";
import { catchError, lastValueFrom, map, throwError } from "rxjs";

import { type ZephyrHttpError } from "../../api/ZephyrHttpError";
import { environment } from "../../environments/environment";
import {
  type IntegraCategory,
  type IntegraCollection,
  type IntegraCollectionResponse,
} from "../../types/integra";
import { throwHttpError } from "../../utils/throwHttpError";
import { mutationKeys, queryKeys } from "./queryKeys";

@Service()
export class IntegraQueryService {
  private readonly http = inject(HttpClient);

  downloadIntegraDocument() {
    return mutationOptions<void, ZephyrHttpError, number>({
      mutationKey: mutationKeys.downloadIntegraDocument,
      mutationFn: (documentId) =>
        lastValueFrom(
          this.http
            .get(
              `${environment.apiUrl}/documents/integra/${documentId}/download`,
              {
                observe: "response",
                responseType: "blob",
              },
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map(IntegraQueryService.saveDownloadedDocument),
            ),
        ),
    });
  }

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
      retry(failureCount, error) {
        if (error.code === "GENERIC_UNAUTHORIZED") {
          return false;
        }

        return failureCount < 3;
      },
    });
  }

  private static extractFilename(
    response: HttpResponse<Blob>,
  ): string | undefined {
    const disposition = response.headers.get("Content-Disposition");
    const match = disposition ? /filename="?([^"]+)"?/.exec(disposition) : null;

    return match?.[1];
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

  private static saveDownloadedDocument(response: HttpResponse<Blob>): void {
    if (!response.body) {
      return;
    }

    const url = URL.createObjectURL(response.body);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download =
      IntegraQueryService.extractFilename(response) ?? "document";
    anchor.click();
    URL.revokeObjectURL(url);
    anchor.remove();
  }
}
