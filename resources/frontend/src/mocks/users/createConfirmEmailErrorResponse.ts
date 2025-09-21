import { type ApiError } from "../../types/errors";

export function createConfirmEmailErrorResponse(error: ApiError) {
  switch (error) {
    case "BAD_EMAIL_CODE": {
      return { status: 404, code: "BAD_EMAIL_CODE" };
    }
    case "INVALID_REQUEST_DATA": {
      return {
        message: "validation.email",
        errors: { email: ["validation.email"] },
      };
    }
    case "USER_ALREADY_CONFIRMED": {
      return { status: 410, code: "USER_ALREADY_CONFIRMED" };
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
