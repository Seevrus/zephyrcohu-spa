import type { RequestMatch } from "@angular/common/http/testing";
import { environment } from "../../environments/environment";

export const resetPasswordRequest: RequestMatch = {
  method: "POST",
  url: `${environment.apiUrl}/users/profile/reset_password`,
};
