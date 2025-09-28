import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../environments/environment";

export const resendConfirmationEmailRequest: RequestMatch = {
  method: "POST",
  url: `${environment.apiUrl}/users/register/resend_confirm_email`,
};
