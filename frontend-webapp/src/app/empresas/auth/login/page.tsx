/**
 * Página de Login para Empresas
 * Ruta: /empresas/auth/login
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/empresas/auth";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn(email, password);
      if (result.success) {
        router.push("/empresas/panel");
      } else {
        setError(result.error ?? "Email o contraseña incorrectos");
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-slate-900">Ingresar</h1>
          <p className="text-slate-600 text-sm mt-2">
            Accede a tu cuenta corporativa
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

        {/* Links */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            ¿Aún no tienes cuenta?{" "}
            <Link href="/empresas/solicitud" className="text-blue-600 hover:text-blue-700 font-semibold">
              Solicita acceso
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
            ← Volver a Going
          </Link>
        </div>
      </div>

      {/* TODO: SSO (Okta, Azure, Google) - Fase 2 */}
      {/* TODO: MFA/2FA - Fase 2 */}
    </main>
  );
}
