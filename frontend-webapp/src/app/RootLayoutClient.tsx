'use client';

import { Suspense, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@going-monorepo-clean/frontend-providers';
import { hydrateAuthStore } from '@going-monorepo-clean/frontend-stores';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GlobalErrorNotification } from './components/GlobalErrorNotification';
import { LanguageProvider } from './contexts/LanguageContext';
import { ClientOnly } from './ClientOnly';
import SupportChat from './components/ui/SupportChat';
import { ActiveRideBanner } from './components/features/ride/ActiveRideBanner';

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
  // Portales de rol (post-login): tienen su propio shell/sidebar, así que
  // ocultamos el Navbar/Footer de marketing para evitar el header duplicado.
  // OJO: solo estas 4 rutas — /services y el resto (/services/transport, tours,
  // accommodation, envios…) son marketing y SÍ llevan Navbar.
  '/services/conductores',
  '/services/operadores',
  '/services/promotores-locales',
  '/services/anfitriones',
  // Portal corporativo: la landing /empresas trae su propio header y el panel
  // su propio shell/sidebar → ocultamos el Navbar/Footer de marketing para no
  // duplicar el header (bug "doble navbar" en empresas.goingec.com).
  '/empresas',
];

/**
 * Landing pages MARKETING — rutas exactas (sin segmentos hijos) que sí llevan
 * Navbar/Footer global aunque su prefijo aparezca en APP_PREFIXES. Necesario
 * para que el usuario llegue desde "Descubrir" en el Navbar y siga viendo el
 * menú al aterrizar (sino la página se siente "desconectada" — bug reportado
 * por Rubén 2026-06-09).
 *
 * Las subrutas (e.g. /envios/cotizar, /envios/mis-envios, /tours/quito-baños)
 * se consideran app y siguen ocultando el navbar global, porque cada una tiene
 * su propio header contextual.
 */
const MARKETING_LANDINGS = new Set([
  '/envios',
  '/tours',
  '/experiences',
  '/accommodation',
]);

function useIsAppRoute() {
  const pathname = usePathname();
  // Host corporativo (empresas.goingec.com): el middleware reescribe
  // '/'→'/empresas' PERO usePathname ve el path del browser ('/', '/panel',
  // '/solicitud'…), no el reescrito. Sin esto, las URLs limpias del portal
  // empresas mostraban el Navbar/Footer de marketing encima de su propio header
  // (bug "doble navbar"). Todo el host empresas.* tiene su propio chrome, así que
  // ocultamos el de marketing en todo el host. Seguro en cliente sin hydration
  // mismatch: el Navbar/Footer viven en <ClientOnly> (no renderizan hasta montar).
  if (typeof window !== 'undefined' && window.location.hostname.startsWith('empresas.')) {
    return true;
  }
  if (MARKETING_LANDINGS.has(pathname)) return false;
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
      {/* Banner "tu viaje está en curso" — punto de entrada a la vista en vivo. */}
      <ClientOnly>
        <ActiveRideBanner />
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
  // Hydrate Zustand store from localStorage on first client render.
  // Safe to call multiple times — no-ops if already hydrated.
  useEffect(() => {
    hydrateAuthStore();
  }, []);

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
