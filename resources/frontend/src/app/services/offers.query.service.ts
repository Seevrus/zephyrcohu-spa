import { HttpClient, type HttpErrorResponse } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import {
  keepPreviousData,
  QueryClient,
  queryOptions,
} from "@tanstack/angular-query-experimental";
import { catchError, lastValueFrom, map, throwError } from "rxjs";

import { type ZephyrHttpError } from "../../api/ZephyrHttpError";
import { environment } from "../../environments/environment";
import {
  type OfferCollection,
  type OfferCollectionResponse,
  type OfferItem,
  type OfferItemResponse,
} from "../../types/offers";
import { throwHttpError } from "../../utils/throwHttpError";
import { queryKeys } from "./queryKeys";

@Service()
export class OffersQueryService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);

  getOffers(page: number | undefined) {
    return queryOptions<OfferCollection, ZephyrHttpError>({
      queryKey: queryKeys.offers(page),
      queryFn: () => {
        const queryParameters = new URLSearchParams();
        if (page !== undefined) {
          queryParameters.set("page", page.toString());
        }

        return lastValueFrom(
          this.http
            .get<OfferCollectionResponse>(
              `${environment.apiUrl}/offers?${queryParameters.toString()}`,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map(this.mapOffersResponse.bind(this)),
            ),
        );
      },
      enabled: page !== undefined,
      placeholderData: keepPreviousData,
    });
  }

  getOfferItem(id: number | undefined) {
    return queryOptions<OfferItem, ZephyrHttpError>({
      queryKey: queryKeys.offerItem(id),
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<OfferItemResponse>(`${environment.apiUrl}/offers/${id}`)
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map(OffersQueryService.mapOfferItemResponse),
            ),
        ),
      enabled: id !== undefined,
    });
  }

  private mapOffersResponse(
    response: OfferCollectionResponse,
  ): OfferCollection {
    return {
      ...response,
      data: response.data.map((offer) => {
        const offerItem = {
          ...offer,
          createdAt: new Date(offer.createdAt),
          updatedAt: new Date(offer.updatedAt),
        };

        this.queryClient.setQueryData(queryKeys.offerItem(offer.id), offerItem);
        return offerItem;
      }),
    };
  }

  private static mapOfferItemResponse(response: OfferItemResponse): OfferItem {
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  }
}
