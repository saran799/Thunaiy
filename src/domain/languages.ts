import type { LanguageCode, LanguageOption } from './types';

/**
 * Supported languages. The endonym is shown on the language screen in its own
 * script; `fontClass` is the Tailwind font-family utility used while that
 * language is active (see main.tsx / I18nProvider for how it is applied).
 */
export const LANGUAGES: LanguageOption[] = [
  { id: 'en', label: 'English', englishLabel: 'English', fontClass: 'font-sans' },
  { id: 'ta', label: 'தமிழ்', englishLabel: 'Tamil', fontClass: 'font-tamil' },
  { id: 'hi', label: 'हिन्दी', englishLabel: 'Hindi', fontClass: 'font-devanagari' },
  { id: 'te', label: 'తెలుగు', englishLabel: 'Telugu', fontClass: 'font-telugu' },
  { id: 'kn', label: 'ಕನ್ನಡ', englishLabel: 'Kannada', fontClass: 'font-kannada' },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export const LANGUAGE_CODES: LanguageCode[] = LANGUAGES.map((language) => language.id);

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && (LANGUAGE_CODES as string[]).includes(value);
}

export function languageOption(code: LanguageCode): LanguageOption {
  return LANGUAGES.find((language) => language.id === code) ?? LANGUAGES[0];
}
