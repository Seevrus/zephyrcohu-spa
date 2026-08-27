import {
  type HttpEvent,
  type HttpHandlerFn,
  type HttpRequest,
  HttpXsrfTokenExtractor,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { type Observable } from "rxjs";

import { environment } from "../../environments/environment";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function xsrfInterceptor(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const tokenExtractor = inject(HttpXsrfTokenExtractor);
  const token = tokenExtractor.getToken();

  if (
    token &&
    STATE_CHANGING_METHODS.has(request.method) &&
    request.url.startsWith(environment.apiUrl)
  ) {
    const requestWithHeader = request.clone({
      headers: request.headers.set("X-XSRF-TOKEN", token),
    });

    return next(requestWithHeader);
  }

  return next(request);
}
