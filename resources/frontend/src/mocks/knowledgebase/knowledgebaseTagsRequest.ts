import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../environments/environment";

export function matchKnowledgebaseTagsRequest(): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/knowledgebase/tags`,
  };
}
