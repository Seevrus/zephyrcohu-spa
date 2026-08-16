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
  type NewsCollection,
  type NewsCollectionResponse,
  type NewsItem,
  type NewsItemResponse,
} from "../../types/news";
import { throwHttpError } from "../../utils/throwHttpError";
import { mutationKeys, queryKeys } from "./queryKeys";

@Service()
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

  markNewsItemAsRead() {
    return mutationOptions<void, ZephyrHttpError, number>({
      mutationKey: mutationKeys.markNewsItemAsRead,
      mutationFn: (id) =>
        lastValueFrom(
          this.http
            .post<void>(`${environment.apiUrl}/news/${id}/read`, null)
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
            ),
        ),
      onSuccess: (_data, id) => {
        this.queryClient.invalidateQueries({
          queryKey: queryKeys.newsItem(id),
        });
        this.queryClient.invalidateQueries({
          queryKey: queryKeys.news(),
        });
      },
    });
  }

  private mapNewsResponse(response: NewsCollectionResponse): NewsCollection {
    return {
      ...response,
      data: response.data.map((news) => {
        const newsItem = {
          ...news,
          publishedAt: new Date(news.publishedAt),
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
      publishedAt: new Date(response.data.publishedAt),
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  }
}
