import { type ApiError } from "../../types/errors";

export function createUpdateProfileConfirmEmailErrorResponse(error: ApiError) {
  switch (error) {
    case "BAD_CREDENTIALS": {
      return { status: 400, code: "BAD_CREDENTIALS" };
    }
    case "BAD_EMAIL_CODE": {
      return { status: 400, code: "BAD_EMAIL_CODE" };
    }
    case "CODE_EXPIRED": {
      return { status: 410, code: "CODE_EXPIRED" };
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
