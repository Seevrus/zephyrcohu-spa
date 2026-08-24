import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../../environments/environment";

export function matchAdminNewsRequest(): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/admin/news`,
  };
}
