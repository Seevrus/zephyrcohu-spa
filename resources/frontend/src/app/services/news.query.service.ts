import { HttpClient, type HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import {
  keepPreviousData,
  QueryClient,
  queryOptions,
} from "@tanstack/angular-query-experimental";
import { catchError, lastValueFrom, map, throwError } from "rxjs";

import { type ZephyrHttpError } from "../../api/ZephyrHttpError";
import { environment } from "../../environments/environment";
import {
  type NewsCollection,
  type NewsCollectionResponse,
  type NewsItem,
  type NewsItemResponse,
} from "../../types/news";
import { throwHttpError } from "../../utils/throwHttpError";
import { queryKeys } from "./queryKeys";

@Injectable({
  providedIn: "root",
})
export class NewsQueryService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);

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
              map(this.mapNewsResponse.bind(this)),
            ),
        );
      },
      enabled: page !== undefined,
      placeholderData: keepPreviousData,
    });
  }

  getNewsItem(id: number | undefined) {
    return queryOptions<NewsItem, ZephyrHttpError>({
      queryKey: queryKeys.newsItem(id),
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<NewsItemResponse>(`${environment.apiUrl}/news/${id}`)
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map(NewsQueryService.mapNewsItemResponse),
            ),
        ),
      enabled: id !== undefined,
    });
  }

  private mapNewsResponse(response: NewsCollectionResponse): NewsCollection {
    return {
      ...response,
      data: response.data.map((news) => {
        const newsItem = {
          ...news,
          createdAt: new Date(news.createdAt),
          updatedAt: new Date(news.updatedAt),
        };

        this.queryClient.setQueryData(queryKeys.newsItem(news.id), newsItem);
        return newsItem;
      }),
    };
  }

  private static mapNewsItemResponse(response: NewsItemResponse): NewsItem {
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  }
}
