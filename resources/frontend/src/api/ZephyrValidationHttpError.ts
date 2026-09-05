import { ZephyrHttpError } from "./ZephyrHttpError";

/**
 * A 422 that keeps the backend's per-field messages instead of collapsing them
 * into a bare `INVALID_REQUEST_DATA`, so a screen can render them verbatim.
 */
export class ZephyrValidationHttpError extends ZephyrHttpError {
  constructor(
    status: number,
    readonly errors: Record<string, string[]>,
  ) {
    super(status, "INVALID_REQUEST_DATA");
  }

  messageFor(field: string): string | undefined {
    return this.errors[field]?.[0];
  }

  firstMessage(): string | undefined {
    return Object.values(this.errors)[0]?.[0];
  }
}
