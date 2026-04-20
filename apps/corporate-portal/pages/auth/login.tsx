import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { persistSession, useSession } from '../../lib/auth';

const API_GW =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api-gateway-780842550857.us-central1.run.app';

export default function Login() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (status === 'authenticated') router.push('/dashboard');
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Usamos el endpoint corporate/login para validar que el usuario
      // tenga rol 'corporate' o 'admin' y recibir companyId.
      const res = await fetch(`${API_GW}/auth/corporate/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          setError(
            'Credenciales incorrectas o tu cuenta no tiene acceso corporativo.'
          );
        } else if (res.status === 429) {
          setError(
            data?.message ??
              'Cuenta bloqueada temporalmente por demasiados intentos. Intenta más tarde.'
          );
        } else {
          setError(data?.message ?? 'Error al iniciar sesión. Intenta de nuevo.');
        }
        return;
      }

      const token = data.accessToken ?? data.token;
      if (!token) {
        setError('No se recibió token del servidor.');
        return;
      }

      persistSession({
        accessToken: token,
        refreshToken: data.refreshToken,
        user: {
          id: data.user?.id,
          email: data.user?.email,
          name:
            data.user?.name ??
            [data.user?.firstName, data.user?.lastName].filter(Boolean).join(' '),
          roles: data.user?.roles,
          companyId: data.companyId,
          companyName: data.companyName,
        },
      });

      router.push('/dashboard');
    } catch {
      setError('Error al iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // OAuth con returnTo apuntando al callback de este mismo dominio
  const oauthHref = (provider: 'google' | 'facebook') =>
    `${API_GW}/auth/${provider}?returnTo=${encodeURIComponent(
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : ''
    )}`;

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{ backgroundColor: '#011627' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span
              className="text-3xl font-black tracking-tight"
              style={{ color: '#ff4c41' }}
            >
              Going
            </span>
            <span
              className="text-lg font-semibold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Empresas
            </span>
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Portal Corporativo
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Iniciar sesión
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Accede al portal corporativo de tu empresa
          </p>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* OAuth */}
          <div className="space-y-2 mb-5">
            <a
              href={oauthHref('google')}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-200 rounded-xl font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" fill="#4285F4"/><path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z" fill="#34A853"/><path d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371021 20.0112 -0.371021 28.0009 3.03298 34.7825L11.0051 28.6006Z" fill="#FBBC04"/><path d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" fill="#EA4335"/></svg>
              Continuar con Google
            </a>
          </div>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-400">
                o con tu correo corporativo
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Correo corporativo
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white transition-opacity disabled:opacity-50 text-sm mt-2"
              style={{ backgroundColor: '#ff4c41' }}
            >
              {loading ? '🔄 Verificando...' : 'Acceder al Portal'}
            </button>
          </form>
        </div>

        <p
          className="text-center text-xs mt-6"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          Going Empresas — Solo personal autorizado
        </p>
      </div>
    </div>
  );
}
