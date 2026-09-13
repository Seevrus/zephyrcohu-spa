import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../../environments/environment";

export function matchAdminNewslettersRequest(): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/admin/newsletters`,
  };
}

export function matchAdminNewsletterItemRequest(id: number): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/admin/newsletters/${id}`,
  };
}
