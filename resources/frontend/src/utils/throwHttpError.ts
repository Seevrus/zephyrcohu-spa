import { type HttpErrorResponse } from "@angular/common/http";

import { ZephyrHttpError } from "../api/ZephyrHttpError";
import {
  type ZephyrErrorData,
  type ZephyrValidationErrorData,
} from "../types/errors";

export function throwHttpError(error: HttpErrorResponse) {
  if (isZephyrError(error.error)) {
    throw new ZephyrHttpError(
      error.error.status,
      error.error.code,
      error.message,
    );
  } else if (isZephyrValidationError(error.error)) {
    throw new ZephyrHttpError(error.status, "INVALID_REQUEST_DATA");
  }

  throw new ZephyrHttpError(
    500,
    "INTERNAL_SERVER_ERROR",
    "The server has encountered a situation it does not know how to handle.",
  );
}

function isZephyrError(error: unknown): error is ZephyrErrorData {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number" &&
    "code" in error &&
    typeof error.code === "string"
  );
}

function isZephyrValidationError(
  error: unknown,
): error is ZephyrValidationErrorData {
  return typeof error === "object" && error !== null && "errors" in error;
}
