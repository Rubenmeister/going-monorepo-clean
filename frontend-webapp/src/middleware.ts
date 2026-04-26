import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware de protección de rutas para frontend-webapp.
 *
 * Hay dos flujos de auth aislados, cada uno con su propia cookie httpOnly:
 *
 * 1) Flujo principal (pasajeros, conductores, anfitriones, etc.)
 *    - Cookie: going_webapp_session=1
 *    - Login:  /auth/login
 *    - Rutas:  /account, /bookings, /payment, /dashboard, /services/*
 *
 * 2) Flujo empresas/corporate
 *    - Cookie: going_empresas_session=1
 *    - Login:  /empresas/auth/login
 *    - Rutas:  /empresas/panel/*
 *
 * /ride es PÚBLICA — el usuario puede buscar y ver opciones sin login.
 * El login se solicita solo al confirmar/pagar el viaje.
 *
 * Las rutas de marketing, auth y páginas públicas pasan sin comprobación.
 */

const PROTECTED_PREFIXES = [
  '/account',
  '/bookings',
  '/payment',
  '/dashboard',
  '/services/conductores',
  '/services/anfitriones',
  '/services/promotores-locales',
  '/services/operadores',
];

const EMPRESAS_PROTECTED_PREFIX = '/empresas/panel';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Flujo empresas/corporate ────────────────────────────────────────────
  if (pathname.startsWith(EMPRESAS_PROTECTED_PREFIX)) {
    const empresasSession = req.cookies.get('going_empresas_session')?.value;
    if (!empresasSession || empresasSession !== '1') {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/empresas/auth/login';
      const fullFrom = req.nextUrl.search
        ? `${pathname}${req.nextUrl.search}`
        : pathname;
      loginUrl.search = '';
      loginUrl.searchParams.set('from', fullFrom);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── Flujo principal (pasajeros, conductores, etc.) ──────────────────────
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  if (!isProtected) return NextResponse.next();

  const session = req.cookies.get('going_webapp_session')?.value;

  if (!session || session !== '1') {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/auth/login';
    // Preservar la URL completa incluyendo query params para redirigir después del login
    const fullFrom = req.nextUrl.search
      ? `${pathname}${req.nextUrl.search}`
      : pathname;
    loginUrl.search = '';
    loginUrl.searchParams.set('from', fullFrom);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
