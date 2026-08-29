import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../../environments/environment";

export function matchDeleteAdminKnowledgebaseRequest(id: number): RequestMatch {
  return {
    method: "DELETE",
    url: `${environment.apiUrl}/admin/knowledgebase/${id}`,
  };
}
