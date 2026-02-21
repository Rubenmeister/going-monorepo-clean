export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
export const DEFAULT_LANGUAGE = 'en';

export const LANGUAGE_NAMES = {
  en: 'English',
  es: 'Español',
};

export type Language = (typeof SUPPORTED_LANGUAGES)[number];
