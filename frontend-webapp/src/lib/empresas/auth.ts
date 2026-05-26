/**
 * Hooks y utilidades de autenticación para Empresas
 *
 * Adaptado de apps/corporate-portal/lib/auth.ts
 *
 * El flujo es:
 *   1. Usuario hace login (email/password) → POST a /api/empresas/auth/login
 *      (proxy server-side). El proxy llama al user-auth-service y, si OK,
 *      setea la cookie httpOnly going_empresas_session=1.
 *   2. El cliente recibe { accessToken, refreshToken, user, ... } y los
 *      guarda en localStorage para Authorization headers.
 *   3. useSession() lee token de localStorage y decodifica JWT para exponer
 *      user info (consistencia eventual con el cookie del middleware).
 *   4. Logout: POST a /api/empresas/auth/logout (limpia cookie httpOnly) +
 *      clearSession() limpia localStorage + redirect.
 *   5. Refresh: POST a /api/empresas/auth/refresh (renueva token + cookie).
 *
 * NOTA IMPORTANTE: la cookie de sesión la maneja exclusivamente el server
 * (proxies en /api/empresas/auth/*). Este módulo no toca document.cookie.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Session,
  SessionStatus,
  SessionUser,
  RolEmpresa,
} from "./types";
import {
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_INFO_KEY,
} from "./constants";

/**
 * Decodifica JWT sin validar firma (solo frontend, validación en backend)
 */
function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const b64 = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const json = atob(b64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Parse JSON seguro
 */
function safeJsonParse(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Lee sesión desde localStorage/SessionStorage
 */
function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return null;

  const payload = decodeJwt(token);
  if (!payload) return null;

  // Validar expiración
  const exp = typeof payload.exp === "number" ? payload.exp : null;
  if (exp && Date.now() / 1000 > exp) {
    clearSession();
    return null;
  }

  const rawInfo = localStorage.getItem(USER_INFO_KEY);
  const stored = rawInfo ? (safeJsonParse(rawInfo) as Record<string, unknown>) : {};

  const user: SessionUser = {
    id: (stored.id as string) ?? (payload.sub as string) ?? undefined,
    email:
      (stored.email as string) ?? (payload.email as string) ?? undefined,
    nombre:
      (stored.nombre as string) ??
      ((payload.firstName || payload.lastName)
        ? `${payload.firstName ?? ""} ${payload.lastName ?? ""}`.trim()
        : undefined),
    apellido: (stored.apellido as string) ?? undefined,
    companyId:
      (stored.companyId as string) ?? (payload.companyId as string) ?? undefined,
    companyName:
      (stored.companyName as string) ?? (payload.companyName as string) ?? undefined,
    roles: ((stored.roles as unknown as RolEmpresa[]) ?? (payload.roles as unknown as RolEmpresa[]) ?? []) as RolEmpresa[],
    tipoCuenta:
      (stored.tipoCuenta as any) ?? (payload.tipoCuenta as any) ?? undefined,
    activo: (stored.activo as boolean) ?? true,
  };

  return {
    user,
    accessToken: token,
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) ?? undefined,
  };
}

/**
 * Limpia la sesión local (localStorage). La cookie httpOnly se limpia
 * exclusivamente desde el server vía /api/empresas/auth/logout — esta
 * función no la toca porque httpOnly impide acceder desde JS.
 *
 * Para un logout completo (localStorage + cookie + revocación remota),
 * usar signOut().
 */
export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
}

/**
 * Hook: useSession() - Compatibilidad con next-auth pattern
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  useEffect(() => {
    const sess = readSession();
    setSession(sess);
    setStatus(sess ? "authenticated" : "unauthenticated");
  }, []);

  return { data: session, status };
}

/**
 * Hook: useAuthRedirect() - Redirige a login si no autenticado
 */
export function useAuthRedirect(redirectTo: string = "/empresas/auth/login") {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(redirectTo);
    }
  }, [status, router, redirectTo]);

  return { session, status };
}

/**
 * Función: signIn() - Login corporativo.
 *
 * Llama al proxy server-side /api/empresas/auth/login que internamente:
 *   1. Reenvía credenciales al user-auth-service /auth/corporate/login.
 *   2. Si el backend devuelve token válido, setea la cookie httpOnly
 *      going_empresas_session=1 (Set-Cookie header) para que el middleware
 *      permita el acceso a /empresas/panel/*.
 *
 * Este cliente solo guarda token + user info en localStorage para usar en
 * Authorization headers de subsiguientes requests al backend.
 */
export interface SignInResult {
  success: boolean;
  error?: string;
  /** Si el user tiene MFA activado, hay que llamar verifyMfaLogin con este token + el code TOTP/recovery. */
  mfaRequired?: boolean;
  mfaToken?: string;
}

export async function signIn(
  email: string,
  password: string
): Promise<SignInResult> {
  try {
    const res = await fetch(`/api/empresas/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body.message ?? "Cuenta bloqueada temporalmente. Intenta más tarde." };
    }

    if (res.status === 401) {
      return { success: false, error: "Email o contraseña incorrectos." };
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body.message ?? "Error al iniciar sesión." };
    }

    const data = await res.json();

    // MFA challenge: el backend devuelve { mfaRequired: true, mfaToken }
    // en lugar de los tokens reales. El caller debe pedir TOTP code y
    // llamar a verifyMfaLogin().
    if (data?.mfaRequired && data?.mfaToken) {
      return { success: false, mfaRequired: true, mfaToken: data.mfaToken };
    }

    // data: { accessToken, refreshToken, expiresIn, user, companyId, companyName }
    if (typeof window === "undefined") return { success: false, error: "Sin acceso a localStorage" };

    persistSessionFromResponse(data);
    return { success: true };
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error: "No se pudo conectar con el servidor." };
  }
}

/**
 * Segundo paso del login cuando el user tiene MFA activado.
 * Llama al proxy /api/empresas/auth/mfa-verify-login con { mfaToken, code }.
 * Si OK, guarda la sesión exactamente igual que signIn() exitoso.
 */
export async function verifyMfaLogin(
  mfaToken: string,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/empresas/auth/mfa-verify-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mfaToken, code }),
    });
    if (res.status === 401) {
      return { success: false, error: "Código inválido. Intenta de nuevo." };
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body.message ?? "Error verificando código." };
    }
    const data = await res.json();
    if (typeof window === "undefined") return { success: false, error: "Sin acceso a localStorage" };
    persistSessionFromResponse(data);
    return { success: true };
  } catch (error) {
    console.error("verifyMfaLogin error:", error);
    return { success: false, error: "No se pudo conectar con el servidor." };
  }
}

/**
 * Guarda accessToken + refreshToken + userInfo en localStorage. Helper
 * compartido entre signIn() y verifyMfaLogin().
 */
function persistSessionFromResponse(data: any): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, data.accessToken);
  if (data.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  }
  const user = data.user ?? {};
  localStorage.setItem(
    USER_INFO_KEY,
    JSON.stringify({
      id: user.id,
      email: user.email,
      nombre: user.firstName ?? user.nombre ?? "",
      apellido: user.lastName ?? user.apellido ?? "",
      companyId: data.companyId ?? user.companyId ?? "",
      companyName: data.companyName ?? user.companyName ?? "",
      roles: user.roles ?? [],
      tipoCuenta: user.tipoCuenta ?? null,
      activo: user.activo ?? true,
    })
  );
}

/**
 * Función: signOut() - Logout corporate.
 *
 * Llama al proxy server-side /api/empresas/auth/logout que limpia la cookie
 * httpOnly y (best-effort) revoca el token en el backend. Después limpia
 * el localStorage local y redirige al landing.
 */
export async function signOut(): Promise<void> {
  if (typeof window === "undefined") return;

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const rToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  // El endpoint server-side limpia la cookie httpOnly Y revoca el token en
  // el backend (cuando recibe el Authorization header). Es atómico desde
  // la perspectiva del cliente.
  try {
    await fetch(`/api/empresas/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(rToken ? { refreshToken: rToken } : {}),
    });
  } catch {
    // Si la red falla, igual seguimos limpiando local — el middleware ya no
    // dejará pasar al usuario porque su localStorage queda vacío.
  }

  clearSession();

  // window.location en lugar de router.push para forzar un request fresco
  // que confirme que la cookie httpOnly ya no está y para limpiar todo el
  // estado React colgado de la sesión anterior.
  window.location.href = "/empresas";
}

/**
 * Función: refreshToken() - Renueva el access token corporativo.
 *
 * Llama al proxy server-side /api/empresas/auth/refresh que reenvía al
 * backend y, si el refresh es exitoso, extiende la cookie httpOnly de
 * sesión.
 *
 * Retorna true si se renovó con éxito; false si el refresh token ya no
 * es válido (en cuyo caso la sesión local se limpia).
 */
export async function refreshToken(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const rToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!rToken) return false;

  try {
    const res = await fetch(`/api/empresas/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rToken }),
    });

    if (!res.ok) {
      clearSession();
      return false;
    }

    const data = await res.json();
    // data: { accessToken, expiresIn, refreshToken? }
    const newToken = data.accessToken ?? data.token;
    if (!newToken) {
      clearSession();
      return false;
    }

    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    if (data.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }
    // Cookie httpOnly going_empresas_session ya fue renovada por el proxy.
    return true;
  } catch {
    return false;
  }
}

// TODO: Soporte para SSO (Okta, Azure, Google) - Fase 2
// TODO: MFA/2FA - Fase 2
