/**
 * Hooks y utilidades de autenticación del corporate-portal.
 *
 * Reemplazan el uso de `next-auth/react`. El flujo es:
 *   1. El usuario hace login (email/password o OAuth) a través del user-auth-service
 *   2. Recibimos un JWT (`accessToken`) + user info
 *   3. Guardamos todo en localStorage + cookie `going_corp_session` (para middleware)
 *   4. `useSession()` lee el token y decodifica el JWT para exponer user info
 *
 * API pensada para ser compatible con los call sites que antes usaban next-auth:
 *   const { data: session, status } = useSession();
 *   session.user.email, session.user.name, session.accessToken
 */
import { useEffect, useState } from 'react';

export const AUTH_TOKEN_KEY = 'authToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';
export const USER_INFO_KEY = 'userInfo';
export const SESSION_COOKIE = 'going_corp_session';

export type SessionUser = {
  id?: string;
  email?: string;
  name?: string;
  roles?: string[];
  companyId?: string;
  companyName?: string;
};

export type Session = {
  user: SessionUser;
  accessToken: string;
};

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * Decodifica el payload de un JWT sin validar la firma (solo para UI).
 * La validación real ya la hizo el backend al emitir el token.
 */
function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

function readSession(): Session | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return null;

  const payload = decodeJwt(token);
  if (!payload) return null;

  // Si expiró, limpiamos y devolvemos null
  const exp = typeof payload.exp === 'number' ? payload.exp : null;
  if (exp && Date.now() / 1000 > exp) {
    clearSession();
    return null;
  }

  const rawInfo = localStorage.getItem(USER_INFO_KEY);
  const stored = rawInfo ? safeJsonParse(rawInfo) : {};

  const user: SessionUser = {
    id: (stored.id as string) ?? (payload.sub as string) ?? undefined,
    email:
      (stored.email as string) ?? (payload.email as string) ?? undefined,
    name:
      (stored.name as string) ??
      ((payload.firstName || payload.lastName)
        ? `${payload.firstName ?? ''} ${payload.lastName ?? ''}`.trim()
        : undefined),
    roles: (stored.roles as string[]) ?? (payload.roles as string[]) ?? [],
    companyId:
      (stored.companyId as string) ?? (payload.companyId as string) ?? undefined,
    companyName:
      (stored.companyName as string) ??
      (payload.companyName as string) ??
      undefined,
  };

  return { user, accessToken: token };
}

function safeJsonParse(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Escribe token + user info tras un login exitoso y setea la cookie
 * que usa el middleware / edge para proteger rutas.
 */
export function persistSession(opts: {
  accessToken: string;
  refreshToken?: string;
  user?: SessionUser;
}): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, opts.accessToken);
  if (opts.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, opts.refreshToken);
  if (opts.user) localStorage.setItem(USER_INFO_KEY, JSON.stringify(opts.user));
  // Cookie no-httpOnly porque solo sirve como señal de "hay sesión"; la
  // autenticación real va por el Bearer token en cada request.
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Drop-in replacement para `useSession()` de next-auth.
 * Status transita: 'loading' → 'authenticated' | 'unauthenticated'.
 */
export function useSession(): { data: Session | null; status: SessionStatus } {
  const [data, setData] = useState<Session | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  useEffect(() => {
    const session = readSession();
    setData(session);
    setStatus(session ? 'authenticated' : 'unauthenticated');

    // Re-sync si otra pestaña hizo login/logout
    const onStorage = (e: StorageEvent) => {
      if (e.key === AUTH_TOKEN_KEY) {
        const s = readSession();
        setData(s);
        setStatus(s ? 'authenticated' : 'unauthenticated');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return { data, status };
}

/**
 * Reemplazo de `signOut` de next-auth.
 * Limpia la sesión local y redirige a la URL indicada (default /auth/login).
 */
export function signOut(opts?: { callbackUrl?: string }): void {
  clearSession();
  if (typeof window !== 'undefined') {
    window.location.href = opts?.callbackUrl ?? '/auth/login';
  }
}
