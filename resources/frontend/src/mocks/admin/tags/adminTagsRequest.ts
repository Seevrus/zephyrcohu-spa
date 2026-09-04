import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../../environments/environment";

export function matchAdminTagsRequest(): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/admin/tags`,
  };
}
