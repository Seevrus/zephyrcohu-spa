import type { RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../environments/environment";

export const checkCaptchaTokenRequest: RequestMatch = {
  method: "POST",
  url: `${environment.apiUrl}/captcha`,
};
