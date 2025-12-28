import type { ApiError } from "../../types/errors";

export function createPostResendConfirmEmailErrorResponse(error: ApiError) {
  if (error === "EMAIL_NOT_FOUND") {
    return { status: 404, code: "EMAIL_NOT_FOUND" };
  } else {
    return {
      status: 500,
      code: "INTERNAL_SERVER_ERROR",
      message:
        "The server has encountered a situation it does not know how to handle.",
    };
  }
}
