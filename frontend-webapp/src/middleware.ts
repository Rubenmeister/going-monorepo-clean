import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware de protección de rutas para frontend-webapp.
 *
 * Rutas protegidas (requieren sesión activa):
 *   /account  — perfil y configuración del usuario empresa
 *   /bookings — reservas de la empresa
 *   /ride     — solicitud de viaje
 *   /payment  — flujo de pago y resultado
 *
 * Las rutas de marketing, auth y páginas públicas pasan sin comprobación.
 */

const PROTECTED_PREFIXES = ['/account', '/bookings', '/ride', '/payment'];

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
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
