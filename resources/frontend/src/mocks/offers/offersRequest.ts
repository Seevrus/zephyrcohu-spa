import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../environments/environment";

export function matchOffersRequest(page: number): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/offers?page=${page}`,
  };
}
