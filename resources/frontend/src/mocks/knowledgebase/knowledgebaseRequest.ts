import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../environments/environment";

export function matchKnowledgebaseRequest(
  page: number,
  tag?: number,
): RequestMatch {
  const queryParameters = new URLSearchParams();
  queryParameters.set("page", page.toString());
  if (tag !== undefined) {
    queryParameters.set("tag", tag.toString());
  }

  return {
    method: "GET",
    url: `${environment.apiUrl}/knowledgebase?${queryParameters.toString()}`,
  };
}
