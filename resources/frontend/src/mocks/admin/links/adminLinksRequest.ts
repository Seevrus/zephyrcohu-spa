import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../../environments/environment";

export function matchAdminLinksRequest(): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/admin/links`,
  };
}

export function matchAdminLinkItemRequest(id: number): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/admin/links/${id}`,
  };
}
