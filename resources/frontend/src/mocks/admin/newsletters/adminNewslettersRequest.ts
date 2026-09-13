import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../../environments/environment";

export function matchAdminNewslettersRequest(): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/admin/newsletters`,
  };
}

export function matchAdminNewsletterItemRequest(id: number): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/admin/newsletters/${id}`,
  };
}

export function matchAdminNewsletterRecipientsRequest(
  id: number,
): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/admin/newsletters/${id}/recipients`,
  };
}

export function matchCreateAdminNewsletterRequest(): RequestMatch {
  return {
    method: "POST",
    url: `${environment.apiUrl}/admin/newsletters`,
  };
}

export function matchSendNewsletterToRecipientRequest(
  id: number,
  userId: number,
): RequestMatch {
  return {
    method: "POST",
    url: `${environment.apiUrl}/admin/newsletters/${id}/recipients/${userId}`,
  };
}
