/**
 * Página de Login para Empresas
 * Ruta: /empresas/auth/login
 *
 * Soporta 3 flujos:
 *   1. Email + password → success directo
 *   2. Email + password → MFA challenge → input TOTP code → success
 *   3. "Continuar con Google" → redirige a backend OAuth → callback /empresas/auth/google/callback
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, verifyMfaLogin } from "@/lib/empresas/auth";
import { API_BASE_URL } from "@/lib/empresas/constants";
import Link from "next/link";

type Stage = "credentials" | "mfa";

export default function LoginPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn(email, password);
      if (result.success) {
        router.push("/empresas/panel");
        return;
      }
      if (result.mfaRequired && result.mfaToken) {
        // Avanzamos al segundo paso (input MFA code)
        setMfaToken(result.mfaToken);
        setStage("mfa");
        return;
      }
      setError(result.error ?? "Email o contraseña incorrectos");
    } catch (err) {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await verifyMfaLogin(mfaToken, mfaCode.trim());
      if (result.success) {
        router.push("/empresas/panel");
        return;
      }
      setError(result.error ?? "Código inválido");
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  function handleGoogleLogin() {
    if (typeof window === "undefined") return;
    const returnTo = `${window.location.origin}/empresas/auth/google/callback`;
    window.location.href = `${API_BASE_URL}/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        {/* Logo */}
        <Link href="/" className="block text-center">
          <p className="text-2xl font-bold text-blue-600">Going</p>
          <p className="text-xs text-slate-600 mt-1">Para Empresas</p>
        </Link>

        {/* Heading */}
        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            {stage === "credentials" ? "Ingresar" : "Verificación en dos pasos"}
          </h1>
          <p className="text-slate-600 text-sm mt-2">
            {stage === "credentials"
              ? "Accede a tu cuenta corporativa"
              : useRecoveryCode
              ? "Ingresa uno de tus códigos de recuperación"
              : "Ingresa el código de 6 dígitos de tu app autenticadora"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Stage: credentials */}
        {stage === "credentials" && (
          <>
            <form onSubmit={handleCredentialsSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-900 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="correo@empresa.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-900 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                {loading ? "Cargando..." : "Ingresar"}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <span className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 tracking-wider">o sino</span>
              <span className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Google SSO */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 border border-slate-300 rounded-lg py-2 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-sm font-semibold text-slate-700">Continuar con Google</span>
            </button>
          </>
        )}

        {/* Stage: MFA */}
        {stage === "mfa" && (
          <form onSubmit={handleMfaSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="mfa-code" className="block text-sm font-semibold text-slate-900 mb-1">
                {useRecoveryCode ? "Código de recuperación" : "Código de 6 dígitos"}
              </label>
              <input
                type="text"
                id="mfa-code"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-center tracking-widest"
                placeholder={useRecoveryCode ? "XXXX-XXXX" : "000000"}
                inputMode={useRecoveryCode ? "text" : "numeric"}
                maxLength={useRecoveryCode ? 9 : 6}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || mfaCode.length < 6}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              {loading ? "Verificando..." : "Verificar"}
            </button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => { setUseRecoveryCode(!useRecoveryCode); setMfaCode(""); setError(null); }}
                className="text-blue-600 hover:text-blue-700"
              >
                {useRecoveryCode
                  ? "← Usar código de 6 dígitos"
                  : "¿Perdiste el dispositivo? Usar código de recuperación"}
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setStage("credentials"); setMfaToken(""); setMfaCode(""); setError(null); }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Cancelar y volver
              </button>
            </div>
          </form>
        )}

        {/* Links (solo en stage credentials) */}
        {stage === "credentials" && (
          <>
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                ¿Aún no tienes cuenta?{" "}
                <Link href="/empresas/solicitud" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Solicita acceso
                </Link>
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 text-center">
              <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
                ← Volver a Going
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
