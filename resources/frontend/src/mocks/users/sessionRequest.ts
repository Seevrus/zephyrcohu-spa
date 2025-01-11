import { environment } from "../../environments/environment";

export const sessionRequest = {
  method: "GET",
  url: `${environment.apiUrl}/users/session`,
};
