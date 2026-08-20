import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../environments/environment";

export const requestOfferRequest: RequestMatch = {
  method: "POST",
  url: `${environment.apiUrl}/offers/request`,
};
