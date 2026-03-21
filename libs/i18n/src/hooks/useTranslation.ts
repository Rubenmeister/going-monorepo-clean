'use client';

import { useContext } from 'react';
import { I18nContext } from '../components/I18nProvider';

export function useTranslation(namespace: string = 'common') {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }

  return (key: string) => {
    return context.t(key, namespace);
  };
}
