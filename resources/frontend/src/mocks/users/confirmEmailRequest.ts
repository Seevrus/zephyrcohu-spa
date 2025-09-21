import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../environments/environment";

export const confirmEmailRequest: RequestMatch = {
  method: "POST",
  url: `${environment.apiUrl}/users/register/confirm_email`,
};
