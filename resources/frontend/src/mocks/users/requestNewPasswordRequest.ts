import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../environments/environment";

export const requestNewPasswordRequest: RequestMatch = {
  method: "POST",
  url: `${environment.apiUrl}/users/profile/request_new_password`,
};
