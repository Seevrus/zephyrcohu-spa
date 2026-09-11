import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../../environments/environment";

export function matchAdminUsersRequest(): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/admin/users`,
  };
}

export function matchUpdateAdminUserRequest(id: number): RequestMatch {
  return {
    method: "PUT",
    url: `${environment.apiUrl}/admin/users/${id}`,
  };
}

export function matchDeleteAdminUserRequest(id: number): RequestMatch {
  return {
    method: "DELETE",
    url: `${environment.apiUrl}/admin/users/${id}`,
  };
}

export function matchSendAdminUserEmailRequest(id: number): RequestMatch {
  return {
    method: "POST",
    url: `${environment.apiUrl}/admin/users/${id}/email`,
  };
}
