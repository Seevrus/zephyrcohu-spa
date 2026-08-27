import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../../environments/environment";

export function matchCreateAdminNewsRequest(): RequestMatch {
  return {
    method: "POST",
    url: `${environment.apiUrl}/admin/news`,
  };
}

export function matchUpdateAdminNewsRequest(id: number): RequestMatch {
  return {
    method: "PUT",
    url: `${environment.apiUrl}/admin/news/${id}`,
  };
}
