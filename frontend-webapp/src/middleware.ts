import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware de protección de rutas para frontend-webapp.
 *
 * Rutas protegidas (requieren sesión activa):
 *   /account  — perfil y configuración del usuario
 *   /bookings — reservas del usuario
 *   /payment  — flujo de pago y resultado
 *   /dashboard — panel de usuario/proveedor
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

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Solo aplicar a rutas protegidas
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
