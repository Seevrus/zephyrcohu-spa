import { type ApiError } from "../../types/errors";

export function createGetIntegraDocumentsErrorResponse(error: ApiError) {
  if (error === "GENERIC_UNAUTHORIZED") {
    return { status: 401, code: "GENERIC_UNAUTHORIZED" };
  }

  return {
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
    message:
      "The server has encountered a situation it does not know how to handle.",
  };
}
