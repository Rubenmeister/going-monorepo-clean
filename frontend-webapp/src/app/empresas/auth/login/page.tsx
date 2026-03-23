'use client';
export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

function CorporateLoginForm() {
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
      const res = await fetch('/api/empresas/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = (data?.message || '').toLowerCase();
        if (res.status === 401 || msg.includes('invalid') || msg.includes('credentials') || msg.includes('password')) {
          setError('Email o contraseña incorrectos.');
        } else if (res.status === 403 || msg.includes('no tiene') || msg.includes('permisos')) {
          setError('No tienes permisos para acceder al portal corporativo.');
        } else {
          setError(data?.message || 'Error al iniciar sesión. Intenta de nuevo.');
        }
        return;
      }

      const token = data.accessToken || data.token;
      if (!token) {
        setError('No se recibió token. Contacta a soporte.');
        return;
      }

      // Verificar que el usuario tenga rol corporativo
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const roles: string[] = Array.isArray(payload.roles) ? payload.roles : [];
        if (!roles.includes('corporate') && !roles.includes('admin') && !roles.includes('staff')) {
          setError('Esta cuenta no tiene acceso al portal corporativo.');
          return;
        }
      } catch {
        // Si no se puede decodificar, continúa (el servidor ya validó)
      }

      localStorage.setItem('authToken', token);
      localStorage.setItem('empresasToken', token);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      if (data.companyId) localStorage.setItem('companyId', data.companyId);

      const from = searchParams.get('from') ?? '/empresas/dashboard';
      window.location.href = from;

    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo */}
      <div
        className="hidden lg:flex flex-col justify-between w-5/12 p-12 relative overflow-hidden"
        style={{ backgroundColor: '#011627' }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <Image src="/going-logo-white-h.png" alt="Going" width={140} height={48} className="h-10 w-auto object-contain" priority />
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest border border-white/20 rounded px-2 py-0.5">
              Empresas
            </span>
          </div>
        </div>
        <div className="relative z-10 text-white">
          <h2 className="text-4xl font-bold mb-4 leading-tight">Portal Corporativo Going</h2>
          <p className="text-white/60 text-lg mb-10">Gestiona los viajes y servicios de tu empresa en un solo lugar.</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['🚗', 'Transporte corporativo'],
              ['🏨', 'Alojamiento ejecutivo'],
              ['📊', 'Reportes de gastos'],
              ['✅', 'Aprobaciones fáciles'],
            ].map(([icon, label]) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <span className="text-sm text-white/70">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-white/30 text-xs">© 2026 Going · Portal Corporativo</div>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <Image src="/going-logo-h.png" alt="Going" width={120} height={40} priority />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Empresas</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Acceso corporativo</h1>
            <p className="text-gray-500 mt-1">Ingresa con las credenciales de tu empresa</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email corporativo</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="nombre@empresa.com" required autoFocus
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4c41] focus:border-transparent text-gray-900 bg-gray-50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
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
                  Verificando...
                </span>
              ) : 'Acceder al Portal'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              ¿Necesitas acceso corporativo?{' '}
              <a href="mailto:empresas@goingec.com" className="text-[#ff4c41] hover:underline font-medium">
                Contacta a ventas
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CorporateLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <CorporateLoginForm />
    </Suspense>
  );
}
