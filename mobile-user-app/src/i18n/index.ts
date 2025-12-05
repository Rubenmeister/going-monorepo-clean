import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
// Import translations
import es from './locales/es.json';
import en from './locales/en.json';
i18n
  .use(initReactI18next)
  .init({
    resources: { es: { translation: es }, en: { translation: en } },
    lng: Localization.locale.split('-')[0], // Auto-detect
    fallbackLng: 'es',
    interpolation: { escapeValue: false }
  });