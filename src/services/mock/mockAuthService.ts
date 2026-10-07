import { env } from '../../config/env';
import type { Session } from '../../domain/types';
import { ApiError } from '../errors';
import type { AuthService, OtpChallenge } from '../types';
import { MockDb, hashForDevBackend, randomOtpCode } from './mockDb';

import { E164_INDIA_PATTERN, NAME_PATTERN } from '../../domain/validation';

export interface DevAuthOptions {
  otpTtlSeconds?: number;
  otpMaxAttempts?: number;
  resendCooldownSeconds?: number;
  sessionTtlHours?: number;
}

/**
 * DEVELOPMENT-ONLY authentication backend.
 *
 * Everything (code generation, hashing, attempt counting, session issuing)
 * happens in the browser, so it must never be treated as production
 * authentication: it exists so the whole product flow can be built and
 * exercised without an SMS provider or a server.
 *
 * It deliberately implements the same policy a server must implement —
 * OTP expiry, attempt limit, resend cooldown, session expiry and revocation —
 * and the API returns the very same shapes as `HttpAuthService`, so switching
 * VITE_AUTH_MODE to `api` requires no UI change. See db/README.md.
 */
export class MockAuthService implements AuthService {
  readonly kind = 'dev' as const;

  private readonly otpTtlSeconds: number;
  private readonly otpMaxAttempts: number;
  private readonly resendCooldownSeconds: number;
  private readonly sessionTtlHours: number;

  constructor(
    private readonly db: MockDb,
    options: DevAuthOptions = {},
  ) {
    this.otpTtlSeconds = options.otpTtlSeconds ?? env.otpTtlSeconds;
    this.otpMaxAttempts = options.otpMaxAttempts ?? env.otpMaxAttempts;
    this.resendCooldownSeconds = options.resendCooldownSeconds ?? env.otpResendCooldownSeconds;
    this.sessionTtlHours = options.sessionTtlHours ?? env.sessionTtlHours;
  }

  async requestOtp({ name, phoneE164 }: { name: string; phoneE164: string }): Promise<OtpChallenge> {
    const trimmedName = name.trim();
    if (!NAME_PATTERN.test(trimmedName)) {
      throw new ApiError('validation', 'Enter the full name as printed on your bank records.');
    }
    if (!E164_INDIA_PATTERN.test(phoneE164)) {
      throw new ApiError('validation', 'Enter a valid 10-digit Indian mobile number.');
    }

    const user = this.db.upsertUser({ name: trimmedName, phoneE164 });
    return this.issueChallenge(user.id, phoneE164);
  }

  async resendOtp({ challengeId }: { challengeId: string }): Promise<OtpChallenge> {
    const challenge = this.db.getOtpChallenge(challengeId);
    if (!challenge) throw new ApiError('not_found', 'This verification session has expired. Start again.');

    const now = this.db.now().toISOString();
    if (now < challenge.resendAvailableAt) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((Date.parse(challenge.resendAvailableAt) - Date.parse(now)) / 1000),
      );
      throw new ApiError('cooldown', 'Please wait before requesting another OTP.', { retryAfterSeconds });
    }
    return this.issueChallenge(challenge.userId, challenge.phoneE164);
  }

  async verifyOtp({ challengeId, code }: { challengeId: string; code: string }): Promise<Session> {
    const challenge = this.db.getOtpChallenge(challengeId);
    if (!challenge) throw new ApiError('not_found', 'This OTP is no longer valid. Request a new one.');

    if (challenge.status === 'locked') {
      throw new ApiError('otp_attempts_exceeded', 'Too many incorrect attempts. Request a new OTP.');
    }
    if (challenge.status === 'verified') {
      throw new ApiError('otp_invalid', 'This OTP has already been used. Request a new one.');
    }

    const now = this.db.now().toISOString();
    if (challenge.status === 'expired' || challenge.expiresAt <= now) {
      this.db.updateOtpChallenge(challenge.id, { status: 'expired' });
      throw new ApiError('otp_expired', 'This OTP has expired. Request a new one.');
    }
    if (!/^\d{6}$/.test(code)) {
      throw new ApiError('validation', 'Enter the 6-digit code.', { attemptsRemaining: this.remainingAttempts(challenge) });
    }
    if (hashForDevBackend(code, challenge.salt) !== challenge.codeHash) {
      const attempts = challenge.attempts + 1;
      const locked = attempts >= challenge.maxAttempts;
      this.db.updateOtpChallenge(challenge.id, { attempts, status: locked ? 'locked' : 'pending' });
      if (locked) {
        throw new ApiError('otp_attempts_exceeded', 'Too many incorrect attempts. Request a new OTP.', {
          attemptsRemaining: 0,
        });
      }
      throw new ApiError('otp_invalid', 'Incorrect OTP.', { attemptsRemaining: this.remainingAttempts(challenge) });
    }

    this.db.updateOtpChallenge(challenge.id, { status: 'verified' });
    const user = this.db.findUserById(challenge.userId);
    if (!user) throw new ApiError('server', 'This account is no longer available.');

    const session = this.db.createSession(user.id, this.sessionTtlHours);
    return {
      token: session.token,
      expiresAt: session.expiresAt,
      user: { id: user.id, name: user.name, phoneE164: user.phoneE164, createdAt: user.createdAt },
    };
  }

  async restoreSession(token: string): Promise<Session> {
    const session = this.db.getActiveSession(token);
    if (!session) throw new ApiError('unauthorized', 'Your session has expired. Please sign in again.');
    const user = this.db.findUserById(session.userId);
    if (!user) throw new ApiError('unauthorized', 'Your session has expired. Please sign in again.');
    return {
      token: session.token,
      expiresAt: session.expiresAt,
      user: { id: user.id, name: user.name, phoneE164: user.phoneE164, createdAt: user.createdAt },
    };
  }

  async logout(token: string): Promise<void> {
    this.db.revokeSession(token);
  }

  private remainingAttempts(challenge: { attempts: number; maxAttempts: number }): number {
    return Math.max(0, challenge.maxAttempts - challenge.attempts);
  }

  private issueChallenge(userId: string, phoneE164: string): OtpChallenge {
    const code = randomOtpCode();
    const { challenge } = this.db.createOtpChallenge({
      userId,
      phoneE164,
      code,
      maxAttempts: this.otpMaxAttempts,
      ttlSeconds: this.otpTtlSeconds,
      resendCooldownSeconds: this.resendCooldownSeconds,
    });
    return {
      challengeId: challenge.id,
      expiresAt: challenge.expiresAt,
      resendAvailableAt: challenge.resendAvailableAt,
      // Development backend only: a real backend never returns the code.
      devCode: code,
    };
  }
}
