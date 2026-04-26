'use client';

/**
 * Helpers cliente para gestionar la sesión de auth de forma consistente.
 *
 * Fuente de verdad: Zustand store (`useAuthStore`). El store persiste su
 * propio snapshot en localStorage bajo la key `auth-store`.
 *
 * Por compatibilidad con código legacy que lee `localStorage.authToken`
 * (servicios fetch, páginas viejas), también espejamos token y refreshToken
 * en sus keys legacy. Este helper es el ÚNICO lugar autorizado para leer y
 * escribir esas keys; el resto del código debe pasar por aquí.
 */

import { useAuthStore, type UserProfile } from '@going-monorepo-clean/frontend-stores';
import { useEffect, useState } from 'react';

export const TOKEN_KEY = 'authToken';
export const REFRESH_KEY = 'refreshToken';

/**
 * Decodifica el payload de un JWT. No verifica firma — solo parseo.
 * Devuelve null si el token no es un JWT válido.
 */
export function parseJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload =
      typeof window !== 'undefined'
        ? atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
        : Buffer.from(parts[1], 'base64').toString('utf-8');
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
}

/**
 * Construye un UserProfile a partir de la respuesta del backend o del payload
 * de un JWT. Tolerante a varios shapes (firstName/lastName vs name, roles vs
 * role como string).
 */
export function toUserProfile(raw: Record<string, unknown> | null | undefined): UserProfile | null {
  if (!raw) return null;

  const id = (raw.id ?? raw.sub ?? raw.userId ?? raw.uid) as string | undefined;
  if (!id) return null;

  const rolesRaw = (raw.roles ?? (raw.role ? [raw.role] : ['user'])) as unknown;
  const roles = Array.isArray(rolesRaw) ? (rolesRaw as string[]) : ['user'];

  const firstName = (raw.firstName ?? raw.given_name ?? '') as string;
  const lastName = (raw.lastName ?? raw.family_name ?? '') as string;
  const name =
    (raw.name as string | undefined) ||
    `${firstName} ${lastName}`.trim() ||
    ((raw.email as string | undefined) ?? 'Usuario');

  const avatar = (raw.avatar ?? raw.picture ?? raw.photoURL) as string | undefined;
  const email = (raw.email ?? '') as string;

  return {
    id,
    email,
    name,
    avatar,
    roles,
    role: (roles[0] ?? 'user') as UserProfile['role'],
    isAdmin: () => roles.includes('admin') || roles.includes('staff'),
  };
}

/**
 * Lee el token de sesión actual.
 *
 * Orden de búsqueda: store en memoria → store persistido (auth-store en
 * localStorage) → key legacy `authToken`. Devuelve null si no hay sesión.
 *
 * Usar SIEMPRE esto en lugar de `localStorage.getItem('authToken')` directo.
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;

  const fromStore = useAuthStore.getState().token;
  if (fromStore) return fromStore;

  // Fallback legacy: alguna página vieja escribió antes de que el store estuviese poblado
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Persiste la sesión: actualiza el store (fuente de verdad) Y espeja en
 * localStorage para código legacy.
 *
 * Si `userRaw` viene null, intenta derivar UserProfile del JWT.
 */
export function setStoredAuth(
  token: string,
  refreshToken: string | null,
  userRaw: Record<string, unknown> | null
): void {
  if (typeof window === 'undefined') return;

  const profile =
    toUserProfile(userRaw) ?? toUserProfile(parseJwtPayload(token));

  if (profile) {
    useAuthStore.getState().setAuth(token, refreshToken, profile);
  } else {
    // No pudimos derivar perfil — al menos seteamos el token para que la app
    // sepa que hay sesión; el perfil se hidratará cuando el siguiente request
    // a /me lo traiga.
    useAuthStore.getState().setToken(token, refreshToken);
  }

  // Espejo legacy
  localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }
}

/**
 * Cierra sesión limpiamente: limpia el store, las keys legacy y llama al
 * endpoint server-side para invalidar la cookie httpOnly.
 *
 * Usar SIEMPRE esto en lugar de borrar localStorage manualmente.
 */
export async function clearStoredAuth(): Promise<void> {
  if (typeof window === 'undefined') return;

  useAuthStore.getState().clearAuth();
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);

  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Si la red falla la cookie persiste, pero el cliente ya quedó sin token.
    // El próximo middleware check redirige a login igual.
  }
}

/**
 * Hook reactivo que refleja si el usuario está autenticado según el store.
 * Devuelve false durante SSR y mientras el store no esté hidratado, para
 * evitar mismatches de hidratación.
 */
export function useIsAuthenticated(): boolean {
  const token = useAuthStore((s) => s.token);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  // Evitar render mismatch: en SSR y antes de hidratar siempre devolvemos false
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isHydrated) return false;
  return Boolean(token);
}

/**
 * Hook reactivo que devuelve el token actual o null.
 */
export function useAuthToken(): string | null {
  const token = useAuthStore((s) => s.token);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted || !isHydrated) return null;
  return token;
}

/**
 * Construye una URL absoluta hacia el backend o a un endpoint same-origin.
 * Si la URL es relativa, se devuelve tal cual (Next.js la resuelve con el
 * origen actual). Si es absoluta, se devuelve sin tocar.
 */
function resolveUrl(input: string): string {
  if (/^https?:\/\//i.test(input)) return input;
  return input;
}

/**
 * Wrapper de fetch que:
 *  - Añade Authorization: Bearer <token> automáticamente si hay sesión.
 *  - Detecta 401: limpia la sesión local y redirige a /auth/login.
 *
 * No intenta refresh: el caller que necesite reintentos puede llamar antes
 * a `useAuthStore.getState().refreshIfNeeded()`.
 */
export async function authFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(init.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(resolveUrl(input), { ...init, headers });

  if (res.status === 401 && typeof window !== 'undefined') {
    // Sesión expirada o inválida — limpiar estado y redirigir.
    // Preservamos la ruta actual para volver tras el re-login.
    await clearStoredAuth();
    const from = window.location.pathname + window.location.search;
    window.location.href = `/auth/login?from=${encodeURIComponent(from)}`;
  }

  return res;
}

/**
 * Redirige al login preservando la ruta actual como `?from=`. Útil cuando un
 * componente detecta que necesita auth antes de hacer cualquier request.
 */
export function redirectToLogin(from?: string): void {
  if (typeof window === 'undefined') return;
  const target = from ?? window.location.pathname + window.location.search;
  window.location.href = `/auth/login?from=${encodeURIComponent(target)}`;
}
