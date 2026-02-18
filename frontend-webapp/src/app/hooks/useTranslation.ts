import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';

export function useTranslation() {
  const { language } = useLanguage();

  const t = (key: string): string => {
    return getTranslation(key, language);
  };

  return { t, language };
}
