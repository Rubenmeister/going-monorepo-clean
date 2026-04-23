/**
 * Hooks y utilidades de autenticación para Empresas
 *
 * Adaptado de apps/corporate-portal/lib/auth.ts
 * Capa de compatibilidad que puede integrarse con el sistema global en Fase 2
 *
 * El flujo es:
 *   1. Usuario hace login (email/password u OAuth) vía user-auth-service
 *   2. Recibimos JWT (accessToken) + info de usuario
 *   3. Guardamos en localStorage + cookie (para middleware)
 *   4. useSession() lee token y decodifica JWT para exponer user info
 *
 * API pensada para ser compatible con next-auth patterns
 */

"use client";

import { useEffect, useState, useCallback } from "react";
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
  SESSION_COOKIE,
  API_BASE_URL,
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
 * Limpia la sesión
 */
export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
  document.cookie = `${SESSION_COOKIE}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
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
 * Función: signIn() - Login corporativo real
 * Llama a POST /auth/corporate/login en el user-auth-service.
 * Valida que el usuario tenga rol 'corporate' o 'admin'.
 * Retorna un mensaje de error descriptivo si falla.
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/corporate/login`, {
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
    // data: { accessToken, refreshToken, expiresIn, user, companyId, companyName }

    if (typeof window === "undefined") return { success: false, error: "Sin acceso a localStorage" };

    localStorage.setItem(AUTH_TOKEN_KEY, data.accessToken);

    if (data.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }

    // Guardamos info del usuario para readSession()
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

    // Cookie para el middleware de Next.js
    document.cookie = `${SESSION_COOKIE}=${data.accessToken}; Path=/; SameSite=Strict`;

    return { success: true };
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error: "No se pudo conectar con el servidor." };
  }
}

/**
 * Función: signOut() - Logout real
 * Llama a POST /auth/logout para revocar el token en el backend,
 * luego limpia la sesión local.
 */
export async function signOut(): Promise<void> {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const rToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    // Intentar revocar en backend (best-effort, no bloqueante)
    if (token) {
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rToken ? { refreshToken: rToken } : {}),
      }).catch(() => {/* ignora errores de red en logout */});
    }
  }

  clearSession();

  if (typeof window !== "undefined") {
    window.location.href = "/empresas";
  }
}

/**
 * Función: refreshToken() - Refresca el access token
 * Llama a POST /auth/refresh con el refreshToken guardado.
 * Retorna true si se renovó con éxito.
 */
export async function refreshToken(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const rToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!rToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rToken }),
    });

    if (!res.ok) {
      clearSession();
      return false;
    }

    const data = await res.json();
    // data: { accessToken, expiresIn }
    localStorage.setItem(AUTH_TOKEN_KEY, data.accessToken);
    document.cookie = `${SESSION_COOKIE}=${data.accessToken}; Path=/; SameSite=Strict`;
    return true;
  } catch {
    return false;
  }
}

// TODO: Soporte para SSO (Okta, Azure, Google) - Fase 2
// TODO: MFA/2FA - Fase 2
