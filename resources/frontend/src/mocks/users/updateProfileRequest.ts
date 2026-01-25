import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../environments/environment";

export const updateProfileRequest: RequestMatch = {
  method: "POST",
  url: `${environment.apiUrl}/users/profile/update`,
};
