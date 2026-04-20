'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@going-monorepo-clean/frontend-providers';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GlobalErrorNotification } from './components/GlobalErrorNotification';
import { LanguageProvider } from './contexts/LanguageContext';
import { ClientOnly } from './ClientOnly';
import SupportChat from './components/ui/SupportChat';

/**
 * Rutas "de app" (usuario autenticado, flujos funcionales).
 * En estas rutas se oculta el Navbar/Footer globales porque
 * cada página tiene su propio header de navegación contextual.
 */
const APP_PREFIXES = [
  '/auth/',
  '/onboarding',
  '/ride',
  '/bookings',
  '/dashboard',
  '/account',
  '/payment',
  '/puntos',
  '/search',
  '/tours',
  '/experiences',
  '/accommodation',
  '/envios',
  '/sos',
  '/academy',
  '/tracking',
];

function useIsAppRoute() {
  const pathname = usePathname();
  return APP_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(prefix + '/')
  );
}

/** Shell interior — usa usePathname, necesita estar dentro de Suspense */
function ShellInner({ children }: { children: React.ReactNode }) {
  const isApp = useIsAppRoute();
  return (
    <>
      <GlobalErrorNotification />
      {!isApp && (
        <ClientOnly>
          <Navbar />
        </ClientOnly>
      )}
      <main className="min-h-screen">{children}</main>
      {!isApp && (
        <ClientOnly>
          <Footer />
        </ClientOnly>
      )}
      <ClientOnly>
        <SupportChat />
      </ClientOnly>
    </>
  );
}

/** Suspense boundary para evitar hydration mismatch con usePathname */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<main className="min-h-screen">{children}</main>}>
      <ShellInner>{children}</ShellInner>
    </Suspense>
  );
}

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <Shell>{children}</Shell>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
