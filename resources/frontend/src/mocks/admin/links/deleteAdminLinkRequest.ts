import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../../environments/environment";

export function matchDeleteAdminLinkRequest(id: number): RequestMatch {
  return {
    method: "DELETE",
    url: `${environment.apiUrl}/admin/links/${id}`,
  };
}
