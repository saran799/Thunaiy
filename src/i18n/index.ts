import { LANGUAGES, languageOption } from '../domain/languages';
import type { LanguageCode } from '../domain/types';
import { en } from './catalogs/en';
import { hi } from './catalogs/hi';
import { kn } from './catalogs/kn';
import { ta } from './catalogs/ta';
import { te } from './catalogs/te';

/**
 * Small i18n runtime: one typed catalogue per language, `{placeholder}`
 * interpolation, and English as the fallback. It intentionally avoids a
 * dependency — the app has a fixed set of ~120 keys and 5 languages, and the
 * catalogues are type-checked against each other.
 */
export type TranslationKey = keyof typeof en;
export type TranslateParams = Record<string, string | number>;
export type Translator = (key: TranslationKey, params?: TranslateParams) => string;

export const CATALOGS: Record<LanguageCode, Record<TranslationKey, string>> = { en, ta, hi, te, kn };

export function translate(languageCode: LanguageCode, key: TranslationKey, params?: TranslateParams): string {
  const catalogue = CATALOGS[languageCode] ?? CATALOGS.en;
  const template = catalogue[key] ?? CATALOGS.en[key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}

export function createTranslator(languageCode: LanguageCode): Translator {
  return (key, params) => translate(languageCode, key, params);
}

/** Applies the active language to <html lang> and the script font on <body>. */
export function applyLanguageToDocument(languageCode: LanguageCode, doc: Document | undefined = globalThis.document): void {
  if (!doc) return;
  doc.documentElement.lang = languageCode;
  const classes = doc.body.classList;
  for (const language of LANGUAGES) classes.remove(language.fontClass);
  classes.add(languageOption(languageCode).fontClass);
}

export { LANGUAGES };
export type { LanguageCode };
