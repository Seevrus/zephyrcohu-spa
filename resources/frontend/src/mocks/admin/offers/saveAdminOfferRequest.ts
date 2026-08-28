import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../../environments/environment";

export function matchCreateAdminOfferRequest(): RequestMatch {
  return {
    method: "POST",
    url: `${environment.apiUrl}/admin/offers`,
  };
}

export function matchUpdateAdminOfferRequest(id: number): RequestMatch {
  return {
    method: "PUT",
    url: `${environment.apiUrl}/admin/offers/${id}`,
  };
}
