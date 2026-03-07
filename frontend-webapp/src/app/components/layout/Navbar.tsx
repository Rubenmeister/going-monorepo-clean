'use client';

import { useRouter } from 'next/navigation';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * Navigation bar component
 * Sticky header with logo, navigation links, language switcher, and user menu
 */
export function Navbar() {
  const router = useRouter();
  const { auth } = useMonorepoApp();
  const { t } = useTranslation();

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Left - Logo */}
        <Logo onLogoClick={() => router.push('/')} />

        {/* Center - Navigation Links (Desktop) */}
        <NavLinks t={t} />

        {/* Right - Actions */}
        <RightActions
          auth={auth}
          t={t}
          onLoginClick={() => router.push('/auth/login')}
        />
      </div>
    </nav>
  );
}

/**
 * Logo component
 */
function Logo({ onLogoClick }: { onLogoClick: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="text-3xl font-bold text-[#ff4c41] cursor-pointer"
        onClick={onLogoClick}
      >
        🌍
      </div>
      <h1
        className="text-xl font-bold text-[#ff4c41] hidden md:block cursor-pointer"
        onClick={onLogoClick}
      >
        Going
      </h1>
    </div>
  );
}

/**
 * Navigation links component
 */
function NavLinks({ t }: { t: (key: string) => string }) {
  return (
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
  );
}

/**
 * Right actions component (language switcher and user menu)
 */
function RightActions({
  auth,
  t,
  onLoginClick,
}: {
  auth: any;
  t: (key: string) => string;
  onLoginClick: () => void;
}) {
  return (
    <div className="flex items-center gap-4">
      {/* Language Switcher */}
      <LanguageSwitcher />

      {/* User Menu or Login */}
      {auth.user ? (
        <UserMenu user={auth.user} />
      ) : (
        <LoginButton onClick={onLoginClick} label={t('nav.iniciarSesion')} />
      )}
    </div>
  );
}

/**
 * User menu component
 */
function UserMenu({ user }: { user: any }) {
  return (
    <div className="hidden md:flex items-center gap-3">
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">{user.firstName}</p>
        <p className="text-xs text-gray-500">{user.email}</p>
      </div>
      <div className="w-10 h-10 bg-[#ff4c41] rounded-full flex items-center justify-center text-white font-bold">
        {user.firstName?.[0]?.toUpperCase()}
      </div>
    </div>
  );
}

/**
 * Login button component
 */
function LoginButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-[#ff4c41] text-white rounded-lg hover:bg-[#e63a2f] transition-colors font-semibold text-sm"
    >
      {label}
    </button>
  );
}
