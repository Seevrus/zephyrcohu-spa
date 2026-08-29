import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../../environments/environment";

export function matchAdminKnowledgebaseRequest(): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/admin/knowledgebase`,
  };
}

export function matchAdminKnowledgebaseItemRequest(id: number): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/admin/knowledgebase/${id}`,
  };
}
