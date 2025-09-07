import { type ApiError } from "types/errors";

export class ZephyrHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiError,
    message?: string,
  ) {
    super(message);
  }
}
