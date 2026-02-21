import type { Language } from './config/i18n-config';

export interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, namespace: string) => string;
}
