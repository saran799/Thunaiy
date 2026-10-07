export type ApiErrorCode =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'conflict'
  | 'cooldown'
  | 'otp_expired'
  | 'otp_invalid'
  | 'otp_attempts_exceeded'
  | 'unavailable'
  | 'server'
  | 'configuration';

/** Error shape shared by every service implementation (dev backend and HTTP). */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number | null;
  /** Remaining OTP attempts, when the backend reports it. */
  readonly attemptsRemaining?: number;
  /** Seconds until the next allowed resend, when the backend reports it. */
  readonly retryAfterSeconds?: number;

  constructor(
    code: ApiErrorCode,
    message: string,
    options: { status?: number | null; attemptsRemaining?: number; retryAfterSeconds?: number } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = options.status ?? null;
    this.attemptsRemaining = options.attemptsRemaining;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
