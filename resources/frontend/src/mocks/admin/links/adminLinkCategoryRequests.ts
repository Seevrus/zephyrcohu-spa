import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../../environments/environment";

export function matchUpdateAdminLinkCategoryRequest(id: number): RequestMatch {
  return {
    method: "PUT",
    url: `${environment.apiUrl}/admin/link_categories/${id}`,
  };
}

export function matchDeleteAdminLinkCategoryRequest(id: number): RequestMatch {
  return {
    method: "DELETE",
    url: `${environment.apiUrl}/admin/link_categories/${id}`,
  };
}
