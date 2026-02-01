import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../environments/environment";

export const updateProfileConfirmEmailRequest: RequestMatch = {
  method: "POST",
  url: `${environment.apiUrl}/users/profile/update/confirm_new_email`,
};
