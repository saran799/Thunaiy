import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FirebaseAuthService } from '../services/firebase/firebaseAuthService';
import { ApiError } from '../services/errors';
import { signInWithPhoneNumber, signInWithCredential, PhoneAuthProvider } from 'firebase/auth';
import type { Auth, User as FirebaseUser } from 'firebase/auth';

vi.mock('firebase/auth', async (importOriginal) => {
  const actual = await importOriginal<Record<string, any>>();
  const mockPhoneAuthProvider = function (this: any) {};
  mockPhoneAuthProvider.credential = vi.fn();

  return {
    ...actual,
    signInWithPhoneNumber: vi.fn(),
    signInWithCredential: vi.fn(),
    PhoneAuthProvider: mockPhoneAuthProvider,
    RecaptchaVerifier: vi.fn().mockImplementation(function (this: any) {
      this.render = vi.fn().mockResolvedValue(1);
      this.clear = vi.fn();
      this.verify = vi.fn().mockResolvedValue('token');
    }),
  };
});

describe('FirebaseAuthService', () => {
  let mockAuth: Auth;
  let service: FirebaseAuthService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuth = {
      currentUser: null,
      signOut: vi.fn().mockResolvedValue(undefined),
    } as unknown as Auth;

    service = new FirebaseAuthService(mockAuth);
  });

  describe('input validation', () => {
    it('rejects an invalid name (<2 chars or symbols)', async () => {
      await expect(
        service.requestOtp({ name: 'A', phoneE164: '+919876543210' }),
      ).rejects.toThrow(ApiError);
      await expect(
        service.requestOtp({ name: '1234', phoneE164: '+919876543210' }),
      ).rejects.toMatchObject({ code: 'validation' });
    });

    it('rejects non-Indian or invalid mobile numbers', async () => {
      await expect(
        service.requestOtp({ name: 'Ramesh Kumar', phoneE164: '+12025550123' }),
      ).rejects.toMatchObject({ code: 'validation' });

      await expect(
        service.requestOtp({ name: 'Ramesh Kumar', phoneE164: '+911234567890' }),
      ).rejects.toMatchObject({ code: 'validation' });
    });

    it('rejects OTP verification with non-6-digit codes', async () => {
      await expect(
        service.verifyOtp({ challengeId: 'test_challenge', code: '123' }),
      ).rejects.toMatchObject({ code: 'validation' });

      await expect(
        service.verifyOtp({ challengeId: 'test_challenge', code: 'abcdef' }),
      ).rejects.toMatchObject({ code: 'validation' });
    });
  });

  describe('reCAPTCHA lifecycle and cleanup', () => {
    it('cleans up verifiers and resets container without error', () => {
      expect(() => service.cleanupRecaptcha()).not.toThrow();
    });

    it('prevents concurrent in-flight OTP requests', async () => {
      vi.mocked(signInWithPhoneNumber).mockImplementation(
        () => new Promise(() => {}),
      );

      void service.requestOtp({ name: 'Ramesh Kumar', phoneE164: '+919876543210' });

      await expect(
        service.requestOtp({ name: 'Ramesh Kumar', phoneE164: '+919876543210' }),
      ).rejects.toMatchObject({ code: 'cooldown' });

      service.cleanupRecaptcha();
    });
  });

  describe('verification and session creation', () => {
    it('restores an existing currentUser session with fresh ID token', async () => {
      const mockFirebaseUser = {
        uid: 'user_123',
        displayName: 'Ramesh Kumar',
        phoneNumber: '+919876543210',
        metadata: { creationTime: '2026-01-01T00:00:00.000Z' },
        getIdToken: vi.fn().mockResolvedValue('fresh_token_xyz'),
      } as unknown as FirebaseUser;

      (mockAuth as any).currentUser = mockFirebaseUser;

      const session = await service.restoreSession('any_token');
      expect(session.token).toBe('fresh_token_xyz');
      expect(session.user.id).toBe('user_123');
      expect(session.user.name).toBe('Ramesh Kumar');
      expect(session.user.phoneE164).toBe('+919876543210');
    });

    it('falls back to PhoneAuthProvider.credential upon page reload', async () => {
      const mockCredential = { providerId: 'phone' };
      const mockUser = {
        uid: 'user_reloaded',
        displayName: 'Reloaded User',
        phoneNumber: '+919876543210',
        metadata: { creationTime: '2026-01-01T00:00:00.000Z' },
        getIdToken: vi.fn().mockResolvedValue('token_after_reload'),
      } as unknown as FirebaseUser;

      vi.mocked(PhoneAuthProvider.credential).mockReturnValue(mockCredential as any);
      vi.mocked(signInWithCredential).mockResolvedValue({
        user: mockUser,
      } as any);

      const session = await service.verifyOtp({ challengeId: 'valid_verification_id', code: '123456' });
      expect(session.token).toBe('token_after_reload');
      expect(session.user.id).toBe('user_reloaded');
      expect(PhoneAuthProvider.credential).toHaveBeenCalledWith('valid_verification_id', '123456');
      expect(signInWithCredential).toHaveBeenCalledWith(mockAuth, mockCredential);
    });

    it('signs out and clears state on logout', async () => {
      await service.logout('token');
      expect(mockAuth.signOut).toHaveBeenCalled();
    });
  });

  describe('error handling and mapping', () => {
    it('correctly maps invalid-verification-code to otp_invalid', async () => {
      vi.mocked(PhoneAuthProvider.credential).mockReturnValue({} as any);
      vi.mocked(signInWithCredential).mockRejectedValue({
        code: 'auth/invalid-verification-code',
        message: 'Invalid code',
      });

      await expect(
        service.verifyOtp({ challengeId: 'v_id', code: '000000' }),
      ).rejects.toMatchObject({ code: 'otp_invalid' });
    });

    it('correctly maps code-expired to otp_expired', async () => {
      vi.mocked(PhoneAuthProvider.credential).mockReturnValue({} as any);
      vi.mocked(signInWithCredential).mockRejectedValue({
        code: 'auth/code-expired',
        message: 'Code expired',
      });

      await expect(
        service.verifyOtp({ challengeId: 'v_id', code: '000000' }),
      ).rejects.toMatchObject({ code: 'otp_expired' });
    });

    it('gracefully handles and resets when reCAPTCHA already been rendered error is thrown', async () => {
      vi.mocked(signInWithPhoneNumber).mockRejectedValue(
        new Error('reCAPTCHA has already been rendered in this element'),
      );

      await expect(
        service.requestOtp({ name: 'Ramesh Kumar', phoneE164: '+919876543210' }),
      ).rejects.toMatchObject({ code: 'cooldown' });
    });
  });
});
