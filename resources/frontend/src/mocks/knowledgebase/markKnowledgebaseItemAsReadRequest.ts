import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../environments/environment";

export function matchMarkKnowledgebaseItemAsReadRequest(
  id: number,
): RequestMatch {
  return {
    method: "POST",
    url: `${environment.apiUrl}/knowledgebase/${id}/read`,
  };
}
