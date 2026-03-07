'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Image from 'next/image';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';

export default function LoginPage() {
  const { domain } = useMonorepoApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await domain.auth.login({ email, password });
      window.location.href = '/';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — Going Red brand */}
      <div
        className="hidden lg:flex flex-col justify-between w-5/12 p-12 relative overflow-hidden"
        style={{ backgroundColor: '#ff4c41' }}
      >
        {/* Background decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 bg-white -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10 bg-white translate-y-1/2 -translate-x-1/3" />

        {/* Logo */}
        <div className="relative z-10">
          <Image
            src="/going-logo-white-h.png"
            alt="Going"
            width={180}
            height={62}
            className="h-12 w-auto object-contain"
            priority
          />
        </div>

        {/* Center content */}
        <div className="relative z-10 text-white">
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            La plataforma de movilidad y servicios de Ecuador
          </h2>
          <p className="text-white/80 text-lg mb-10">
            Transporte, alojamiento, tours y mucho más. Todo en un lugar.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold">1M+</div>
              <div className="text-white/70 text-xs mt-1">Usuarios</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold">50+</div>
              <div className="text-white/70 text-xs mt-1">Ciudades</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold">5★</div>
              <div className="text-white/70 text-xs mt-1">Calificación</div>
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10 text-white/50 text-xs">
          © 2026 Going · Ecuador
        </div>
      </div>

      {/* Right panel — Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Image
              src="/going-logo-h.png"
              alt="Going"
              width={160}
              height={50}
              priority
            />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenido de vuelta
          </h1>
          <p className="text-gray-500 mb-8">
            Ingresa a tu cuenta para continuar
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4c41] focus:border-transparent text-gray-900 bg-gray-50 transition-all"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  Contraseña
                </label>
                <button
                  type="button"
                  className="text-xs text-[#ff4c41] hover:underline font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4c41] focus:border-transparent text-gray-900 bg-gray-50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.98]"
              style={{ backgroundColor: '#ff4c41' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-500 text-sm">
              ¿No tienes cuenta?{' '}
              <a
                href="/auth/register"
                className="text-[#ff4c41] font-semibold hover:underline"
              >
                Regístrate gratis
              </a>
            </p>
          </div>

          {/* Service badges */}
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {['🚗 Transporte', '🏨 Alojamiento', '🗺️ Tours', '📦 Envíos'].map(
              (s) => (
                <span
                  key={s}
                  className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full"
                >
                  {s}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
