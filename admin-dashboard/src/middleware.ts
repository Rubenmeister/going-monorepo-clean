import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware de protección de rutas para admin-dashboard.
 *
 * Estrategia de doble capa:
 *  1. Este middleware comprueba la cookie `going_admin_session` (escrita por
 *     auth.context.tsx cuando el JWT local es válido). Redirige a /login si
 *     no existe — impide que usuarios no autenticados vean cualquier página.
 *  2. Cada página también verifica `auth.user.isAdmin()` para asegurarse de
 *     que el rol correcto está presente (defensa en profundidad).
 *
 * Nota: la cookie NO es httpOnly (la escribe JS del cliente), por lo que no
 * reemplaza la validación de JWT en el backend. Es únicamente para UX/routing.
 */

const PUBLIC_PATHS = ['/login'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pasar rutas públicas, assets de Next.js y archivos estáticos de /public
  // (logos .png, íconos, etc.) sin comprobación. Sin el chequeo de extensión,
  // un asset solicitado sin sesión se redirigía a /login y se servía HTML en
  // lugar del archivo (rompía el logo del propio login).
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const session = req.cookies.get('going_admin_session')?.value;

  if (!session || session !== '1') {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    // Guardar destino para redirigir tras login
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Aplica el middleware a todas las rutas excepto assets estáticos
  // (incluye archivos de /public: .png/.svg/.ico/.css/.js/fuentes…).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|js|css|woff|woff2|ttf|map|json|txt)).*)'],
};
