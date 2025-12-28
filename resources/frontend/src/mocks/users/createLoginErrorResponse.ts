import { type ApiError } from "../../types/errors";

export function createLoginErrorResponse(error: ApiError) {
  switch (error) {
    case "BAD_CREDENTIALS": {
      return { status: 401, code: "BAD_CREDENTIALS" };
    }
    case "TOO_MANY_LOGIN_ATTEMPTS": {
      return { status: 429, code: "TOO_MANY_LOGIN_ATTEMPTS" };
    }
    case "USER_ALREADY_LOGGED_IN": {
      return { status: 409, code: "USER_ALREADY_LOGGED_IN" };
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
