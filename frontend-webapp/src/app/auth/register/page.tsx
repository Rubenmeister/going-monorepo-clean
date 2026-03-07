'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Image from 'next/image';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';

export default function RegisterPage() {
  const { domain } = useMonorepoApp();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await domain.auth.register({ ...form, roles: ['user'] });
      window.location.href = '/';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
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
            src="/going-logo.png"
            alt="Going"
            width={160}
            height={110}
            className="brightness-0 invert"
            priority
          />
        </div>

        {/* Center content */}
        <div className="relative z-10 text-white">
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Únete a la comunidad Going
          </h2>
          <p className="text-white/80 text-lg mb-10">
            Regístrate gratis y empieza a explorar todos nuestros servicios.
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            {[
              { icon: '✓', text: 'Reserva transporte al instante' },
              { icon: '✓', text: 'Alojamiento verificado y seguro' },
              { icon: '✓', text: 'Tours con guías locales expertos' },
              { icon: '✓', text: 'Envíos express en todo Ecuador' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {item.icon}
                </div>
                <span className="text-white/90 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10 text-white/50 text-xs">
          © 2026 Going · Ecuador
        </div>
      </div>

      {/* Right panel — Register form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-4">
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
            Crear tu cuenta
          </h1>
          <p className="text-gray-500 mb-8">Es gratis y solo toma un minuto</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  name="firstName"
                  type="text"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="Juan"
                  required
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4c41] focus:border-transparent text-gray-900 bg-gray-50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Apellido
                </label>
                <input
                  name="lastName"
                  type="text"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Pérez"
                  required
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4c41] focus:border-transparent text-gray-900 bg-gray-50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Correo electrónico
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                required
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4c41] focus:border-transparent text-gray-900 bg-gray-50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="+593 99 000 0000"
                required
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4c41] focus:border-transparent text-gray-900 bg-gray-50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
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
                  Creando cuenta...
                </span>
              ) : (
                'Crear Cuenta Gratis'
              )}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Al registrarte aceptas nuestros{' '}
              <span className="text-[#ff4c41] cursor-pointer hover:underline">
                Términos de servicio
              </span>{' '}
              y{' '}
              <span className="text-[#ff4c41] cursor-pointer hover:underline">
                Política de privacidad
              </span>
            </p>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-500 text-sm">
              ¿Ya tienes cuenta?{' '}
              <a
                href="/auth/login"
                className="text-[#ff4c41] font-semibold hover:underline"
              >
                Inicia sesión
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
