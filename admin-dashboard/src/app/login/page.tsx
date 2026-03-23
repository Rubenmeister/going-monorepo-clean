'use client';
export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const AUTH_SERVICE =
  process.env.AUTH_SERVICE_URL ||
  'https://user-auth-service-780842550857.us-central1.run.app';

const AUTH_TOKEN_KEY = 'authToken';
const SESSION_COOKIE = 'going_admin_session';

function setSessionCookie(value: boolean) {
  if (value) {
    document.cookie = `${SESSION_COOKIE}=1; path=/; SameSite=Strict`;
  } else {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Strict`;
  }
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${AUTH_SERVICE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = (data?.message || '').toLowerCase();
        if (res.status === 401 || msg.includes('invalid') || msg.includes('credentials') || msg.includes('password')) {
          setError('Email o contraseña incorrectos.');
        } else {
          setError(data?.message || 'Error al iniciar sesión. Intenta de nuevo.');
        }
        return;
      }

      const token = data.accessToken || data.token;
      if (!token) {
        setError('No se recibió token del servidor. Contacta a soporte.');
        return;
      }

      // Verificar rol admin en el JWT
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const roles: string[] = Array.isArray(payload.roles) ? payload.roles : [];
        if (!roles.includes('admin') && !roles.includes('staff')) {
          setError('No tienes permisos de administrador para acceder a este panel.');
          return;
        }
      } catch {
        setError('Token inválido. Contacta a soporte.');
        return;
      }

      // Token válido con rol admin confirmado
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      setSessionCookie(true);

      const from = searchParams.get('from') ?? '/';
      window.location.href = from;

    } catch {
      setError('No se pudo conectar al servidor. Verifica tu conexión.');
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
          <p className="text-gray-500 mt-1">Acceso exclusivo para administradores</p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email de administrador</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@going.com" required autoFocus
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-gray-50"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-3 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            style={{ backgroundColor: '#ff4c41' }}
          >
            {loading ? '🔄 Verificando...' : 'Acceder al Panel'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            ¿Olvidaste tu contraseña?{' '}
            <a href="mailto:soporte@goingec.com?subject=Recuperación de acceso admin"
              className="text-indigo-500 hover:text-indigo-700 font-medium underline">
              Contacta a soporte
            </a>
          </p>
          <p className="text-xs text-gray-300 mt-3">Going Admin Dashboard — Solo personal autorizado</p>
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
