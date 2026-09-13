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
  type AdminNewsletterCollectionItem,
  type AdminNewsletterCollectionResponse,
  type AdminNewsletterCollectionResponseItem,
  type AdminNewsletterItem,
  type AdminNewsletterItemResponse,
  type AdminNewsletterRecipient,
  type AdminNewsletterRecipientCollectionResponse,
  type AdminNewsletterResponseItem,
  type SaveAdminNewsletterRequest,
} from "../../types/admin-newsletters";
import { throwHttpError } from "../../utils/throwHttpError";
import { mutationKeys, queryKeys } from "./queryKeys";

@Service()
export class AdminNewslettersQueryService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);

  getAdminNewsletters() {
    return queryOptions<AdminNewsletterCollectionItem[], ZephyrHttpError>({
      queryKey: queryKeys.adminNewsletters,
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<AdminNewsletterCollectionResponse>(
              `${environment.apiUrl}/admin/newsletters`,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map((response) =>
                response.data.map(
                  AdminNewslettersQueryService.toAdminNewsletter,
                ),
              ),
            ),
        ),
    });
  }

  getAdminNewsletter(id: number | undefined) {
    return queryOptions<AdminNewsletterItem, ZephyrHttpError>({
      queryKey: queryKeys.adminNewsletterItem(id),
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<AdminNewsletterItemResponse>(
              `${environment.apiUrl}/admin/newsletters/${id}`,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map((response) =>
                AdminNewslettersQueryService.toAdminNewsletter(response.data),
              ),
            ),
        ),
      enabled: id !== undefined,
    });
  }

  getAdminNewsletterRecipients(id: number | undefined) {
    return queryOptions<AdminNewsletterRecipient[], ZephyrHttpError>({
      queryKey: queryKeys.adminNewsletterRecipients(id),
      queryFn: () =>
        lastValueFrom(
          this.http
            .get<AdminNewsletterRecipientCollectionResponse>(
              `${environment.apiUrl}/admin/newsletters/${id}/recipients`,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map((response) => response.data),
            ),
        ),
      enabled: id !== undefined,
      staleTime: 0,
    });
  }

  createAdminNewsletter() {
    return mutationOptions<
      AdminNewsletterItem,
      ZephyrHttpError,
      SaveAdminNewsletterRequest
    >({
      mutationKey: mutationKeys.createAdminNewsletter,
      mutationFn: (request) =>
        lastValueFrom(
          this.http
            .post<AdminNewsletterItemResponse>(
              `${environment.apiUrl}/admin/newsletters`,
              request,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
              map((response) =>
                AdminNewslettersQueryService.toAdminNewsletter(response.data),
              ),
            ),
        ),
      onSuccess: () => {
        this.queryClient.invalidateQueries({
          queryKey: queryKeys.adminNewsletters,
        });
      },
    });
  }

  sendNewsletterToRecipient() {
    return mutationOptions<
      void,
      ZephyrHttpError,
      { newsletterId: number; userId: number }
    >({
      mutationKey: mutationKeys.sendNewsletterToRecipient,
      mutationFn: ({ newsletterId, userId }) =>
        lastValueFrom(
          this.http
            .post<void>(
              `${environment.apiUrl}/admin/newsletters/${newsletterId}/recipients/${userId}`,
              null,
            )
            .pipe(
              catchError((error: HttpErrorResponse) =>
                throwError(() => throwHttpError(error)),
              ),
            ),
        ),
      retry: false,
    });
  }

  private static toAdminNewsletter<
    I extends
      AdminNewsletterCollectionResponseItem | AdminNewsletterResponseItem,
  >(newsletter: I): Omit<I, "createdAt"> & { createdAt: Date } {
    return {
      ...newsletter,
      createdAt: new Date(newsletter.createdAt),
    };
  }
}
