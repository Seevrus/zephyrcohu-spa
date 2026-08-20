import { HttpClient, type HttpErrorResponse } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { queryOptions } from "@tanstack/angular-query-experimental";
import { catchError, lastValueFrom, map, throwError } from "rxjs";

import { type ZephyrHttpError } from "../../api/ZephyrHttpError";
import { environment } from "../../environments/environment";
import {
  type LinkResponse,
  type LinksCollectionResponse,
} from "../../types/links";
import { throwHttpError } from "../../utils/throwHttpError";
import { queryKeys } from "./queryKeys";

@Service()
export class LinksQueryService {
  private readonly http = inject(HttpClient);

  getLinks() {
    return queryOptions<LinkResponse[], ZephyrHttpError>({
      queryKey: queryKeys.links,
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<LinksCollectionResponse>(
              `${environment.apiUrl}/knowledgebase/links`,
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
}
