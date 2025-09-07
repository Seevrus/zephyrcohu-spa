export type ApiError =
  | "GENERIC_UNAUTHORIZED"
  | "INTERNAL_SERVER_ERROR"
  | "USER_EXISTS";

export type ZephyrErrorData = {
  status: number;
  code: ApiError;
  message?: string;
};
