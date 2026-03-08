'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../store';
import AppShell from '../components/AppShell';

export default function SecurityPage() {
  const { token, isReady, init } = useAuth();
  const router = useRouter();
  const [twoFA, setTwoFA] = useState(false);
  const [biometric, setBiometric] = useState(false);

  useEffect(() => {
    init();
  }, [init]);
  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  return (
    <AppShell title="Seguridad">
      {/* Header */}
      <div
        className="px-5 py-8 relative overflow-hidden"
        style={{ backgroundColor: '#011627' }}
      >
        <div
          className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10"
          style={{ backgroundColor: '#ff4c41' }}
        />
        <p className="text-white/50 text-sm mb-1">Protege tu cuenta</p>
        <h1 className="text-2xl font-black text-white">Seguridad</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Password */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Contraseña
          </p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
              <span className="text-lg w-6 text-center">🔑</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-gray-900">
                  Cambiar contraseña
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Última actualización hace 30 días
                </p>
              </div>
              <span className="text-gray-300">›</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors">
              <span className="text-lg w-6 text-center">📧</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-gray-900">
                  Verificar correo
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Verificado ✓</p>
              </div>
              <span className="text-gray-300">›</span>
            </button>
          </div>
        </div>

        {/* 2FA */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Autenticación
          </p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
              <span className="text-lg w-6 text-center">🛡️</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">
                  Autenticación de dos factores
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Protección adicional para tu cuenta
                </p>
              </div>
              <button
                onClick={() => setTwoFA(!twoFA)}
                className="w-12 h-7 rounded-full transition-all duration-300 relative flex-shrink-0"
                style={{ backgroundColor: twoFA ? '#ff4c41' : '#d1d5db' }}
              >
                <span
                  className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all duration-300"
                  style={{ left: twoFA ? '22px' : '2px' }}
                />
              </button>
            </div>
            <div className="flex items-center gap-3 px-4 py-4">
              <span className="text-lg w-6 text-center">👆</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">
                  Acceso biométrico
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Huella dactilar / Face ID
                </p>
              </div>
              <button
                onClick={() => setBiometric(!biometric)}
                className="w-12 h-7 rounded-full transition-all duration-300 relative flex-shrink-0"
                style={{ backgroundColor: biometric ? '#ff4c41' : '#d1d5db' }}
              >
                <span
                  className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all duration-300"
                  style={{ left: biometric ? '22px' : '2px' }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Sesiones activas
          </p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {[
              {
                device: 'Chrome — Windows',
                location: 'Quito, Ecuador',
                active: true,
              },
              {
                device: 'Safari — iPhone 15',
                location: 'Quito, Ecuador',
                active: false,
              },
            ].map((s, i, arr) => (
              <div
                key={s.device}
                className="flex items-center gap-3 px-4 py-4"
                style={
                  i < arr.length - 1
                    ? { borderBottom: '1px solid #f3f4f6' }
                    : {}
                }
              >
                <span className="text-lg w-6 text-center">
                  {s.active ? '💻' : '📱'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {s.device}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.location}</p>
                </div>
                {s.active ? (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: '#f0fdf4', color: '#22c55e' }}
                  >
                    Actual
                  </span>
                ) : (
                  <button className="text-xs text-red-400 font-medium flex-shrink-0">
                    Cerrar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
