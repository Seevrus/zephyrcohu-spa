import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../../environments/environment";

export function matchAdminOffersRequest(): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/admin/offers`,
  };
}

export function matchAdminOfferItemRequest(id: number): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/admin/offers/${id}`,
  };
}
