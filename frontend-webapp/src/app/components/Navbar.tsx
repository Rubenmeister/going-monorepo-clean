'use client';

import { useRouter } from 'next/navigation';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from '../hooks/useTranslation';

export function Navbar() {
  const router = useRouter();
  const { auth } = useMonorepoApp();
  const { t } = useTranslation();

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Left - Logo */}
        <div className="flex items-center gap-2">
          <div className="text-3xl font-bold text-blue-600 cursor-pointer" onClick={() => router.push('/')}>
            🌍
          </div>
          <h1 className="text-xl font-bold text-blue-600 hidden md:block cursor-pointer" onClick={() => router.push('/')}>
            Going
          </h1>
        </div>

        {/* Center - Navigation Links (Desktop) */}
        <div className="hidden lg:flex gap-8">
          <a href="/" className="text-gray-700 hover:text-blue-600 transition-colors font-medium text-sm">
            {t('nav.inicio')}
          </a>
          <a href="/services" className="text-gray-700 hover:text-blue-600 transition-colors font-medium text-sm">
            {t('nav.servicios')}
          </a>
          <a href="/account" className="text-gray-700 hover:text-blue-600 transition-colors font-medium text-sm">
            {t('nav.miCuenta')}
          </a>
          <a href="/bookings" className="text-gray-700 hover:text-blue-600 transition-colors font-medium text-sm">
            {t('nav.misReservas')}
          </a>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* User Menu or Login */}
          {auth.user ? (
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{auth.user.firstName}</p>
                <p className="text-xs text-gray-500">{auth.user.email}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {auth.user.firstName?.[0]?.toUpperCase()}
              </div>
            </div>
          ) : (
            <button
              onClick={() => router.push('/auth/login')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
            >
              {t('nav.iniciarSesion')}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
