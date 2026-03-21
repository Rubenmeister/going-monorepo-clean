'use client';

import React, { createContext, useState, useEffect } from 'react';
import type { Language } from '../config/i18n-config';
import { DEFAULT_LANGUAGE } from '../config/i18n-config';
import type { I18nContextType } from '../types';

export const I18nContext = createContext<I18nContextType | undefined>(
  undefined
);

const loadTranslations = async (lang: Language) => {
  try {
    const translations = await import(`../translations/${lang}/common.json`);
    return translations.default;
  } catch {
    return {};
  }
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [translations, setTranslations] = useState<Record<string, any>>({});

  // Load translations on language change
  useEffect(() => {
    loadTranslations(language).then((trans) => {
      setTranslations(trans);
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', language);
        document.documentElement.lang = language;
      }
    });
  }, [language]);

  const t = (key: string, namespace: string = 'common'): string => {
    const keys = key.split('.');
    let value = translations[namespace];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}
