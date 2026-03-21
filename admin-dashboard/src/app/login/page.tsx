'use client';
export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { domain }   = useMonorepoApp();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await domain.auth.login({ email, password });
      const from = searchParams.get('from') ?? '/';
      router.push(from);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('fetch') || msg.includes('network') || msg === '') {
        setError('No se pudo conectar al servidor. Verifica tu conexión o contacta a soporte.');
      } else if (msg.includes('401') || msg.includes('403') || msg.toLowerCase().includes('credencial') || msg.toLowerCase().includes('invalid')) {
        setError('Email o contraseña incorrectos.');
      } else {
        setError(msg || 'Error al iniciar sesión. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🛡️</div>
          <h1 className="text-3xl font-bold text-gray-900">Panel Admin</h1>
          <p className="text-gray-500 mt-1">
            Acceso exclusivo para administradores
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email de administrador
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@going.com"
              required
              autoFocus
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-gray-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            style={{ backgroundColor: '#ff4c41' }}
          >
            {loading ? '🔄 Verificando...' : 'Acceder al Panel'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            ¿Olvidaste tu contraseña?{' '}
            <a
              href="mailto:soporte@goingec.com?subject=Recuperación de acceso admin"
              className="text-indigo-500 hover:text-indigo-700 font-medium underline"
            >
              Contacta a soporte
            </a>
          </p>
          <p className="text-xs text-gray-300 mt-3">
            Going Admin Dashboard — Solo personal autorizado
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800" />}>
      <LoginForm />
    </Suspense>
  );
}
