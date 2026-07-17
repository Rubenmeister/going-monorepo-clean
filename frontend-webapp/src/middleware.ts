import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware de frontend-webapp — auth gating del flujo principal (pasajeros,
 * conductores, anfitriones, etc.) con cookie httpOnly `going_webapp_session`.
 *
 * El portal corporativo (empresas.goingec.com) se separó a su propia app
 * `empresas-webapp` el 2026-07-17 — ya NO se sirve desde acá, así que se quitó
 * el rewrite por host y el gating de /empresas/panel.
 *
 * /ride es PÚBLICA — el usuario puede buscar sin login (se pide al pagar).
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

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));

  if (isProtected) {
    const session = req.cookies.get('going_webapp_session')?.value;
    if (!session || session !== '1') {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/auth/login';
      const fullFrom = req.nextUrl.search ? `${path}${req.nextUrl.search}` : path;
      loginUrl.search = '';
      loginUrl.searchParams.set('from', fullFrom);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
