import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../environments/environment";

export function matchNewsRequest(page: number): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/news?page=${page}`,
  };
}
