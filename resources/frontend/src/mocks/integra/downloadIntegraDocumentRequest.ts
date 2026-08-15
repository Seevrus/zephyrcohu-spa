import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../environments/environment";

export function matchDownloadIntegraDocumentRequest(
  documentId: number,
): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/documents/integra/${documentId}/download`,
  };
}
