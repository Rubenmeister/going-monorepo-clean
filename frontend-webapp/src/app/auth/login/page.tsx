'use client';
export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const API_GW = process.env.NEXT_PUBLIC_API_URL || 'https://api-gateway-780842550857.us-central1.run.app';

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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = (data?.message || '').toLowerCase();
        if (res.status === 401 || msg.includes('invalid') || msg.includes('credentials') || msg.includes('password') || msg.includes('incorrect')) {
          setError('Correo o contraseña incorrectos.');
        } else if (res.status === 404 || msg.includes('not found')) {
          setError('No encontramos una cuenta con ese correo. ¿Quieres registrarte?');
        } else if (res.status === 423 || msg.includes('locked')) {
          setError('Tu cuenta está bloqueada temporalmente. Intenta más tarde.');
        } else {
          setError(data?.message || 'No se pudo iniciar sesión. Intenta de nuevo.');
        }
        return;
      }

      // user-auth-service returns { accessToken, refreshToken, expiresIn, user }
      const token = data.accessToken || data.token;
      if (!token) {
        setError('Error al iniciar sesión: no se recibió token. Contacta soporte.');
        return;
      }

      localStorage.setItem('authToken', token);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);

      // Set session cookie so middleware allows access to protected routes (/ride, /payment, etc.)
      const maxAge = 60 * 60 * 24 * 7; // 7 días
      document.cookie = `going_webapp_session=1; path=/; max-age=${maxAge}; SameSite=Lax`;

      // Redirect based on role
      const roles: string[] = data.user?.roles || data.roles || [];
      const from = searchParams.get('from');
      if (from) {
        window.location.href = from;
      } else if (roles.includes('admin') || roles.includes('staff')) {
        window.location.href = '/dashboard';
      } else if (roles.includes('driver')) {
        window.location.href = '/conductores/panel';
      } else if (roles.includes('host')) {
        window.location.href = '/anfitriones/panel';
      } else if (roles.includes('operator')) {
        window.location.href = '/operadores/panel';
      } else {
        // pasajero → panel principal
        window.location.href = '/dashboard/pasajero';
      }

    } catch {
      setError('No se pudo conectar con el servidor. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-5/12 p-12 relative overflow-hidden"
        style={{
          backgroundImage: 'url(/images/MUJERES%20LLEGANDO%20AL%20AERO%20DE%20QUITO.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10">
          <Image src="/going-logo-white-h.png" alt="Going" width={180} height={62} className="h-12 w-auto object-contain" priority />
        </div>
        <div className="relative z-10 text-white">
          <h2 className="text-4xl font-bold mb-4 leading-tight">La plataforma de movilidad y servicios de Ecuador</h2>
          <p className="text-white/80 text-lg mb-10">Transporte, alojamiento, tours y mucho más. Todo en un lugar.</p>
          <div className="grid grid-cols-3 gap-4">
            {[['1M+','Usuarios'],['50+','Ciudades'],['5★','Calificación']].map(([n,l]) => (
              <div key={l} className="bg-white/10 rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold">{n}</div>
                <div className="text-white/70 text-xs mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-white/50 text-xs">© 2026 Going · Ecuador</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Image src="/going-logo-h.png" alt="Going" width={160} height={50} priority />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido de vuelta</h1>
          <p className="text-gray-500 mb-8">Ingresa a tu cuenta para continuar</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          {/* Social login */}
          <div className="space-y-3 mb-6">
            <a
              href={`${API_GW}/auth/google`}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-xl font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
            >
              <svg width="20" height="20" viewBox="0 0 48 48" fill="none"><path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" fill="#4285F4"/><path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z" fill="#34A853"/><path d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371021 20.0112 -0.371021 28.0009 3.03298 34.7825L11.0051 28.6006Z" fill="#FBBC04"/><path d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" fill="#EA4335"/></svg>
              Continuar con Google
            </a>
            <a
              href={`${API_GW}/auth/facebook`}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium text-white transition-all shadow-sm hover:shadow-md"
              style={{ backgroundColor: '#1877F2' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Continuar con Facebook
            </a>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-sm"><span className="px-3 bg-white text-gray-400">o continúa con email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Correo electrónico</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com" required
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4c41] focus:border-transparent text-gray-900 bg-gray-50 transition-all"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Contraseña</label>
                <Link href="/auth/forgot-password" className="text-xs text-[#ff4c41] hover:underline font-medium">¿Olvidaste tu contraseña?</Link>
              </div>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4c41] focus:border-transparent text-gray-900 bg-gray-50 transition-all"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-60 shadow-sm hover:shadow-md active:scale-[0.98]"
              style={{ backgroundColor: '#ff4c41' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Iniciando sesión...
                </span>
              ) : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-500 text-sm">
              ¿No tienes cuenta?{' '}
              <Link href="/auth/register" className="text-[#ff4c41] font-semibold hover:underline">Regístrate gratis</Link>
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {['🚗 Transporte','🏨 Alojamiento','🗺️ Tours','📦 Envíos'].map(s => (
              <span key={s} className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full">{s}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginForm />
    </Suspense>
  );
}
