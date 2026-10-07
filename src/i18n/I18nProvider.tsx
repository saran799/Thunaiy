import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { LanguageCode } from '../domain/types';
import { applyLanguageToDocument, createTranslator, type Translator } from './index';

interface I18nContextValue {
  languageCode: LanguageCode;
  t: Translator;
}

const I18nContext = createContext<I18nContextValue>({
  languageCode: 'en',
  t: createTranslator('en'),
});

export function I18nProvider({ languageCode, children }: { languageCode: LanguageCode; children: ReactNode }) {
  const value = useMemo(() => ({ languageCode, t: createTranslator(languageCode) }), [languageCode]);

  useEffect(() => {
    applyLanguageToDocument(languageCode);
  }, [languageCode]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Translation hook. `t('key', { params })` with English fallback for missing keys. */
export function useTranslation(): I18nContextValue {
  return useContext(I18nContext);
}

export function useTranslator(): Translator {
  return useContext(I18nContext).t;
}
