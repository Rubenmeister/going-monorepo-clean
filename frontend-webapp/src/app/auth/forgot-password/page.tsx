'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api-gateway-780842550857.us-central1.run.app';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Siempre mostramos éxito para no revelar si el correo existe
      setSent(true);
    } catch {
      setError('No se pudo conectar con el servidor. Intenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Panel izquierdo decorativo */}
      <div className="hidden lg:flex w-1/2 bg-[#0033A0] relative overflow-hidden flex-col justify-center items-center px-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-[#FFCD00]" />
          <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-white" />
        </div>
        <div className="relative z-10 text-center">
          <div className="w-28 h-28 bg-white/10 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-8">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                fill="#FFCD00"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white mb-4">Recupera tu cuenta</h2>
          <p className="text-blue-200 text-lg leading-relaxed">
            Te enviaremos un enlace seguro a tu correo para restablecer tu contraseña.
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

          {!sent ? (
            <>
              <h1 className="text-2xl font-black text-gray-900 mb-2">
                ¿Olvidaste tu contraseña?
              </h1>
              <p className="text-gray-500 mb-8">
                Ingresa el correo asociado a tu cuenta Going y te enviaremos instrucciones para restablecerla.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    required
                    autoFocus
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0033A0] focus:border-transparent text-gray-900 bg-gray-50 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.98] bg-[#0033A0] hover:bg-[#002680]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4" fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Enviando…
                    </span>
                  ) : (
                    'Enviar enlace de recuperación'
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Estado de éxito */
            <div className="text-center">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" fill="#059669"/>
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">
                ¡Revisa tu correo!
              </h2>
              <p className="text-gray-500 mb-2">
                Si existe una cuenta con <strong className="text-gray-700">{email}</strong>, recibirás un enlace para restablecer tu contraseña.
              </p>
              <p className="text-gray-400 text-sm mb-8">
                Revisa también tu carpeta de spam.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-[#0033A0] font-semibold hover:underline text-sm"
              >
                Intentar con otro correo
              </button>
            </div>
          )}

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
