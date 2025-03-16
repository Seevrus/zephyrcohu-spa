import {
  type HttpEvent,
  type HttpHandlerFn,
  type HttpRequest,
  HttpXsrfTokenExtractor,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { type Observable } from "rxjs";

import { environment } from "../../environments/environment";

export function xsrfInterceptor(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const tokenExtractor = inject(HttpXsrfTokenExtractor);
  const token = tokenExtractor.getToken();

  if (
    token &&
    request.method === "POST" &&
    request.url.startsWith(environment.apiUrl)
  ) {
    const requestWithHeader = request.clone({
      headers: request.headers.set("X-XSRF-TOKEN", token),
    });

    return next(requestWithHeader);
  }

  return next(request);
}
