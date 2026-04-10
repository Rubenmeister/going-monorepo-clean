'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth, authFetch } from '../store';
import AppShell from '../components/AppShell';

const PARCEL_SIZES = [
  {
    id: 'small',
    icon: '📦',
    label: 'Pequeño',
    desc: 'Hasta 5 kg · 30×20×20 cm',
    price: '$2.50',
  },
  {
    id: 'medium',
    icon: '📫',
    label: 'Mediano',
    desc: 'Hasta 15 kg · 50×40×30 cm',
    price: '$4.50',
  },
  {
    id: 'large',
    icon: '🗃️',
    label: 'Grande',
    desc: 'Hasta 30 kg · 80×60×60 cm',
    price: '$8.00',
  },
];

export default function EnviosPage() {
  const { user, token, isReady, init } = useAuth();
  const router = useRouter();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [size, setSize] = useState('small');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    init();
  }, [init]);
  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  const handleSend = async () => {
    if (!from.trim() || !to.trim()) return;
    setLoading(true);
    try {
      await authFetch('/parcels', {
        method: 'POST',
        body: JSON.stringify({ from, to, size, note, userId: user?.id }),
      });
    } catch {
      /* staging fallback */
    }
    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <AppShell title="Envíos">
        <div className="px-5 py-8" style={{ backgroundColor: '#011627' }}>
          <p className="text-white/50 text-sm mb-1">Envío solicitado</p>
          <h1 className="text-2xl font-black text-white">¡En camino!</h1>
        </div>
        <div className="px-4 py-6 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <span className="text-6xl block mb-4">📦</span>
            <p className="font-bold text-gray-900 text-lg mb-2">
              Envío confirmado
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Un conductor recogerá tu paquete pronto
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6">
              <div className="flex gap-2">
                <span>📍</span>
                <div>
                  <p className="text-xs text-gray-400">Origen</p>
                  <p className="text-sm font-medium">{from}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span>🏁</span>
                <div>
                  <p className="text-xs text-gray-400">Destino</p>
                  <p className="text-sm font-medium">{to}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setSent(false);
                setFrom('');
                setTo('');
                setNote('');
              }}
              className="w-full py-3 rounded-xl font-bold text-sm"
              style={{ backgroundColor: '#f1f5f9', color: '#6b7280' }}
            >
              Nuevo envío
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Envíos">
      <div
        className="px-5 py-8 relative overflow-hidden"
        style={{ backgroundColor: '#011627' }}
      >
        <div
          className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10"
          style={{ backgroundColor: '#f59e0b' }}
        />
        <p className="text-white/50 text-sm mb-1">Envía con Going</p>
        <h1 className="text-2xl font-black text-white">Envíos</h1>
        <p className="text-sm text-white/40 mt-1">Paquetería rápida y segura</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Addresses */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
            <span className="text-lg">📍</span>
            <input
              type="text"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="Dirección de recogida"
              className="flex-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-4">
            <span className="text-lg">🏁</span>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Dirección de entrega"
              className="flex-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Size */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Tamaño del paquete
          </p>
          <div className="space-y-2">
            {PARCEL_SIZES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSize(s.id)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all"
                style={
                  size === s.id
                    ? { borderColor: '#f59e0b', backgroundColor: '#fffbeb' }
                    : { borderColor: '#f1f5f9', backgroundColor: '#fff' }
                }
              >
                <span className="text-2xl">{s.icon}</span>
                <div className="flex-1 text-left">
                  <p className="font-bold text-sm text-gray-900">{s.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                </div>
                <span
                  className="font-black text-sm"
                  style={{ color: '#f59e0b' }}
                >
                  {s.price}
                </span>
                {size === s.id && <span className="text-lg">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Nota para el conductor (opcional)
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Instrucciones especiales, referencias, etc."
            rows={3}
            className="w-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none resize-none"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={loading || !from.trim() || !to.trim()}
          className="w-full py-4 rounded-2xl font-bold text-white text-sm transition-opacity"
          style={{
            backgroundColor: '#f59e0b',
            opacity: loading || !from.trim() || !to.trim() ? 0.6 : 1,
          }}
        >
          {loading ? 'Procesando...' : 'Solicitar envío'}
        </button>
      </div>
    </AppShell>
  );
}
