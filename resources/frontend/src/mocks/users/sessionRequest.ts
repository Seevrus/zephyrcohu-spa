import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../environments/environment";

export const sessionRequest: RequestMatch = {
  method: "GET",
  url: `${environment.apiUrl}/users/session`,
};
