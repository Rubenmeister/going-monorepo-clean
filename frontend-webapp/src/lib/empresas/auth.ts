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
 * Función: signIn() - Login
 * TODO: Integrar con backend real en Fase 2
 */
export async function signIn(email: string, password: string): Promise<boolean> {
  try {
    // TODO: Llamar a endpoint real de autenticación
    // const res = await fetch(`${API_BASE_URL}/api/v1/empresas/auth/login`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, password }),
    // });

    // Mock para Fase 1
    const mockToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwibm9tYnJlIjoiVGVzdCBVc2VyIiwicm9sZXMiOlsiYWRtaW4iXSwiY29tcGFueUlkIjoiY29tcDEiLCJjb21wYW55TmFtZSI6IkV4YW1wbGUgQ28iLCJ0aXBvQ3VlbnRhIjoiZ3JhbmRlIiwiZXhwIjo5OTk5OTk5OTk5fQ.mock";

    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
      localStorage.setItem(
        USER_INFO_KEY,
        JSON.stringify({
          email,
          nombre: "Test User",
          companyId: "comp1",
          companyName: "Example Co",
          roles: ["admin"],
          tipoCuenta: "grande",
        })
      );
    }

    return true;
  } catch (error) {
    console.error("Sign in error:", error);
    return false;
  }
}

/**
 * Función: signOut() - Logout
 */
export function signOut(): void {
  clearSession();
  if (typeof window !== "undefined") {
    window.location.href = "/empresas";
  }
}

/**
 * Función: refreshToken() - Refresca el token
 * TODO: Implementar en Fase 2
 */
export async function refreshToken(): Promise<boolean> {
  // TODO: Implementar refresh token logic
  return false;
}

// TODO: Integración con sistema global de auth (Fase 2)
// TODO: Soporte para SSO (Okta, Azure, Google) - Fase 2
// TODO: MFA/2FA - Fase 2
