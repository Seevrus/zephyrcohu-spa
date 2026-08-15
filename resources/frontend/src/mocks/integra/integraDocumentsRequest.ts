import { type RequestMatch } from "@angular/common/http/testing";

import { environment } from "../../environments/environment";
import { type IntegraCategory } from "../../types/integra";

export function matchIntegraDocumentsRequest(
  category: IntegraCategory,
): RequestMatch {
  return {
    method: "GET",
    url: `${environment.apiUrl}/documents/integra/${category}`,
  };
}
