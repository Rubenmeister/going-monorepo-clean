'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from '../hooks/useTranslation';

export function Navbar() {
  const router = useRouter();
  const { auth } = useMonorepoApp();
  const { t } = useTranslation();

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Left - Logo */}
        <div
          className="flex items-center cursor-pointer"
          onClick={() => router.push('/')}
        >
          <Image
            src="/going-logo-h.png"
            alt="Going"
            width={120}
            height={40}
            className="h-9 w-auto object-contain"
            priority
          />
        </div>

        {/* Center - Navigation Links (Desktop) */}
        <div className="hidden lg:flex gap-8">
          <a
            href="/"
            className="text-gray-700 hover:text-[#ff4c41] transition-colors font-medium text-sm"
          >
            {t('nav.inicio')}
          </a>
          <a
            href="/services"
            className="text-gray-700 hover:text-[#ff4c41] transition-colors font-medium text-sm"
          >
            {t('nav.servicios')}
          </a>
          <a
            href="/account"
            className="text-gray-700 hover:text-[#ff4c41] transition-colors font-medium text-sm"
          >
            {t('nav.miCuenta')}
          </a>
          <a
            href="/bookings"
            className="text-gray-700 hover:text-[#ff4c41] transition-colors font-medium text-sm"
          >
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
                <p className="text-sm font-semibold text-gray-900">
                  {auth.user.firstName}
                </p>
                <p className="text-xs text-gray-500">{auth.user.email}</p>
              </div>
              <div className="w-10 h-10 bg-[#ff4c41] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {auth.user.firstName?.[0]?.toUpperCase()}
              </div>
            </div>
          ) : (
            <button
              onClick={() => router.push('/auth/login')}
              className="px-4 py-2 bg-[#ff4c41] text-white rounded-lg hover:bg-[#e63a2f] transition-colors font-semibold text-sm shadow-sm"
            >
              {t('nav.iniciarSesion')}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
