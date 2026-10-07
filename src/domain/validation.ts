/**
 * Shared input validation for Indian mobile-first onboarding.
 *
 * These live in the domain layer (not in a service implementation) so both the
 * UI and every auth backend validate identically — the UI must never import a
 * mock module.
 */

/** Indian mobile number in E.164 form: +91 followed by a 6-9 lead digit and 9 more. */
export const E164_INDIA_PATTERN = /^\+91[6-9]\d{9}$/;

/** 2-80 characters, starts with a letter/mark, letters/marks plus . ' - and spaces. */
export const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]{1,79}$/u;

/** Six digit one-time password. */
export const OTP_PATTERN = /^\d{6}$/;

export const NAME_MIN_LENGTH = 2;
export const OTP_LENGTH = 6;
export const MOBILE_DIGITS_LENGTH = 10;

export function normalizeIndianMobile(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, MOBILE_DIGITS_LENGTH);
}

export function toE164India(digits: string): string {
  return `+91${digits}`;
}

export function isValidName(raw: string): boolean {
  return NAME_PATTERN.test(raw.trim());
}

export function isValidIndianMobileE164(value: string): boolean {
  return E164_INDIA_PATTERN.test(value);
}

/** +919876543210 -> "+91 98765 43210" for display. Passes other input through. */
export function formatIndianPhone(phoneE164: string): string {
  const digits = phoneE164.replace(/\D/g, '');
  const national = digits.startsWith('91') ? digits.slice(2) : digits;
  if (national.length !== MOBILE_DIGITS_LENGTH) return phoneE164;
  return `+91 ${national.slice(0, 5)} ${national.slice(5)}`;
}
