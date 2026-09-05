import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../../environments/environment";

export function matchAdminDocumentsRequest(): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/admin/documents`,
  };
}

export function matchAdminDocumentItemRequest(id: number): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/admin/documents/${id}`,
  };
}
