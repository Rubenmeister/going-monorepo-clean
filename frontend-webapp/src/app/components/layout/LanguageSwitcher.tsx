'use client';

import { useState } from 'react';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * Language switcher component
 * Allows users to change the app language
 */
export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
  ];

  const currentLang = languages.find((l) => l.code === language);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Language Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all font-semibold text-sm md:text-base shadow-sm"
        title={t('nav.cambiarIdioma')}
      >
        <span className="text-lg">{currentLang?.flag}</span>
        <span className="hidden md:inline">{currentLang?.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <LanguageDropdown
          languages={languages}
          currentLanguage={language}
          onSelectLanguage={handleLanguageChange}
        />
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}

/**
 * Language dropdown menu
 */
function LanguageDropdown({
  languages,
  currentLanguage,
  onSelectLanguage,
}: {
  languages: Array<{ code: Language; name: string; flag: string }>;
  currentLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
}) {
  return (
    <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onSelectLanguage(lang.code)}
          className={`w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-gray-50 transition-colors ${
            currentLanguage === lang.code
              ? 'bg-red-50 border-l-4 border-[#ff4c41]'
              : ''
          } ${
            lang.code !== languages[languages.length - 1].code
              ? 'border-b border-gray-200'
              : ''
          }`}
        >
          <span className="text-lg">{lang.flag}</span>
          <span
            className={`font-medium ${
              currentLanguage === lang.code ? 'text-[#ff4c41]' : 'text-gray-700'
            }`}
          >
            {lang.name}
          </span>
          {currentLanguage === lang.code && (
            <span className="ml-auto text-[#ff4c41]">✓</span>
          )}
        </button>
      ))}
    </div>
  );
}
