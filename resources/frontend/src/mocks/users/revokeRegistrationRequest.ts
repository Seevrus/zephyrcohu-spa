import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../environments/environment";

export const revokeRegistrationRequest: RequestMatch = {
  method: "POST",
  url: `${environment.apiUrl}/users/register/revoke`,
};
