/**
 * Pending OTP challenge, held in session storage so a reload during
 * verification does not lose the flow. It intentionally holds no secret: the
 * code itself is only ever known to the backend (the development backend
 * surfaces it for on-screen display — see MockAuthService).
 */
export interface PendingChallenge {
  challengeId: string;
  name: string;
  phoneE164: string;
  expiresAt: string;
  resendAvailableAt: string;
  devCode?: string;
}

const STORAGE_KEY = 'thunaiy.otp-challenge.v1';

function storage(): Storage | undefined {
  try {
    return globalThis.sessionStorage;
  } catch {
    return undefined;
  }
}

export function savePendingChallenge(challenge: PendingChallenge): void {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(challenge));
  } catch {
    /* ignore */
  }
}

export function readPendingChallenge(): PendingChallenge | null {
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingChallenge;
    if (typeof parsed.challengeId !== 'string' || typeof parsed.phoneE164 !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingChallenge(): void {
  try {
    storage()?.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export { formatIndianPhone } from '../domain/validation';
