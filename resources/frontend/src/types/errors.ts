export type ApiError =
  | "GENERIC_UNAUTHORIZED"
  | "INTERNAL_SERVER_ERROR"
  | "USER_EXISTS"
  | "USER_NOT_CONFIRMED";

export type ZephyrErrorData = {
  status: number;
  code: ApiError;
  message?: string;
};
