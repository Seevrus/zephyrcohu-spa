import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../environments/environment";

export function matchMarkNewsItemAsReadRequest(id: number): RequestMatch {
  return {
    method: "POST",
    url: `${environment.apiUrl}/news/${id}/read`,
  };
}
