import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../environments/environment";

export const loginRequest: RequestMatch = {
  method: "POST",
  url: `${environment.apiUrl}/users/login`,
};
