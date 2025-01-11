enum ApiError {
  GENERIC_UNAUTHORIZED = "GENERIC_UNAUTHORIZED",
}

type ErrorData = {
  status: number;
  code: ApiError;
  message: string;
};

export type ErrorResponse = {
  error: ErrorData;
  status: number;
};
