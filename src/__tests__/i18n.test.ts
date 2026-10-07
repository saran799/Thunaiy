import { describe, expect, it } from 'vitest';
import { CATALOGS, LANGUAGES, translate, type LanguageCode } from '../i18n';
import { DEFAULT_LANGUAGE } from '../domain/languages';
import { errorMessageKey } from '../services/errorMessages';
import type { ApiErrorCode } from '../services/errors';

const CODES: LanguageCode[] = ['en', 'ta', 'hi', 'te', 'kn'];

describe('i18n catalogues', () => {
  it('ships every supported language', () => {
    expect(LANGUAGES.map((language) => language.id).sort()).toEqual(['en', 'hi', 'kn', 'ta', 'te']);
    expect(DEFAULT_LANGUAGE).toBe('en');
  });

  it('keeps every catalogue in key parity with English', () => {
    const englishKeys = Object.keys(CATALOGS.en).sort();

    for (const code of CODES) {
      expect(Object.keys(CATALOGS[code]).sort(), `key mismatch in the "${code}" catalogue`).toEqual(englishKeys);
    }
  });

  // Product names are intentionally identical in every language.
  const BRAND_KEYS = new Set(['app.name', 'app.version']);

  it('never ships an empty or unfinished translation', () => {
    const english = CATALOGS.en as Record<string, string>;

    for (const code of CODES) {
      for (const [key, value] of Object.entries(CATALOGS[code] as Record<string, string>)) {
        expect(value.trim(), `${code}.${key} is empty`).not.toBe('');
        // "{page} / {total}" style strings carry no words to translate.
        const formatOnly = !/[A-Za-z]/.test(english[key].replace(/\{\w+\}/g, ''));
        if (code !== 'en' && !BRAND_KEYS.has(key) && !formatOnly) {
          expect(value, `${code}.${key} still falls back to English`).not.toBe(english[key]);
        }
      }
    }
  });

  it('interpolates parameters', () => {
    expect(translate('en', 'viewer.requiredFields', { count: 3 })).toContain('3');
    expect(translate('ta', 'viewer.requiredFields', { count: 2 })).toContain('2');
    expect(translate('kn', 'viewer.pageIndicator', { page: 1, total: 2 })).toContain('1');
  });

  it('falls back to the key itself when a translation is missing', () => {
    // @ts-expect-error deliberately bypassing the typed key union
    expect(translate('en', 'definitely.not.a.key')).toBe('definitely.not.a.key');
  });

  it('resolves every error code to a translated message', () => {
    const codes: ApiErrorCode[] = [
      'network',
      'unauthorized',
      'forbidden',
      'not_found',
      'validation',
      'conflict',
      'cooldown',
      'otp_expired',
      'otp_invalid',
      'otp_attempts_exceeded',
      'unavailable',
      'server',
      'configuration',
    ];

    for (const code of codes) {
      const key = errorMessageKey(code);
      for (const language of CODES) {
        const message = translate(language, key);
        expect(message, `${language}.${key} is not translated`).not.toBe(key);
      }
    }
  });
});
