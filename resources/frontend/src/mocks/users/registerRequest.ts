import { RequestMatch } from "@angular/common/http/testing";
import { environment } from "../../environments/environment";

export const registerRequest: RequestMatch = {
  method: "POST",
  url: `${environment.apiUrl}/users/register`,
};
