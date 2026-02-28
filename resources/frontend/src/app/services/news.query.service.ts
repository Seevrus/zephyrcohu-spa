import { HttpClient, type HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import {
  injectQuery,
  queryOptions,
} from "@tanstack/angular-query-experimental";
import { catchError, lastValueFrom, map, throwError } from "rxjs";

import { type ZephyrHttpError } from "../../api/ZephyrHttpError";
import { environment } from "../../environments/environment";
import {
  type NewsCollection,
  type NewsCollectionResponse,
} from "../../types/news";
import { throwHttpError } from "../../utils/throwHttpError";
import { queryKeys } from "./queryKeys";
import { UsersQueryService } from "./users.query.service";

@Injectable({
  providedIn: "root",
})
export class NewsQueryService {
  private readonly http = inject(HttpClient);

  getNews(page: number | undefined) {
    return queryOptions<NewsCollection, ZephyrHttpError>({
      queryKey: queryKeys.news(page),
      queryFn: () => {
        const queryParameters = new URLSearchParams();
        if (page !== undefined) {
          queryParameters.set("page", page.toString());
        }

        return lastValueFrom(
          this.http
            .get<NewsCollectionResponse>(
              `${environment.apiUrl}/news?${queryParameters.toString()}`,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map(NewsQueryService.mapNewsResponse),
            ),
        );
      },
      enabled: page !== undefined,
    });
  }

  private static mapNewsResponse(
    response: NewsCollectionResponse,
  ): NewsCollection {
    return {
      ...response,
      data: response.data.map((news) => ({
        ...news,
        createdAt: new Date(news.createdAt),
        updatedAt: new Date(news.updatedAt),
      })),
    };
  }
}
