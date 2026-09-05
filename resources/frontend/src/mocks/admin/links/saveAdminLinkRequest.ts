import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../../environments/environment";

export function matchCreateAdminLinkRequest(): RequestMatch {
  return {
    method: "POST",
    url: `${environment.apiUrl}/admin/links`,
  };
}

export function matchUpdateAdminLinkRequest(id: number): RequestMatch {
  return {
    method: "PUT",
    url: `${environment.apiUrl}/admin/links/${id}`,
  };
}
