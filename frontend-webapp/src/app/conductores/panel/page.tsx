'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DriverUser {
  firstName?: string;
  email?: string;
  roles?: string[];
}

function parseJwt(token: string): DriverUser | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export default function DriverPanelPage() {
  const [user, setUser] = useState<DriverUser | null>(null);
  const [status, setStatus] = useState<'loading' | 'pending' | 'active' | 'suspended'>('loading');

  useEffect(() => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/auth/login?from=/conductores/panel';
      return;
    }
    const decoded = parseJwt(token);
    if (!decoded || !decoded.roles?.includes('driver')) {
      window.location.href = '/auth/login?from=/conductores/panel';
      return;
    }
    setUser(decoded);
    // Status simulado: en producción vendría del backend
    setStatus('pending');
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#ff4c41] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const firstName = (user as any)?.email?.split('@')[0] || 'Conductor';

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="text-white py-8 px-6" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/" className="text-gray-400 text-xs hover:text-white mb-2 inline-block">← Inicio</Link>
            <h1 className="text-2xl font-bold text-white">Hola, {firstName} 👋</h1>
            <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
          </div>
          <button
            onClick={() => { localStorage.removeItem('authToken'); localStorage.removeItem('auth_token'); window.location.href = '/'; }}
            className="text-xs text-gray-400 hover:text-white border border-gray-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Estado de cuenta */}
        {status === 'pending' && (
          <div className="rounded-2xl p-5 border" style={{ background: '#fefce8', borderColor: '#fde68a' }}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="font-bold text-yellow-800">Tu cuenta está en revisión</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Nuestro equipo está verificando tus documentos. El proceso toma 1–2 días hábiles.
                  Te notificaremos por correo cuando tu cuenta esté activa.
                </p>
                <Link
                  href="/conductores/registro"
                  className="inline-block mt-3 text-sm font-semibold text-yellow-800 underline hover:text-yellow-900"
                >
                  ¿Aún no enviaste tus documentos? Hacerlo ahora →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Accesos rápidos */}
        <div>
          <h2 className="text-base font-bold text-gray-700 mb-3 uppercase tracking-wide text-xs">Accesos rápidos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: '📂', label: 'Mis documentos', href: '/conductores/registro', desc: 'Ver y actualizar' },
              { icon: '📚', label: 'Academia Going', href: '/academy', desc: 'Cursos gratuitos' },
              { icon: '💬', label: 'Soporte', href: '/contact', desc: 'Escríbenos' },
              { icon: '📋', label: 'Requisitos', href: '/conductores#requisitos', desc: 'Ver documentos' },
            ].map(item => (
              <Link
                key={item.label}
                href={item.href}
                className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-[#ff4c41] hover:shadow-md transition-all group"
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="font-semibold text-sm text-gray-900 group-hover:text-[#ff4c41]">{item.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Estadísticas (placeholder) */}
        <div>
          <h2 className="text-base font-bold text-gray-700 mb-3 uppercase tracking-wide text-xs">Tu actividad</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: '—', label: 'Viajes realizados' },
              { value: '—', label: 'Calificación' },
              { value: '—', label: 'Ganancias este mes' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
                <div className="text-2xl font-bold text-gray-300 mb-1">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Las estadísticas estarán disponibles cuando tu cuenta esté activa.
          </p>
        </div>

        {/* Próximos pasos */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Próximos pasos</h2>
          <div className="space-y-3">
            {[
              { done: true, text: 'Crear tu cuenta Going' },
              { done: false, text: 'Enviar documentos de verificación', link: '/conductores/registro' },
              { done: false, text: 'Esperar aprobación (1–2 días hábiles)' },
              { done: false, text: 'Descargar la app Going Driver' },
              { done: false, text: 'Comenzar a recibir viajes' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  step.done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step.done ? '✓' : i + 1}
                </div>
                {step.link ? (
                  <Link href={step.link} className="text-sm text-[#ff4c41] font-medium hover:underline">
                    {step.text} →
                  </Link>
                ) : (
                  <span className={`text-sm ${step.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {step.text}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
