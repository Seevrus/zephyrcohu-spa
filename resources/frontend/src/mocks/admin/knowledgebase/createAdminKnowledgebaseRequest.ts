import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../../environments/environment";

export function matchCreateAdminKnowledgebaseRequest(): RequestMatch {
  return {
    method: "POST",
    url: `${environment.apiUrl}/admin/knowledgebase`,
  };
}

export function matchUpdateAdminKnowledgebaseRequest(id: number): RequestMatch {
  return {
    method: "PUT",
    url: `${environment.apiUrl}/admin/knowledgebase/${id}`,
  };
}
