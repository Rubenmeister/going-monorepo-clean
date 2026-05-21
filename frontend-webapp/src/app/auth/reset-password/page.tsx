'use client';
export const dynamic = 'force-dynamic';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api-gateway-780842550857.us-central1.run.app';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Token vacío = enlace inválido (alguien entró directo, no por el email)
  if (!token) {
    return (
      <div className="text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#DC2626"/>
          </svg>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-3">Enlace inválido</h2>
        <p className="text-gray-500 mb-8">
          Este enlace no contiene un token válido. Solicita uno nuevo desde la pantalla de recuperación.
        </p>
        <Link
          href="/auth/forgot-password"
          className="inline-block px-6 py-3 rounded-xl bg-[#0033A0] text-white font-semibold hover:bg-[#002680] transition-colors"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 12) {
      setError('La contraseña debe tener al menos 12 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Mapeamos errores comunes del backend a mensajes claros
        const msg = String(data?.message || '').toLowerCase();
        if (msg.includes('token') && (msg.includes('expired') || msg.includes('expir'))) {
          setError('El enlace expiró. Solicita uno nuevo desde "¿Olvidaste tu contraseña?".');
        } else if (msg.includes('invalid') || msg.includes('not found')) {
          setError('Este enlace ya no es válido. Solicita uno nuevo.');
        } else {
          setError(data?.message || 'No se pudo restablecer la contraseña. Intenta de nuevo.');
        }
        return;
      }

      setSuccess(true);
      // Redirige al login con hard navigation (window.location) en lugar de
      // router.push — el SPA navigation a veces deja la siguiente pantalla
      // en blanco por hydration mismatch tras un form submit que cambia auth state.
      setTimeout(() => {
        window.location.href = '/auth/login?reset=ok';
      }, 3000);
    } catch {
      setError('No se pudo conectar con el servidor. Intenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#059669"/>
          </svg>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-3">¡Listo!</h2>
        <p className="text-gray-500 mb-2">
          Tu contraseña fue actualizada correctamente.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Te redirigimos al inicio de sesión en un momento…
        </p>
        <Link
          href="/auth/login"
          className="inline-block px-6 py-3 rounded-xl bg-[#0033A0] text-white font-semibold hover:bg-[#002680] transition-colors"
        >
          Ir al login ahora
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-black text-gray-900 mb-2">Nueva contraseña</h1>
      <p className="text-gray-500 mb-8">
        Elegí una contraseña fuerte de al menos 12 caracteres.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">
            Contraseña nueva
          </label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 12 caracteres"
              required
              autoFocus
              minLength={12}
              className="w-full px-4 py-3.5 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0033A0] focus:border-transparent text-gray-900 bg-gray-50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPwd(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-sm font-medium"
              tabIndex={-1}
            >
              {showPwd ? 'Ocultar' : 'Ver'}
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">
            Confirmar contraseña
          </label>
          <input
            type={showPwd ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repite la contraseña"
            required
            minLength={12}
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0033A0] focus:border-transparent text-gray-900 bg-gray-50 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !password || !confirm}
          className="w-full py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.98] bg-[#0033A0] hover:bg-[#002680]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Actualizando…
            </span>
          ) : (
            'Restablecer contraseña'
          )}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Panel izquierdo decorativo — mismo patrón que /auth/forgot-password */}
      <div className="hidden lg:flex w-1/2 bg-[#0033A0] relative overflow-hidden flex-col justify-center items-center px-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-[#FFCD00]" />
          <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-white" />
        </div>
        <div className="relative z-10 text-center">
          <div className="w-28 h-28 bg-white/10 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-8">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
                fill="#FFCD00"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white mb-4">Casi listo</h2>
          <p className="text-blue-200 text-lg leading-relaxed">
            Estás a un paso de recuperar tu cuenta Going. Elegí una contraseña que recuerdes.
          </p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-16 h-16 bg-[#0033A0] rounded-2xl flex items-center justify-center">
              <span className="text-[#FFCD00] font-black text-xl">G</span>
            </div>
          </div>

          {/* Suspense necesario porque useSearchParams() es async-aware en App Router */}
          <Suspense fallback={
            <div className="text-center py-12">
              <svg className="animate-spin h-8 w-8 mx-auto text-[#0033A0]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>

          <div className="mt-8 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-gray-500 hover:text-[#0033A0] font-medium transition-colors"
            >
              ← Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
