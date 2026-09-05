import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../../environments/environment";

export function matchDeleteAdminDocumentRequest(id: number): RequestMatch {
  return {
    method: "DELETE",
    url: `${environment.apiUrl}/admin/documents/${id}`,
  };
}
