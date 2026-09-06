import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../../environments/environment";

export function matchAdminUsersRequest(): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/admin/users`,
  };
}
