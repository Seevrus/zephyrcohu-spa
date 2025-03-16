import {
  type HttpEvent,
  type HttpHandlerFn,
  type HttpRequest,
} from "@angular/common/http";
import { type Observable } from "rxjs";

export function credentialsInterceptor(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const requestWithCredentials = request.clone({
    withCredentials: true,
  });

  return next(requestWithCredentials);
}
