import { type ApiError } from "../../types/errors";

export function createGetNewsItemErrorResponse(error: ApiError) {
  switch (error) {
    case "GENERIC_NOT_FOUND": {
      return { status: 404, code: "GENERIC_NOT_FOUND" };
    }
    case "GENERIC_UNAUTHORIZED": {
      return { status: 401, code: "GENERIC_UNAUTHORIZED" };
    }
    default: {
      return {
        status: 500,
        code: "INTERNAL_SERVER_ERROR",
        message:
          "The server has encountered a situation it does not know how to handle.",
      };
    }
  }
}
