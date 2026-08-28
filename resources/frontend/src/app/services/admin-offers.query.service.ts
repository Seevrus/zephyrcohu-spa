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
  type AdminOfferCollectionResponse,
  type AdminOfferItem,
  type AdminOfferItemResponse,
  type AdminOfferResponse,
  type SaveAdminOfferRequest,
} from "../../types/admin-offers";
import { throwHttpError } from "../../utils/throwHttpError";
import { mutationKeys, queryKeys } from "./queryKeys";

@Service()
export class AdminOffersQueryService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);

  getAdminOffers() {
    return queryOptions<AdminOfferItem[], ZephyrHttpError>({
      queryKey: queryKeys.adminOffers,
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<AdminOfferCollectionResponse>(
              `${environment.apiUrl}/admin/offers`,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map(this.mapAdminOffersResponse.bind(this)),
            ),
        ),
    });
  }

  getAdminOfferItem(id: number | undefined) {
    return queryOptions<AdminOfferItem, ZephyrHttpError>({
      queryKey: queryKeys.adminOfferItem(id),
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<AdminOfferItemResponse>(
              `${environment.apiUrl}/admin/offers/${id}`,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map(AdminOffersQueryService.mapAdminOfferItemResponse),
            ),
        ),
      enabled: id !== undefined,
    });
  }

  createAdminOffer() {
    return mutationOptions<
      AdminOfferItem,
      ZephyrHttpError,
      SaveAdminOfferRequest
    >({
      mutationKey: mutationKeys.createAdminOffer,
      mutationFn: (request) =>
        lastValueFrom(
          this.http
            .post<AdminOfferItemResponse>(
              `${environment.apiUrl}/admin/offers`,
              request,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map(AdminOffersQueryService.mapAdminOfferItemResponse),
            ),
        ),
      onSuccess: () => {
        this.invalidateOfferQueries();
      },
    });
  }

  updateAdminOffer() {
    return mutationOptions<
      AdminOfferItem,
      ZephyrHttpError,
      { id: number; request: SaveAdminOfferRequest }
    >({
      mutationKey: mutationKeys.updateAdminOffer,
      mutationFn: ({ id, request }) =>
        lastValueFrom(
          this.http
            .put<AdminOfferItemResponse>(
              `${environment.apiUrl}/admin/offers/${id}`,
              request,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map(AdminOffersQueryService.mapAdminOfferItemResponse),
            ),
        ),
      onSuccess: (_data, { id }) => {
        this.invalidateOfferQueries(id);
      },
    });
  }

  deleteAdminOffer() {
    return mutationOptions<void, ZephyrHttpError, number>({
      mutationKey: mutationKeys.deleteAdminOffer,
      mutationFn: (id) =>
        lastValueFrom(
          this.http
            .delete<void>(`${environment.apiUrl}/admin/offers/${id}`)
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
            ),
        ),
      onSuccess: (_data, id) => {
        this.invalidateOfferQueries(id);
      },
    });
  }

  private invalidateOfferQueries(id?: number) {
    this.queryClient.invalidateQueries({ queryKey: queryKeys.adminOffers });
    this.queryClient.invalidateQueries({ queryKey: queryKeys.offers() });

    if (id !== undefined) {
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.adminOfferItem(id),
      });
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.offerItem(id),
      });
    }
  }

  private mapAdminOffersResponse(
    response: AdminOfferCollectionResponse,
  ): AdminOfferItem[] {
    return response.data.map((offer) => {
      const item = AdminOffersQueryService.toAdminOfferItem(offer);
      this.queryClient.setQueryData(queryKeys.adminOfferItem(offer.id), item);
      return item;
    });
  }

  private static mapAdminOfferItemResponse(
    response: AdminOfferItemResponse,
  ): AdminOfferItem {
    return AdminOffersQueryService.toAdminOfferItem(response.data);
  }

  private static toAdminOfferItem(offer: AdminOfferResponse): AdminOfferItem {
    return {
      ...offer,
      publishedAt: new Date(offer.publishedAt),
      createdAt: new Date(offer.createdAt),
      updatedAt: new Date(offer.updatedAt),
    };
  }
}
