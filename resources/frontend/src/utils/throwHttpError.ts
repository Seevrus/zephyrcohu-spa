import { type HttpErrorResponse } from "@angular/common/http";

import { ZephyrHttpError } from "../api/ZephyrHttpError";
import { type ZephyrErrorData } from "../types/errors";

export function throwHttpError(error: HttpErrorResponse) {
  if (isZephyrError(error.error)) {
    throw new ZephyrHttpError(
      error.error.status,
      error.error.code,
      error.message,
    );
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
