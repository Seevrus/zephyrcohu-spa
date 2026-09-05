import { type HttpErrorResponse } from "@angular/common/http";

import { ZephyrValidationHttpError } from "../api/ZephyrValidationHttpError";
import { throwHttpError } from "./throwHttpError";

/**
 * Like `throwHttpError`, but keeps a 422's per-field messages instead of
 * collapsing them into a bare `INVALID_REQUEST_DATA`. Use it wherever a screen
 * renders the backend's own wording; every other screen stays on
 * `throwHttpError`.
 */
export function throwValidationHttpError(error: HttpErrorResponse): void {
  const body: unknown = error.error;
  const errors =
    typeof body === "object" && body !== null && "errors" in body
      ? body.errors
      : undefined;

  if (error.status === 422 && isMessageMap(errors)) {
    throw new ZephyrValidationHttpError(error.status, errors);
  }

  throwHttpError(error);
}

function isMessageMap(errors: unknown): errors is Record<string, string[]> {
  return (
    typeof errors === "object" &&
    errors !== null &&
    Object.values(errors).every(
      (messages) =>
        Array.isArray(messages) &&
        messages.every((message) => typeof message === "string"),
    )
  );
}
