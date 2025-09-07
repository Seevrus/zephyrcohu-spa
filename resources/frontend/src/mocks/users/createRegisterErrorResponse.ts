import { type ApiError } from "../../types/errors";

export function createRegisterErrorResponse(error: ApiError) {
  switch (error) {
    case "USER_EXISTS": {
      return { status: 409, code: "USER_EXISTS" };
    }
    case "USER_NOT_CONFIRMED": {
      return { status: 409, code: "USER_NOT_CONFIRMED" };
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
