import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '../services/errors';
import { createTestServices, TEST_NAME, TEST_PHONE } from '../test/fixtures';
import type { AuthService } from '../services/types';

let clock: Date;
let auth: AuthService;

beforeEach(() => {
  clock = new Date('2026-01-01T10:00:00.000Z');
  auth = createTestServices({
    clock: () => clock,
    authOptions: { otpTtlSeconds: 300, otpMaxAttempts: 3, resendCooldownSeconds: 30, sessionTtlHours: 1 },
  }).auth;
});

async function requestChallenge() {
  return auth.requestOtp({ name: TEST_NAME, phoneE164: TEST_PHONE });
}

describe('authentication flow', () => {
  it('rejects a malformed name or mobile number', async () => {
    await expect(auth.requestOtp({ name: 'J', phoneE164: TEST_PHONE })).rejects.toMatchObject({ code: 'validation' });
    await expect(auth.requestOtp({ name: TEST_NAME, phoneE164: '+911234567890' })).rejects.toMatchObject({
      code: 'validation',
    });
  });

  it('issues a challenge with an expiry and a resend window', async () => {
    const challenge = await requestChallenge();
    expect(challenge.challengeId).toBeTruthy();
    expect(challenge.devCode).toMatch(/^\d{6}$/);
    expect(Date.parse(challenge.expiresAt) - clock.getTime()).toBe(300_000);
    expect(Date.parse(challenge.resendAvailableAt) - clock.getTime()).toBe(30_000);
  });

  it('verifies the correct code and issues a session that can be restored', async () => {
    const challenge = await requestChallenge();
    const session = await auth.verifyOtp({ challengeId: challenge.challengeId, code: challenge.devCode! });

    expect(session.token).toBeTruthy();
    expect(session.user.phoneE164).toBe(TEST_PHONE);
    expect(session.user.name).toBe(TEST_NAME);

    const restored = await auth.restoreSession(session.token);
    expect(restored.user.id).toBe(session.user.id);
  });

  it('rejects a wrong code and reports the remaining attempts', async () => {
    const challenge = await requestChallenge();
    await expect(auth.verifyOtp({ challengeId: challenge.challengeId, code: '000000' })).rejects.toMatchObject({
      code: 'otp_invalid',
      attemptsRemaining: 2,
    });
  });

  it('locks the challenge after the attempt limit', async () => {
    const challenge = await requestChallenge();
    const wrong = { challengeId: challenge.challengeId, code: '000000' };

    await expect(auth.verifyOtp(wrong)).rejects.toMatchObject({ code: 'otp_invalid' });
    await expect(auth.verifyOtp(wrong)).rejects.toMatchObject({ code: 'otp_invalid' });
    await expect(auth.verifyOtp(wrong)).rejects.toMatchObject({ code: 'otp_attempts_exceeded' });

    // Even the correct code cannot rescue a locked challenge.
    await expect(auth.verifyOtp({ challengeId: challenge.challengeId, code: challenge.devCode! })).rejects.toMatchObject(
      { code: 'otp_attempts_exceeded' },
    );
  });

  it('expires the challenge after its TTL', async () => {
    const challenge = await requestChallenge();
    clock = new Date(clock.getTime() + 301_000);

    const error = await auth
      .verifyOtp({ challengeId: challenge.challengeId, code: challenge.devCode! })
      .catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('otp_expired');
  });

  it('enforces the resend cooldown, then issues a fresh code', async () => {
    const challenge = await requestChallenge();

    await expect(auth.resendOtp({ challengeId: challenge.challengeId })).rejects.toMatchObject({
      code: 'cooldown',
      retryAfterSeconds: 30,
    });

    clock = new Date(clock.getTime() + 31_000);
    const resent = await auth.resendOtp({ challengeId: challenge.challengeId });
    expect(resent.challengeId).not.toBe(challenge.challengeId);

    await expect(auth.verifyOtp({ challengeId: challenge.challengeId, code: challenge.devCode! })).rejects.toMatchObject(
      { code: 'otp_expired' },
    );

    const session = await auth.verifyOtp({ challengeId: resent.challengeId, code: resent.devCode! });
    expect(session.token).toBeTruthy();
  });

  it('invalidates the session on logout', async () => {
    const challenge = await requestChallenge();
    const session = await auth.verifyOtp({ challengeId: challenge.challengeId, code: challenge.devCode! });

    await auth.logout(session.token);
    await expect(auth.restoreSession(session.token)).rejects.toMatchObject({ code: 'unauthorized' });
  });

  it('rejects an unknown or expired session token', async () => {
    await expect(auth.restoreSession('not-a-token')).rejects.toMatchObject({ code: 'unauthorized' });

    const challenge = await requestChallenge();
    const session = await auth.verifyOtp({ challengeId: challenge.challengeId, code: challenge.devCode! });
    clock = new Date(clock.getTime() + 3_601_000);
    await expect(auth.restoreSession(session.token)).rejects.toMatchObject({ code: 'unauthorized' });
  });

  it('exposes a development-only backend flag for the code display gate', () => {
    // Only the dev backend may surface a code; the UI gates the dev banner on this flag.
    expect(auth.kind).toBe('dev');
  });
});
