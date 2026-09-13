import { HttpClient, type HttpErrorResponse } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { queryOptions } from "@tanstack/angular-query-experimental";
import { catchError, lastValueFrom, map, throwError } from "rxjs";

import { type ZephyrHttpError } from "../../api/ZephyrHttpError";
import { environment } from "../../environments/environment";
import {
  type AdminNewsletterCollectionItem,
  type AdminNewsletterCollectionResponse,
  type AdminNewsletterCollectionResponseItem,
  type AdminNewsletterItem,
  type AdminNewsletterItemResponse,
  type AdminNewsletterResponseItem,
} from "../../types/admin-newsletters";
import { throwHttpError } from "../../utils/throwHttpError";
import { queryKeys } from "./queryKeys";

@Service()
export class AdminNewslettersQueryService {
  private readonly http = inject(HttpClient);

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
