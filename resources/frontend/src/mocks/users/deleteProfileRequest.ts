import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../environments/environment";

export const deleteProfileRequest: RequestMatch = {
  method: "DELETE",
  url: `${environment.apiUrl}/users/profile`,
};
