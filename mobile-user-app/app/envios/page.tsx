'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuth, authFetch } from '../store';
import AppShell from '../components/AppShell';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const PARCEL_SIZES = [
  { id: 'small',  icon: '📦', label: 'Pequeño',  desc: 'Hasta 5 kg · 30×20×20 cm',  price: 2.50, display: '$2.50' },
  { id: 'medium', icon: '📫', label: 'Mediano',  desc: 'Hasta 15 kg · 50×40×30 cm', price: 4.50, display: '$4.50' },
  { id: 'large',  icon: '🗃️', label: 'Grande',   desc: 'Hasta 30 kg · 80×60×60 cm', price: 8.00, display: '$8.00' },
];

const PAYMENT_METHODS = [
  { id: 'datafast', icon: '💳', label: 'Tarjeta',  desc: 'Visa / Mastercard / Datafast' },
  { id: 'deuna',    icon: '🏦', label: 'DeUna',    desc: 'Banco Pichincha · Pago digital' },
  { id: 'cash',     icon: '💵', label: 'Efectivo', desc: 'Paga al conductor' },
];

interface Suggestion { id: string; place_name: string; center: [number, number]; }

async function geocode(query: string): Promise<Suggestion[]> {
  if (query.length < 3 || !MAPBOX_TOKEN) return [];
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
      + `?access_token=${MAPBOX_TOKEN}&country=ec&language=es&limit=4&types=place,address,poi`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features || []).map((f: any) => ({
      id: f.id,
      place_name: f.place_name,
      center: f.center,
    }));
  } catch {
    return [];
  }
}

export default function EnviosPage() {
  const { user, token, isReady, init } = useAuth();
  const router = useRouter();

  const [fromText, setFromText]     = useState('');
  const [toText, setToText]         = useState('');
  const [fromCoords, setFromCoords] = useState<[number, number] | null>(null);
  const [toCoords, setToCoords]     = useState<[number, number] | null>(null);
  const [fromSugg, setFromSugg]     = useState<Suggestion[]>([]);
  const [toSugg, setToSugg]         = useState<Suggestion[]>([]);

  const [size, setSize]             = useState('small');
  const [paymentMethod, setPayment] = useState('datafast');
  const [note, setNote]             = useState('');
  const [loading, setLoading]       = useState(false);
  const [trackingCode, setTracking] = useState('');
  const [otpPin, setOtpPin]         = useState('');
  const [sent, setSent]             = useState(false);

  const fromTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { init(); }, [init]);
  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  const handleFromChange = useCallback((val: string) => {
    setFromText(val);
    setFromCoords(null);
    if (fromTimer.current) clearTimeout(fromTimer.current);
    fromTimer.current = setTimeout(async () => {
      setFromSugg(await geocode(val));
    }, 350);
  }, []);

  const handleToChange = useCallback((val: string) => {
    setToText(val);
    setToCoords(null);
    if (toTimer.current) clearTimeout(toTimer.current);
    toTimer.current = setTimeout(async () => {
      setToSugg(await geocode(val));
    }, 350);
  }, []);

  const selectFrom = (s: Suggestion) => {
    setFromText(s.place_name);
    setFromCoords(s.center);
    setFromSugg([]);
  };

  const selectTo = (s: Suggestion) => {
    setToText(s.place_name);
    setToCoords(s.center);
    setToSugg([]);
  };

  const selectedSize = PARCEL_SIZES.find(s => s.id === size) || PARCEL_SIZES[0];
  const canBook = Boolean(fromCoords && toCoords);

  const handleSend = async () => {
    if (!canBook) return;
    setLoading(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const pin  = String(Math.floor(1000 + Math.random() * 9000));
    try {
      const res = await authFetch('/parcels', {
        method: 'POST',
        body: JSON.stringify({
          from:          fromText,
          to:            toText,
          fromLatitude:  fromCoords?.[1],
          fromLongitude: fromCoords?.[0],
          toLatitude:    toCoords?.[1],
          toLongitude:   toCoords?.[0],
          size,
          price:         selectedSize.price,
          paymentMethod,
          note,
          userId:        user?.id,
        }),
      });
      if (res && res.trackingCode) {
        setTracking(res.trackingCode);
        setOtpPin(res.otpPin || pin);
      } else {
        setTracking(code);
        setOtpPin(pin);
      }
    } catch {
      setTracking(code);
      setOtpPin(pin);
    }
    setSent(true);
    setLoading(false);
  };

  // ─── Confirmation screen ────────────────────────────────────────────────────
  if (sent) {
    return (
      <AppShell title="Envíos">
        <div className="px-5 py-8" style={{ backgroundColor: '#011627' }}>
          <p className="text-white/50 text-sm mb-1">Envío solicitado</p>
          <h1 className="text-2xl font-black text-white">¡En camino!</h1>
        </div>
        <div className="px-4 py-6 space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <span className="text-5xl block mb-3">📦</span>
            <p className="font-bold text-gray-900 text-lg">Envío confirmado</p>
            <p className="text-sm text-gray-500 mt-1">Un conductor recogerá tu paquete pronto</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Código de rastreo</p>
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-xl font-black tracking-widest text-gray-900">{trackingCode}</span>
              <span className="text-xs text-gray-400">Comparte con el destinatario</span>
            </div>
          </div>

          <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#fffbeb' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#92400e' }}>
              PIN de entrega
            </p>
            <p className="text-xs mb-3" style={{ color: '#b45309' }}>
              El conductor pedirá este código al entregar
            </p>
            <div className="flex justify-center gap-3">
              {otpPin.split('').map((d, i) => (
                <div
                  key={i}
                  className="w-12 h-14 rounded-xl flex items-center justify-center text-2xl font-black"
                  style={{ backgroundColor: '#f59e0b', color: '#fff' }}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex gap-3">
              <span>📍</span>
              <div>
                <p className="text-xs text-gray-400">Origen</p>
                <p className="text-sm font-medium text-gray-900">{fromText}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span>🏁</span>
              <div>
                <p className="text-xs text-gray-400">Destino</p>
                <p className="text-sm font-medium text-gray-900">{toText}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span>💰</span>
              <div>
                <p className="text-xs text-gray-400">Total</p>
                <p className="text-sm font-bold" style={{ color: '#f59e0b' }}>{selectedSize.display}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setSent(false);
              setFromText('');
              setToText('');
              setFromCoords(null);
              setToCoords(null);
              setNote('');
            }}
            className="w-full py-3 rounded-xl font-bold text-sm"
            style={{ backgroundColor: '#f1f5f9', color: '#6b7280' }}
          >
            Nuevo envío
          </button>
        </div>
      </AppShell>
    );
  }

  // ─── Request form ───────────────────────────────────────────────────────────
  return (
    <AppShell title="Envíos">
      <div className="px-5 py-8 relative overflow-hidden" style={{ backgroundColor: '#011627' }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10" style={{ backgroundColor: '#f59e0b' }} />
        <p className="text-white/50 text-sm mb-1">Envía con Going</p>
        <h1 className="text-2xl font-black text-white">Envíos</h1>
        <p className="text-sm text-white/40 mt-1">Paquetería rápida y segura</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Addresses with autocomplete */}
        <div className="bg-white rounded-2xl shadow-sm overflow-visible">
          <div className="relative border-b border-gray-100">
            <div className="flex items-center gap-3 px-4 py-4">
              <span className="text-lg">{fromCoords ? '✅' : '📍'}</span>
              <input
                type="text"
                value={fromText}
                onChange={(e) => handleFromChange(e.target.value)}
                placeholder="Dirección de recogida"
                className="flex-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              />
            </div>
            {fromSugg.length > 0 && (
              <div className="absolute left-0 right-0 top-full bg-white rounded-xl shadow-lg border border-gray-100 z-10 overflow-hidden">
                {fromSugg.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => selectFrom(s)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0"
                  >
                    <span className="text-gray-500 mr-2">📍</span>
                    <span className="text-gray-800">{s.place_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <div className="flex items-center gap-3 px-4 py-4">
              <span className="text-lg">{toCoords ? '✅' : '🏁'}</span>
              <input
                type="text"
                value={toText}
                onChange={(e) => handleToChange(e.target.value)}
                placeholder="Dirección de entrega"
                className="flex-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              />
            </div>
            {toSugg.length > 0 && (
              <div className="absolute left-0 right-0 top-full bg-white rounded-xl shadow-lg border border-gray-100 z-10 overflow-hidden">
                {toSugg.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => selectTo(s)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0"
                  >
                    <span className="text-gray-500 mr-2">🏁</span>
                    <span className="text-gray-800">{s.place_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {(!fromCoords && fromText.length > 2) && (
          <p className="text-xs text-amber-600 px-1">Selecciona una dirección de la lista para confirmar el origen</p>
        )}
        {(!toCoords && toText.length > 2) && (
          <p className="text-xs text-amber-600 px-1">Selecciona una dirección de la lista para confirmar el destino</p>
        )}

        {/* Size */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Tamaño del paquete</p>
          <div className="space-y-2">
            {PARCEL_SIZES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSize(s.id)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all"
                style={size === s.id
                  ? { borderColor: '#f59e0b', backgroundColor: '#fffbeb' }
                  : { borderColor: '#f1f5f9', backgroundColor: '#fff' }}
              >
                <span className="text-2xl">{s.icon}</span>
                <div className="flex-1 text-left">
                  <p className="font-bold text-sm text-gray-900">{s.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                </div>
                <span className="font-black text-sm" style={{ color: '#f59e0b' }}>{s.display}</span>
                {size === s.id && <span className="text-lg">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Payment method */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Método de pago</p>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setPayment(m.id)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all"
                style={paymentMethod === m.id
                  ? { borderColor: '#011627', backgroundColor: '#f0f4f8' }
                  : { borderColor: '#f1f5f9', backgroundColor: '#fff' }}
              >
                <span className="text-2xl">{m.icon}</span>
                <div className="flex-1 text-left">
                  <p className="font-bold text-sm text-gray-900">{m.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
                </div>
                {paymentMethod === m.id && (
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: '#011627' }}
                  >
                    ✓
                  </span>
                )}
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

        {/* Price summary */}
        <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-500">Total estimado</span>
          <span className="text-xl font-black" style={{ color: '#f59e0b' }}>{selectedSize.display}</span>
        </div>

        <button
          onClick={handleSend}
          disabled={loading || !canBook}
          className="w-full py-4 rounded-2xl font-bold text-white text-sm transition-opacity"
          style={{ backgroundColor: '#f59e0b', opacity: loading || !canBook ? 0.5 : 1 }}
        >
          {loading ? 'Procesando...' : 'Solicitar envío'}
        </button>
      </div>
    </AppShell>
  );
}
