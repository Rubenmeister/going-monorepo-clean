/**
 * Callback de Google OAuth para flujo corporativo.
 * Ruta: /empresas/auth/google/callback?token=...&isNewUser=...
 *
 * El backend user-auth-service tras autenticar con Google redirige acá con:
 *   - token: accessToken JWT (válido para llamar al API)
 *   - isNewUser: 'true' | 'false'
 *
 * Pasos:
 *   1. Validar token usando GET /auth/me
 *   2. Verificar que el usuario tiene companyId asociado
 *      - Si no → mostrar "Tu cuenta no está vinculada a una empresa"
 *   3. Guardar sesión en localStorage (igual que login con password)
 *   4. Redirect a /empresas/panel
 *
 * NO se intenta auto-vincular por dominio del email — eso requiere flujo
 * de aprobación admin (Camino 2C Fase 2 si se requiere).
 */
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_INFO_KEY } from "@/lib/empresas/constants";

function GoogleCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<"validating" | "success" | "no-company" | "error">("validating");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const token = params.get("token") ?? "";
    const isNewUser = params.get("isNewUser") === "true";

    if (!token) {
      setStatus("error");
      setErrorMsg("Falta el token de autenticación en la URL.");
      return;
    }

    (async () => {
      try {
        // 1. Validar token + obtener user info
        const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!meRes.ok) {
          setStatus("error");
          setErrorMsg("El token recibido no es válido. Intenta iniciar sesión de nuevo.");
          return;
        }
        const meData = await meRes.json();

        // El JWT incluye companyId si el user pertenece a una empresa
        const payload = decodeJwt(token);
        const companyId = payload?.companyId ?? meData?.companyId;

        if (!companyId) {
          setStatus("no-company");
          return;
        }

        // 2. Guardar sesión empresarial
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        // refreshToken no viene en el callback OAuth — solo accessToken.
        // El user puede refrescar haciendo login con password, o reauth con
        // Google. Por ahora dejamos refreshToken vacío.
        localStorage.removeItem(REFRESH_TOKEN_KEY);

        const userInfo = {
          id: payload?.sub ?? meData?.userId,
          email: payload?.email ?? meData?.email,
          firstName: meData?.firstName ?? "",
          lastName: meData?.lastName ?? "",
          roles: meData?.roles ?? payload?.roles ?? [],
          companyId,
          tipoCuenta: payload?.tipoCuenta ?? meData?.tipoCuenta,
        };
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));

        setStatus("success");
        // Pequeño delay para que el user vea el mensaje verde antes del redirect.
        setTimeout(() => router.replace("/empresas/panel"), 500);
      } catch (e) {
        setStatus("error");
        setErrorMsg(e instanceof Error ? e.message : "Error inesperado");
      }
    })();
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-8 text-center">
        {status === "validating" && (
          <>
            <div className="w-10 h-10 mx-auto mb-4 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <h1 className="text-lg font-bold text-slate-900 mb-1">Validando sesión…</h1>
            <p className="text-sm text-slate-500">Estamos verificando tu cuenta con Going.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-4xl mb-3">✅</div>
            <h1 className="text-lg font-bold text-slate-900 mb-1">¡Bienvenido!</h1>
            <p className="text-sm text-slate-500">Redirigiendo al panel…</p>
          </>
        )}

        {status === "no-company" && (
          <>
            <div className="text-4xl mb-3">🏢</div>
            <h1 className="text-lg font-bold text-slate-900 mb-2">
              Tu cuenta no está vinculada a una empresa
            </h1>
            <p className="text-sm text-slate-600 mb-5">
              Iniciaste sesión con Google correctamente, pero tu correo aún no
              está asociado a ningún cliente corporativo de Going. Pide a tu
              administrador que te invite, o solicita una cuenta nueva.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push("/empresas/solicitud")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                Solicitar acceso
              </button>
              <button
                onClick={() => router.push("/empresas/auth/login")}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
              >
                Volver al login
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-4xl mb-3">⚠️</div>
            <h1 className="text-lg font-bold text-slate-900 mb-2">No pudimos completar el login</h1>
            <p className="text-sm text-slate-600 mb-5">{errorMsg}</p>
            <button
              onClick={() => router.push("/empresas/auth/login")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              Volver al login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(b64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Cargando…</div>}>
      <GoogleCallbackInner />
    </Suspense>
  );
}
