import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware de frontend-webapp — combina dos responsabilidades:
 *
 * A) Host-based rewrite (post-deprecación corporate-portal, 2026-05-12):
 *    - empresas.goingec.com/<path>  →  internamente /empresas/<path>
 *    - URL en browser queda limpia ('empresas.goingec.com/panel') pero la
 *      app sirve el route file de '/empresas/panel'
 *    - Si el usuario ya escribe /empresas/* dentro de empresas host, no
 *      double-rewrite
 *    - app.goingec.com sigue funcionando normal con /empresas/* explicit
 *
 * B) Auth gating en 2 flujos aislados, cada uno con su cookie httpOnly:
 *    1) Flujo principal (pasajeros, conductores, anfitriones, etc.)
 *       Cookie: going_webapp_session=1   Login: /auth/login
 *       Rutas:  /account, /bookings, /payment, /dashboard, /services/*
 *    2) Flujo empresas/corporate
 *       Cookie: going_empresas_session=1  Login: /empresas/auth/login
 *       Rutas:  /empresas/panel/*
 *
 *    /ride es PÚBLICA — el usuario puede buscar sin login (se pide al pagar).
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

/**
 * Hosts que activan el rewrite a /empresas/*. Cubre prod (empresas.goingec.com)
 * + previews Vercel (cualquier subdominio que empiece con 'empresas.'). Si en
 * el futuro hay otro alias, agregar acá.
 */
function isEmpresasHost(host: string): boolean {
  if (!host) return false;
  return host === 'empresas.goingec.com' || host.startsWith('empresas.');
}

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const onEmpresasHost = isEmpresasHost(host);

  // ── A) Host-based rewrite ──────────────────────────────────────────────
  // Si entró por empresas.* y NO escribió ya /empresas/, planificamos rewrite.
  let rewriteUrl: URL | null = null;
  let effectivePath = req.nextUrl.pathname;
  if (onEmpresasHost && !effectivePath.startsWith('/empresas')) {
    const rewritten = req.nextUrl.clone();
    rewritten.pathname = effectivePath === '/' ? '/empresas' : `/empresas${effectivePath}`;
    rewriteUrl = rewritten;
    effectivePath = rewritten.pathname; // auth check usa path post-rewrite
  }

  // ── B1) Auth gating para empresas/* ────────────────────────────────────
  if (effectivePath.startsWith(EMPRESAS_PROTECTED_PREFIX)) {
    const empresasSession = req.cookies.get('going_empresas_session')?.value;
    if (!empresasSession || empresasSession !== '1') {
      const loginUrl = req.nextUrl.clone();
      // En empresas host: redirect a /auth/login bare — la próxima request
      // entra al middleware otra vez y rewritea a /empresas/auth/login.
      // URL pública queda 'empresas.goingec.com/auth/login' (sin redundancia).
      // En otros hosts: path explícito '/empresas/auth/login'.
      loginUrl.pathname = onEmpresasHost ? '/auth/login' : '/empresas/auth/login';
      const origPath = req.nextUrl.pathname;
      const fullFrom = req.nextUrl.search ? `${origPath}${req.nextUrl.search}` : origPath;
      loginUrl.search = '';
      loginUrl.searchParams.set('from', fullFrom);
      return NextResponse.redirect(loginUrl);
    }
    return rewriteUrl ? NextResponse.rewrite(rewriteUrl) : NextResponse.next();
  }

  // ── B2) Auth gating del flujo principal — solo si NO estamos en empresas host
  // En empresas host las rutas no-/empresas/panel son públicas (home, /auth/login,
  // /empresas/solicitud, etc.); no aplicamos PROTECTED_PREFIXES del passenger flow.
  if (!onEmpresasHost) {
    const isProtected = PROTECTED_PREFIXES.some((prefix) =>
      effectivePath.startsWith(prefix)
    );
    if (isProtected) {
      const session = req.cookies.get('going_webapp_session')?.value;
      if (!session || session !== '1') {
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = '/auth/login';
        const fullFrom = req.nextUrl.search
          ? `${effectivePath}${req.nextUrl.search}`
          : effectivePath;
        loginUrl.search = '';
        loginUrl.searchParams.set('from', fullFrom);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  // ── Aplicar rewrite si lo planificamos arriba (sin auth issue) ─────────
  return rewriteUrl ? NextResponse.rewrite(rewriteUrl) : NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
