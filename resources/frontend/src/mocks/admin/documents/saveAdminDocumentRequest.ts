import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../../environments/environment";

export function matchCreateAdminDocumentRequest(): RequestMatch {
  return {
    method: "POST",
    url: `${environment.apiUrl}/admin/documents`,
  };
}

export function matchUpdateAdminDocumentRequest(id: number): RequestMatch {
  return {
    method: "POST",
    url: `${environment.apiUrl}/admin/documents/${id}`,
  };
}
