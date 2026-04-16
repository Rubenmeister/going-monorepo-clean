'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../store';
import AppShell from '../components/AppShell';

export default function TrackingPage() {
  const { token, isReady, init, user } = useAuth();
  const router = useRouter();
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    init();
  }, [init]);
  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  const trackingLink = `https://going.app/track/${user?.id ?? 'demo123'}`;

  const handleCopy = () => {
    // Clipboard API: funciona en web; en native se usa Clipboard de expo
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(trackingLink).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppShell title="Tracking">
      {/* Header */}
      <div
        className="px-5 py-8 relative overflow-hidden"
        style={{ backgroundColor: '#011627' }}
      >
        <div
          className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10"
          style={{ backgroundColor: '#ff4c41' }}
        />
        <p className="text-white/50 text-sm mb-1">Comparte tu ubicación</p>
        <h1 className="text-2xl font-black text-white">Compartir Tracking</h1>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Toggle */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-bold text-gray-900 text-sm">
                Compartir ubicación en tiempo real
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {sharing
                  ? 'Tu ubicación está siendo compartida'
                  : 'Activa para que tus contactos te sigan'}
              </p>
            </div>
            <button
              onClick={() => setSharing(!sharing)}
              className="w-14 h-8 rounded-full transition-all duration-300 relative flex-shrink-0"
              style={{ backgroundColor: sharing ? '#ff4c41' : '#d1d5db' }}
            >
              <span
                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all duration-300"
                style={{ left: sharing ? '30px' : '2px' }}
              />
            </button>
          </div>

          {sharing && (
            <div className="space-y-3 pt-3 border-t border-gray-100">
              {/* Map placeholder */}
              <div
                className="w-full h-36 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#1e293b' }}
              >
                <div className="text-center">
                  <span className="text-4xl block mb-2">📍</span>
                  <p className="text-white/60 text-xs">Quito, Ecuador</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    -0.1807° S, 78.4678° O
                  </p>
                </div>
              </div>

              {/* Link */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50">
                <span className="text-xs text-gray-500 flex-1 truncate">
                  {trackingLink}
                </span>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white flex-shrink-0 transition-colors"
                  style={{ backgroundColor: copied ? '#22c55e' : '#ff4c41' }}
                >
                  {copied ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Share channels */}
        {sharing && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
              Compartir por
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: '💬', label: 'WhatsApp', color: '#25D366' },
                { icon: '✉️', label: 'Email', color: '#4F46E5' },
                { icon: '📋', label: 'Copiar enlace', color: '#6b7280' },
              ].map((c) => (
                <button
                  key={c.label}
                  onClick={c.label === 'Copiar enlace' ? handleCopy : undefined}
                  className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
                >
                  <span className="text-2xl">{c.icon}</span>
                  <span className="text-xs font-bold text-gray-600">
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Contacts */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Contactos de confianza
          </p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {[
              { name: 'Mamá', phone: '+593 99 000 0001', initial: 'M' },
              {
                name: 'Carlos (amigo)',
                phone: '+593 98 000 0002',
                initial: 'C',
              },
            ].map((c, i, arr) => (
              <div
                key={c.name}
                className="flex items-center gap-3 px-4 py-3.5"
                style={
                  i < arr.length - 1
                    ? { borderBottom: '1px solid #f3f4f6' }
                    : {}
                }
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                  style={{ backgroundColor: '#011627' }}
                >
                  {c.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {c.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.phone}</p>
                </div>
                <button
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: sharing
                      ? 'rgba(255,76,65,0.1)'
                      : '#f1f5f9',
                    color: sharing ? '#ff4c41' : '#9ca3af',
                  }}
                >
                  {sharing ? 'Enviado' : 'Enviar'}
                </button>
              </div>
            ))}
            <button className="w-full flex items-center gap-3 px-4 py-3.5 border-t border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xl border-2 border-dashed border-gray-200 flex-shrink-0">
                +
              </div>
              <p className="text-sm font-medium text-gray-500">
                Agregar contacto
              </p>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
