import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../environments/environment";

export function matchNewsItemRequest(id: number): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/news/${id}`,
  };
}
