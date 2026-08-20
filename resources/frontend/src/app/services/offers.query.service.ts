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
import { type RequestOfferRequest } from "../../types/offerRequest";
import {
  type OfferCollection,
  type OfferCollectionResponse,
  type OfferItem,
  type OfferItemResponse,
} from "../../types/offers";
import { throwHttpError } from "../../utils/throwHttpError";
import { mutationKeys, queryKeys } from "./queryKeys";

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

  requestOffer() {
    return mutationOptions<undefined, ZephyrHttpError, RequestOfferRequest>({
      mutationKey: mutationKeys.requestOffer,
      mutationFn: (request) =>
        lastValueFrom(
          this.http
            .post<undefined>(`${environment.apiUrl}/offers/request`, request)
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
            ),
        ),
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
          publishedAt: new Date(offer.publishedAt),
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
      publishedAt: new Date(response.data.publishedAt),
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  }
}
