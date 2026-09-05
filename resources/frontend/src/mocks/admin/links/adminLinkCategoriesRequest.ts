import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../../environments/environment";

export function matchAdminLinkCategoriesRequest(): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/admin/link_categories`,
  };
}
