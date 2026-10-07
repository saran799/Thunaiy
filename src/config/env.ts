/**
 * Runtime configuration. Every value comes from a VITE_* environment variable
 * (see .env.example). Nothing here may contain a secret: Vite inlines these
 * values into the client bundle.
 */
export type BackendMode = 'dev' | 'api';

export interface AppEnv {
  /** Base URL of the Thunaiy API. Empty means "no HTTP backend configured". */
  apiBaseUrl: string;
  /** Which implementation the service registry should use. */
  backendMode: BackendMode;
  otpTtlSeconds: number;
  otpMaxAttempts: number;
  otpResendCooldownSeconds: number;
  sessionTtlHours: number;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function readNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const raw = import.meta.env ?? {};

export const env: AppEnv = {
  apiBaseUrl: readString(raw.VITE_API_BASE_URL, ''),
  backendMode: readString(raw.VITE_AUTH_MODE, 'dev') === 'api' ? 'api' : 'dev',
  otpTtlSeconds: readNumber(raw.VITE_OTP_TTL_SECONDS, 300),
  otpMaxAttempts: readNumber(raw.VITE_OTP_MAX_ATTEMPTS, 5),
  otpResendCooldownSeconds: readNumber(raw.VITE_OTP_RESEND_COOLDOWN_SECONDS, 30),
  sessionTtlHours: readNumber(raw.VITE_SESSION_TTL_HOURS, 168),
};

/** True when the app is talking to the real HTTP backend. */
export const hasHttpBackend = env.backendMode === 'api' && env.apiBaseUrl.length > 0;
