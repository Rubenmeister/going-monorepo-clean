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
      const res = await fetch(`${API_GW}/auth/corporate/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          setError('Credenciales incorrectas o tu cuenta no tiene acceso corporativo.');
        } else if (res.status === 429) {
          setError(data?.message ?? 'Cuenta bloqueada temporalmente por demasiados intentos. Intenta más tarde.');
        } else {
          setError(data?.message ?? 'Error al iniciar sesión. Intenta de nuevo.');
        }
        return;
      }

      persistSession(data);
      router.push('/dashboard');
    } catch {
      setError('Error de red. Verifica tu conexión e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const oauthHref = (provider: 'google' | 'facebook') =>
    `${API_GW}/auth/oauth/${provider}?app=corporate`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#011627' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl font-black tracking-tight" style={{ color: '#ff4c41' }}>
              Going
            </span>
            <span className="text-lg font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Empresas
            </span>
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Portal Corporativo
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Iniciar sesión</h2>
          <p className="text-sm text-gray-500 mb-6">Accede al portal corporativo de tu empresa</p>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2 mb-5">
            <a href={oauthHref('google')}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-200 rounded-xl font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all text-sm">
              Continuar con Google
            </a>
          </div>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-400">o con tu correo corporativo</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Correo corporativo</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com" autoFocus
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white transition-opacity disabled:opacity-50 text-sm mt-2"
              style={{ backgroundColor: '#ff4c41' }}>
              {loading ? 'Verificando...' : 'Acceder al Portal'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Going Empresas — Solo personal autorizado
        </p>
      </div>
    </div>
  );
}
