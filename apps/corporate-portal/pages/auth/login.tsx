import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

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
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError('Credenciales incorrectas. Verifica tu email y contraseña.');
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch {
      setError('Error al iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSSO = async (provider: string) => {
    setLoading(true);
    try {
      await signIn(provider, { redirect: true, callbackUrl: '/dashboard' });
    } catch {
      setError(`Error con ${provider}. Inténtalo de nuevo.`);
      setLoading(false);
    }
  };

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

          {/* SSO */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-400">
                  o accede con SSO
                </span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { id: 'okta', label: 'Okta' },
                { id: 'azure-ad', label: 'Azure AD' },
                { id: 'google-workspace', label: 'Google' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => handleSSO(id)}
                  disabled={loading}
                  className="py-2 px-3 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 transition disabled:opacity-50"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
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
