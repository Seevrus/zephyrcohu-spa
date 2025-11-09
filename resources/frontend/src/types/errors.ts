export type ApiError =
  | "BAD_CREDENTIALS"
  | "BAD_EMAIL_CODE"
  | "CODE_EXPIRED"
  | "GENERIC_UNAUTHORIZED"
  | "INTERNAL_SERVER_ERROR"
  | "INVALID_REQUEST_DATA"
  | "USER_ALREADY_CONFIRMED"
  | "USER_EXISTS"
  | "USER_NOT_CONFIRMED";

export type ZephyrErrorData = {
  status: number;
  code: ApiError;
  message?: string;
};

export type ZephyrValidationErrorData = {
  message: string;
  errors: Record<string, unknown>;
};
