import {
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithCredential,
  signInWithPhoneNumber,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type Auth,
  type ConfirmationResult,
  type User as FirebaseUser,
} from 'firebase/auth';
import { env, getMissingFirebaseKeys } from '../../config/env';
import type { Session, User } from '../../domain/types';
import { E164_INDIA_PATTERN, NAME_PATTERN } from '../../domain/validation';
import { ApiError } from '../errors';
import type { AuthService, OtpChallenge } from '../types';
import { getFirebaseAuth } from './firebaseApp';
import { readPendingChallenge } from '../../state/otpChallenge';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    recaptchaWidgetId?: number;
  }
}

interface StoredChallenge {
  challengeId: string;
  name: string;
  phoneE164: string;
  confirmationResult?: ConfirmationResult;
  expiresAt: string;
  resendAvailableAt: string;
}

const RECAPTCHA_CONTAINER_ID = 'thunaiy-recaptcha-container';
const RESEND_COOLDOWN_SECONDS = 30;
const OTP_TTL_SECONDS = 300; // 5 minutes

export class FirebaseAuthService implements AuthService {
  readonly kind = 'firebase' as const;
  private readonly challenges = new Map<string, StoredChallenge>();
  private authInstance?: Auth;
  private verifier: RecaptchaVerifier | null = null;
  private inFlight = false;

  constructor(auth?: Auth) {
    this.authInstance = auth;
  }

  private get auth(): Auth {
    if (!this.authInstance) {
      this.authInstance = getFirebaseAuth();
    }
    return this.authInstance;
  }

  /**
   * Prepares a guaranteed fresh DOM container for reCAPTCHA rendering.
   * If an element with RECAPTCHA_CONTAINER_ID already exists, it is replaced with
   * a brand-new element so that grecaptcha's internal tracking on the old element is detached.
   */
  private prepareRecaptchaContainer(): HTMLElement {
    if (typeof document === 'undefined') {
      throw new ApiError('unavailable', 'reCAPTCHA verification requires a browser document environment.');
    }

    const existing = document.getElementById(RECAPTCHA_CONTAINER_ID);
    if (existing) {
      const parent = existing.parentNode;
      if (parent) {
        const fresh = document.createElement('div');
        fresh.id = RECAPTCHA_CONTAINER_ID;
        parent.replaceChild(fresh, existing);
        return fresh;
      }
    }

    const fresh = document.createElement('div');
    fresh.id = RECAPTCHA_CONTAINER_ID;
    document.body.appendChild(fresh);
    return fresh;
  }

  /**
   * Explicitly disposes of the current RecaptchaVerifier, resets global references,
   * replaces the DOM container node, and cleans up any stray reCAPTCHA badge elements.
   */
  public cleanupRecaptcha(): void {
    if (this.verifier) {
      try {
        this.verifier.clear();
      } catch {
        // Ignored if already disposed
      }
      this.verifier = null;
    }

    if (typeof window !== 'undefined' && window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch {
        // Ignored
      }
      window.recaptchaVerifier = undefined;
    }

    if (typeof document !== 'undefined') {
      const existing = document.getElementById(RECAPTCHA_CONTAINER_ID);
      if (existing && existing.parentNode) {
        const fresh = document.createElement('div');
        fresh.id = RECAPTCHA_CONTAINER_ID;
        existing.parentNode.replaceChild(fresh, existing);
      }

      // Clean up orphaned reCAPTCHA badge if present
      const badges = document.querySelectorAll('.grecaptcha-badge');
      badges.forEach((b) => b.parentElement?.removeChild(b));
    }
  }

  async requestOtp(input: { name: string; phoneE164: string }): Promise<OtpChallenge> {
    if (this.inFlight) {
      throw new ApiError('cooldown', 'A verification request is already in progress. Please wait a moment.');
    }

    const trimmedName = input.name.trim();
    if (!NAME_PATTERN.test(trimmedName)) {
      throw new ApiError('validation', 'Enter the full name as printed on your bank records.');
    }
    if (!E164_INDIA_PATTERN.test(input.phoneE164)) {
      throw new ApiError('validation', 'Enter a valid 10-digit Indian mobile number (+91...).');
    }

    if (!env.hasFirebaseConfig && !this.authInstance) {
      const missing = getMissingFirebaseKeys();
      throw new ApiError(
        'configuration',
        `Firebase configuration is missing in .env.local (${missing.join(', ')}).`,
      );
    }

    this.inFlight = true;

    try {
      // 1. Fully clean up any previous verifier and prepare a fresh container
      this.cleanupRecaptcha();
      const container = this.prepareRecaptchaContainer();

      // 2. Instantiate a fresh RecaptchaVerifier on the pristine container
      const verifier = new RecaptchaVerifier(this.auth, container, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA successfully solved
        },
        'expired-callback': () => {
          this.cleanupRecaptcha();
        },
      });

      this.verifier = verifier;
      if (typeof window !== 'undefined') {
        window.recaptchaVerifier = verifier;
      }

      // 3. Request SMS OTP through Firebase
      const confirmationResult = await signInWithPhoneNumber(this.auth, input.phoneE164, verifier);
      const challengeId = confirmationResult.verificationId || `challenge_${Date.now()}`;
      const now = Date.now();
      const expiresAt = new Date(now + OTP_TTL_SECONDS * 1000).toISOString();
      const resendAvailableAt = new Date(now + RESEND_COOLDOWN_SECONDS * 1000).toISOString();

      const stored: StoredChallenge = {
        challengeId,
        name: trimmedName,
        phoneE164: input.phoneE164,
        confirmationResult,
        expiresAt,
        resendAvailableAt,
      };

      this.challenges.set(challengeId, stored);

      return {
        challengeId,
        expiresAt,
        resendAvailableAt,
      };
    } catch (error) {
      this.cleanupRecaptcha();
      throw this.mapFirebaseError(error);
    } finally {
      this.inFlight = false;
    }
  }

  async resendOtp(input: { challengeId: string }): Promise<OtpChallenge> {
    if (this.inFlight) {
      throw new ApiError('cooldown', 'A verification request is already in progress. Please wait a moment.');
    }

    const existing = this.challenges.get(input.challengeId);
    const pendingStorage = readPendingChallenge();
    const phoneE164 = existing?.phoneE164 || pendingStorage?.phoneE164;
    const name = existing?.name || pendingStorage?.name || '';

    if (!phoneE164) {
      throw new ApiError('not_found', 'No mobile number found for this verification session. Please return to registration.');
    }

    const resendAvailableAt = existing?.resendAvailableAt || pendingStorage?.resendAvailableAt;
    if (resendAvailableAt) {
      const diffMs = Date.parse(resendAvailableAt) - Date.now();
      if (diffMs > 0) {
        const retryAfterSeconds = Math.max(1, Math.ceil(diffMs / 1000));
        throw new ApiError('cooldown', 'Please wait before requesting another OTP.', { retryAfterSeconds });
      }
    }

    this.inFlight = true;

    try {
      this.cleanupRecaptcha();
      const container = this.prepareRecaptchaContainer();

      const verifier = new RecaptchaVerifier(this.auth, container, {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {
          this.cleanupRecaptcha();
        },
      });

      this.verifier = verifier;
      if (typeof window !== 'undefined') {
        window.recaptchaVerifier = verifier;
      }

      const confirmationResult = await signInWithPhoneNumber(this.auth, phoneE164, verifier);
      const newChallengeId = confirmationResult.verificationId || `challenge_${Date.now()}`;
      const now = Date.now();
      const expiresAt = new Date(now + OTP_TTL_SECONDS * 1000).toISOString();
      const nextResendAt = new Date(now + RESEND_COOLDOWN_SECONDS * 1000).toISOString();

      const stored: StoredChallenge = {
        challengeId: newChallengeId,
        name,
        phoneE164,
        confirmationResult,
        expiresAt,
        resendAvailableAt: nextResendAt,
      };

      this.challenges.set(newChallengeId, stored);
      if (newChallengeId !== input.challengeId) {
        this.challenges.delete(input.challengeId);
      }

      return {
        challengeId: newChallengeId,
        expiresAt,
        resendAvailableAt: nextResendAt,
      };
    } catch (error) {
      this.cleanupRecaptcha();
      throw this.mapFirebaseError(error);
    } finally {
      this.inFlight = false;
    }
  }

  async verifyOtp(input: { challengeId: string; code: string }): Promise<Session> {
    if (!/^\d{6}$/.test(input.code)) {
      throw new ApiError('validation', 'Enter the 6-digit code.');
    }

    const stored = this.challenges.get(input.challengeId);
    const pendingStorage = readPendingChallenge();
    const name = stored?.name || pendingStorage?.name || '';
    const phoneE164 = stored?.phoneE164 || pendingStorage?.phoneE164 || '';

    try {
      let fbUser: FirebaseUser;

      if (stored?.confirmationResult) {
        const userCredential = await stored.confirmationResult.confirm(input.code);
        fbUser = userCredential.user;
      } else {
        // Resilient fallback for page reload: authenticate using PhoneAuthProvider credential
        const credential = PhoneAuthProvider.credential(input.challengeId, input.code);
        const userCredential = await signInWithCredential(this.auth, credential);
        fbUser = userCredential.user;
      }

      if (name && (!fbUser.displayName || fbUser.displayName !== name)) {
        try {
          await updateProfile(fbUser, { displayName: name });
        } catch {
          // Best-effort profile update
        }
      }

      this.challenges.delete(input.challengeId);
      this.cleanupRecaptcha();

      return await this.buildSessionFromFirebaseUser(fbUser, name, phoneE164);
    } catch (error) {
      throw this.mapFirebaseError(error);
    }
  }

  async restoreSession(_token: string): Promise<Session> {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      return this.buildSessionFromFirebaseUser(currentUser);
    }

    return new Promise<Session>((resolve, reject) => {
      let unsubscribe: (() => void) | undefined;
      const timeout = setTimeout(() => {
        if (unsubscribe) unsubscribe();
        reject(new ApiError('unauthorized', 'Your session has expired. Please sign in again.'));
      }, 2500);

      unsubscribe = onAuthStateChanged(
        this.auth,
        async (user) => {
          clearTimeout(timeout);
          if (unsubscribe) unsubscribe();
          if (user) {
            try {
              const session = await this.buildSessionFromFirebaseUser(user);
              resolve(session);
            } catch {
              reject(new ApiError('unauthorized', 'Could not restore Firebase session.'));
            }
          } else {
            reject(new ApiError('unauthorized', 'Your session has expired. Please sign in again.'));
          }
        },
        (error) => {
          clearTimeout(timeout);
          if (unsubscribe) unsubscribe();
          reject(new ApiError('unauthorized', error.message));
        },
      );
    });
  }

  async logout(_token: string): Promise<void> {
    try {
      await signOut(this.auth);
    } catch {
      // Ignored
    }
    this.challenges.clear();
    this.cleanupRecaptcha();
  }

  private async buildSessionFromFirebaseUser(
    fbUser: FirebaseUser,
    fallbackName?: string,
    fallbackPhone?: string,
  ): Promise<Session> {
    const token = await fbUser.getIdToken();
    const domainUser: User = {
      id: fbUser.uid,
      name: fbUser.displayName || fallbackName || 'User',
      phoneE164: fbUser.phoneNumber || fallbackPhone || '',
      createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
    };

    return {
      token,
      // Firebase ID token valid for 1 hour
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      user: domainUser,
    };
  }

  private mapFirebaseError(error: unknown): ApiError {
    if (error instanceof ApiError) return error;

    const err = error as { code?: string; message?: string };
    const code = err.code ?? '';
    const rawMessage = err.message ?? '';

    console.error('[Firebase Phone Auth Error]', { code, message: rawMessage, error });

    // Handle any grecaptcha engine errors gracefully
    if (rawMessage.includes('already been rendered')) {
      return new ApiError('cooldown', 'Verification security challenge reset. Please try submitting again.');
    }

    switch (code) {
      case 'auth/invalid-phone-number':
        return new ApiError('validation', 'Enter a valid 10-digit Indian mobile number (+91...).');
      case 'auth/missing-phone-number':
        return new ApiError('validation', 'Mobile number is required.');
      case 'auth/quota-exceeded':
        return new ApiError(
          'unavailable',
          'SMS quota exceeded for this Firebase project. You can test with test phone numbers configured in Firebase Console.',
        );
      case 'auth/too-many-requests':
        return new ApiError('cooldown', 'Too many requests. Please wait a few moments before trying again.');
      case 'auth/captcha-check-failed':
        return new ApiError('validation', 'reCAPTCHA verification failed. Please try again.');
      case 'auth/invalid-verification-code':
        return new ApiError('otp_invalid', 'Incorrect OTP. Please check the code and try again.');
      case 'auth/code-expired':
        return new ApiError('otp_expired', 'This OTP has expired. Please request a new one.');
      case 'auth/session-expired':
        return new ApiError('otp_expired', 'Verification session has expired. Please request a new OTP.');
      case 'auth/app-not-authorized':
        return new ApiError(
          'configuration',
          'Domain is not authorized for Firebase Phone Auth. Add localhost or your domain in Firebase Console under Authentication > Settings > Authorized domains.',
        );
      case 'auth/operation-not-allowed':
        return new ApiError(
          'configuration',
          'Phone SMS is blocked for this number. In Firebase Console: (1) Add your number under Authentication > Sign-in method > Phone > "Phone numbers for testing" with a fixed code (recommended), OR (2) Allow India (+91) under Authentication > Settings > "SMS region policy".',
        );
      case 'auth/invalid-app-credential':
        return new ApiError(
          'configuration',
          'Firebase Phone Auth app verification failed. Ensure your authorized domains are up to date.',
        );
      case 'auth/network-request-failed':
        return new ApiError('network', 'Network connection error. Please check your internet connection.');
      default:
        return new ApiError('server', rawMessage || 'Authentication failed. Please try again.');
    }
  }
}
