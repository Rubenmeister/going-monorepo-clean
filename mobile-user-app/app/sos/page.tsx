'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../store';
import AppShell from '../components/AppShell';

export default function SosPage() {
  const { token, isReady, init } = useAuth();
  const router = useRouter();
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    init();
  }, [init]);
  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  return (
    <AppShell title="SOS">
      {/* Emergency header */}
      <div
        className="px-5 py-8 relative overflow-hidden"
        style={{ backgroundColor: '#7f1d1d' }}
      >
        <div
          className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-20"
          style={{ backgroundColor: '#ef4444' }}
        />
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🚨</span>
          <div>
            <p className="text-red-300 text-sm font-medium">Emergencias</p>
            <h1 className="text-2xl font-black text-white">SOS Going</h1>
          </div>
        </div>
        <p className="text-red-200/70 text-sm">
          En caso de emergencia, usa el botón de alerta o llama directamente a
          los servicios de emergencia.
        </p>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* SOS Button */}
        <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
          <p className="text-sm font-bold text-gray-700 mb-4">
            Presiona para activar alerta de emergencia
          </p>
          <button
            onClick={() => setActivated(!activated)}
            className="w-32 h-32 rounded-full mx-auto flex flex-col items-center justify-center font-black text-white text-xl shadow-lg transition-all active:scale-95"
            style={{
              backgroundColor: activated ? '#dc2626' : '#ef4444',
              boxShadow: activated
                ? '0 0 0 8px rgba(239,68,68,0.3), 0 0 0 16px rgba(239,68,68,0.1)'
                : '0 4px 20px rgba(239,68,68,0.4)',
            }}
          >
            <span className="text-4xl mb-1">🚨</span>
            <span className="text-xs font-bold tracking-widest">
              {activated ? 'ACTIVO' : 'SOS'}
            </span>
          </button>
          {activated && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm font-bold text-red-600">
                ⚠️ Alerta enviada
              </p>
              <p className="text-xs text-red-400 mt-0.5">
                Tu ubicación ha sido compartida con el equipo Going
              </p>
            </div>
          )}
        </div>

        {/* Emergency contacts */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Contactos de emergencia
          </p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {[
              { icon: '🚒', label: 'Bomberos', number: '102' },
              { icon: '🚑', label: 'Ambulancia', number: '911' },
              { icon: '👮', label: 'Policía Nacional', number: '101' },
              {
                icon: '💬',
                label: 'Soporte Going 24/7',
                number: '+593 2 123 4567',
              },
            ].map((c, i, arr) => (
              <a
                key={c.label}
                href={`tel:${c.number}`}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors"
                style={
                  i < arr.length - 1
                    ? { borderBottom: '1px solid #fef2f2' }
                    : {}
                }
              >
                <span className="text-lg w-6 text-center">{c.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{c.label}</p>
                  <p className="text-xs text-red-500 font-medium mt-0.5">
                    {c.number}
                  </p>
                </div>
                <span className="text-red-300">📞</span>
              </a>
            ))}
          </div>
        </div>

        {/* Safety tips */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Consejos de seguridad
          </p>
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            {[
              'Verifica siempre la placa y los datos del conductor antes de subir.',
              'Comparte tu tracking en tiempo real con un contacto de confianza.',
              'Si te sientes inseguro, pide al conductor que se detenga en un lugar público.',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-yellow-400 mt-0.5">💡</span>
                <p className="text-sm text-gray-600">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
