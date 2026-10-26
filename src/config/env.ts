/**
 * Runtime configuration. Every value comes from a VITE_* environment variable
 * (see .env.example). Nothing here may contain a secret: Vite inlines these
 * values into the client bundle.
 */
export type BackendMode = 'dev' | 'api' | 'firebase';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface AppEnv {
  /** Base URL of the Thunaiy API. Empty means "no HTTP backend configured". */
  apiBaseUrl: string;
  /** Which implementation the service registry should use. */
  backendMode: BackendMode;
  firebase: FirebaseConfig;
  hasFirebaseConfig: boolean;
  otpTtlSeconds: number;
  otpMaxAttempts: number;
  otpResendCooldownSeconds: number;
  sessionTtlHours: number;
}

function readString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  let trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed.length > 0 ? trimmed : fallback;
}

function readNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const raw = import.meta.env ?? {};

const authModeRaw = readString(raw.VITE_AUTH_MODE, 'dev');
const backendMode: BackendMode =
  authModeRaw === 'firebase' ? 'firebase' : authModeRaw === 'api' ? 'api' : 'dev';

const firebase: FirebaseConfig = {
  apiKey: readString(raw.VITE_FIREBASE_API_KEY, ''),
  authDomain: readString(raw.VITE_FIREBASE_AUTH_DOMAIN, ''),
  projectId: readString(raw.VITE_FIREBASE_PROJECT_ID, ''),
  storageBucket: readString(raw.VITE_FIREBASE_STORAGE_BUCKET, ''),
  messagingSenderId: readString(raw.VITE_FIREBASE_MESSAGING_SENDER_ID, ''),
  appId: readString(raw.VITE_FIREBASE_APP_ID, ''),
};

const hasFirebaseConfig = Boolean(firebase.apiKey && firebase.projectId && firebase.appId);

export const env: AppEnv = {
  apiBaseUrl: readString(raw.VITE_API_BASE_URL, ''),
  backendMode,
  firebase,
  hasFirebaseConfig,
  otpTtlSeconds: readNumber(raw.VITE_OTP_TTL_SECONDS, 300),
  otpMaxAttempts: readNumber(raw.VITE_OTP_MAX_ATTEMPTS, 5),
  otpResendCooldownSeconds: readNumber(raw.VITE_OTP_RESEND_COOLDOWN_SECONDS, 30),
  sessionTtlHours: readNumber(raw.VITE_SESSION_TTL_HOURS, 168),
};

/** True when the app is talking to the real HTTP backend. */
export const hasHttpBackend = env.backendMode === 'api' && env.apiBaseUrl.length > 0;
export { hasFirebaseConfig };

export function getMissingFirebaseKeys(): string[] {
  const missing: string[] = [];
  if (!env.firebase.apiKey) missing.push('VITE_FIREBASE_API_KEY');
  if (!env.firebase.projectId) missing.push('VITE_FIREBASE_PROJECT_ID');
  if (!env.firebase.appId) missing.push('VITE_FIREBASE_APP_ID');
  return missing;
}
