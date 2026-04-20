import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuth, authFetch } from '../store';
import AppShell from '../components/AppShell';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

// ── Coordenadas fijas de ciudades ecuatorianas (para rutas compartidas) ──────
const CITY_COORDS: Record<string, { latitude: number; longitude: number }> = {
  'Quito':      { latitude: -0.1807,  longitude: -78.4678 },
  'Baños':      { latitude: -1.3928,  longitude: -78.4269 },
  'Guayaquil':  { latitude: -2.1709,  longitude: -79.9224 },
  'Cuenca':     { latitude: -2.8974,  longitude: -79.0045 },
  'Ambato':     { latitude: -1.2490,  longitude: -78.6167 },
};

// ── Rutas compartidas con coordenadas reales ──────────────────────────────────
const SHARED_ROUTES = [
  { id: 'qb', icon: '🏔️', from: 'Quito', to: 'Baños',      duration: '3h 30m', price: 8,  seats: 3, vehicle: 'Premium SUV',  badge: 'Más popular',      time: '09:15 AM' },
  { id: 'qg', icon: '🌊', from: 'Quito', to: 'Guayaquil',  duration: '8h',     price: 15, seats: 5, vehicle: 'Sprinter VAN', badge: null,               time: '07:00 AM' },
  { id: 'qc', icon: '🌿', from: 'Quito', to: 'Cuenca',     duration: '9h',     price: 18, seats: 2, vehicle: 'SUV XL',       badge: 'Últimos asientos', time: '06:00 AM' },
  { id: 'qa', icon: '🦜', from: 'Quito', to: 'Ambato',     duration: '2h',     price: 6,  seats: 4, vehicle: 'SUV',          badge: null,               time: '10:00 AM' },
];

const PRIVATE_VEHICLES = [
  { id: 'suv',     icon: '🚗', label: 'SUV',     desc: 'Hasta 4 pasajeros',  price: 45,  seats: '1–4' },
  { id: 'suvxl',  icon: '🚙', label: 'SUV XL',  desc: 'Hasta 6 pasajeros',  price: 65,  seats: '1–6' },
  { id: 'van',    icon: '🚐', label: 'VAN',     desc: 'Hasta 9 pasajeros',  price: 90,  seats: '1–9' },
  { id: 'minibus',icon: '🚌', label: 'Minibús', desc: 'Hasta 20 pasajeros', price: 150, seats: '1–20', badge: 'Grupos grandes' },
];

type Mode = 'shared' | 'private';

interface Coords { latitude: number; longitude: number }
interface Suggestion { place_name: string; center: [number, number] }

// ── Geocodificación via Mapbox ────────────────────────────────────────────────
async function geocode(query: string): Promise<Suggestion[]> {
  if (!query.trim() || !MAPBOX_TOKEN) return [];
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
      + `?access_token=${MAPBOX_TOKEN}&country=ec&language=es&limit=4&types=place,address,poi`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features ?? []) as Suggestion[];
  } catch {
    return [];
  }
}

export default function TransportPage() {
  const { user, token, isReady, init } = useAuth();
  const router = useRouter();

  const [mode, setMode]                       = useState<Mode>('shared');
  const [origin, setOrigin]                   = useState('');
  const [destination, setDestination]         = useState('');
  const [originCoords, setOriginCoords]       = useState<Coords | null>(null);
  const [destCoords, setDestCoords]           = useState<Coords | null>(null);
  const [originSugg, setOriginSugg]           = useState<Suggestion[]>([]);
  const [destSugg, setDestSugg]               = useState<Suggestion[]>([]);
  const [selectedRoute, setSelectedRoute]     = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [loading, setLoading]                 = useState(false);
  const [booked, setBooked]                   = useState(false);
  const [tripId, setTripId]                   = useState<string | null>(null);
  const [error, setError]                     = useState('');

  const originTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { init(); }, [init]);
  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  // ── Autocompletar ─────────────────────────────────────────────────────────────
  const handleOriginChange = useCallback((val: string) => {
    setOrigin(val);
    setOriginCoords(null);
    if (originTimer.current) clearTimeout(originTimer.current);
    originTimer.current = setTimeout(async () => {
      setOriginSugg(await geocode(val));
    }, 350);
  }, []);

  const handleDestChange = useCallback((val: string) => {
    setDestination(val);
    setDestCoords(null);
    if (destTimer.current) clearTimeout(destTimer.current);
    destTimer.current = setTimeout(async () => {
      setDestSugg(await geocode(val));
    }, 350);
  }, []);

  const pickOrigin = (s: Suggestion) => {
    setOrigin(s.place_name);
    setOriginCoords({ latitude: s.center[1], longitude: s.center[0] });
    setOriginSugg([]);
  };

  const pickDest = (s: Suggestion) => {
    setDestination(s.place_name);
    setDestCoords({ latitude: s.center[1], longitude: s.center[0] });
    setDestSugg([]);
  };

  // ── Reservar ─────────────────────────────────────────────────────────────────
  const handleBook = async () => {
    if (mode === 'shared' && !selectedRoute) {
      setError('Selecciona una ruta');
      return;
    }
    if (mode === 'private') {
      if (!origin.trim() || !destination.trim() || !selectedVehicle) {
        setError('Completa origen, destino y tipo de vehículo');
        return;
      }
      if (!originCoords) { setError('Selecciona el origen de la lista de sugerencias'); return; }
      if (!destCoords)   { setError('Selecciona el destino de la lista de sugerencias'); return; }
    }
    setError('');
    setLoading(true);

    const route   = SHARED_ROUTES.find(r => r.id === selectedRoute);
    const vehicle = PRIVATE_VEHICLES.find(v => v.id === selectedVehicle);

    const originPayload = mode === 'shared'
      ? { address: route?.from ?? '', ...CITY_COORDS[route?.from ?? ''] }
      : { address: origin, ...originCoords! };

    const destPayload = mode === 'shared'
      ? { address: route?.to ?? '', ...CITY_COORDS[route?.to ?? ''] }
      : { address: destination, ...destCoords! };

    try {
      const res = await authFetch('/transport/request', {
        method: 'POST',
        body: JSON.stringify({
          userId:      user?.id ?? 'anonymous',
          mode,
          origin:      originPayload,
          destination: destPayload,
          price:       { amount: mode === 'shared' ? route?.price : vehicle?.price, currency: 'USD' },
          vehicleType: mode === 'shared' ? route?.vehicle : vehicle?.label,
        }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setTripId((data as any).id ?? null);
      }
      setBooked(true);
    } catch {
      setBooked(true);
    } finally {
      setLoading(false);
    }
  };

  // ── Estado: viaje reservado ───────────────────────────────────────────────────
  if (booked) {
    const route   = SHARED_ROUTES.find(r => r.id === selectedRoute);
    const vehicle = PRIVATE_VEHICLES.find(v => v.id === selectedVehicle);
    return (
      <AppShell title="Transporte">
        <div className="px-5 py-8 relative overflow-hidden" style={{ backgroundColor: '#011627' }}>
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10" style={{ backgroundColor: '#ff4c41' }} />
          <p className="text-white/50 text-sm mb-1 relative z-10">Solicitud enviada</p>
          <h1 className="text-2xl font-black text-white relative z-10">¡Viaje en camino!</h1>
        </div>

        <div className="px-4 py-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center" style={{ border: '1px solid #f0f0f0' }}>
            <span className="text-5xl block mb-3">{mode === 'shared' ? '🚍' : '🚗'}</span>
            <p className="font-bold text-gray-900 text-lg mb-1">
              {mode === 'shared' ? 'Buscando asiento' : 'Buscando conductor'}
            </p>
            <p className="text-sm text-gray-500 mb-5">Te notificaremos cuando se confirme tu viaje</p>

            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3 mb-5">
              {mode === 'shared' && route ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Ruta</p>
                      <p className="font-bold text-gray-900">{route.from} → {route.to}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Precio</p>
                      <p className="font-black" style={{ color: '#ff4c41' }}>${route.price} USD</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-1 border-t border-gray-100">
                    <div><p className="text-xs text-gray-400">Vehículo</p><p className="text-sm font-semibold text-gray-700">{route.vehicle}</p></div>
                    <div><p className="text-xs text-gray-400">Hora salida</p><p className="text-sm font-semibold text-gray-700">{route.time}</p></div>
                    <div><p className="text-xs text-gray-400">Duración</p><p className="text-sm font-semibold text-gray-700">{route.duration}</p></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-sm">📍</span>
                    <div><p className="text-xs text-gray-400">Origen</p><p className="text-sm font-medium text-gray-900">{origin}</p></div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm">🏁</span>
                    <div><p className="text-xs text-gray-400">Destino</p><p className="text-sm font-medium text-gray-900">{destination}</p></div>
                  </div>
                  {vehicle && (
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      <p className="text-sm text-gray-600">{vehicle.icon} {vehicle.label}</p>
                      <p className="font-black" style={{ color: '#ff4c41' }}>${vehicle.price} USD</p>
                    </div>
                  )}
                </>
              )}
              {tripId && <p className="text-xs text-gray-300 pt-1">Viaje #{tripId.slice(-6)}</p>}
            </div>

            <button
              onClick={() => { setBooked(false); setSelectedRoute(null); setTripId(null); }}
              className="w-full py-3 rounded-xl font-bold text-sm"
              style={{ backgroundColor: '#f1f5f9', color: '#6b7280' }}
            >
              Cancelar viaje
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Formulario principal ──────────────────────────────────────────────────────
  const canBook = mode === 'shared'
    ? !!selectedRoute
    : (!!origin && !!destination && !!selectedVehicle && !!originCoords && !!destCoords);

  return (
    <AppShell title="Transporte">

      {/* Header con tabs */}
      <div className="relative overflow-hidden px-5 pt-6 pb-5" style={{ backgroundColor: '#011627' }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10" style={{ backgroundColor: '#ff4c41' }} />
        <p className="text-white/50 text-xs mb-1 relative z-10">Elige tu modalidad</p>
        <h1 className="text-xl font-black text-white mb-4 relative z-10">Transporte</h1>
        <div className="relative z-10 flex gap-2 bg-white/10 rounded-xl p-1">
          <button
            onClick={() => setMode('shared')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all"
            style={mode === 'shared'
              ? { backgroundColor: '#ff4c41', color: '#fff', boxShadow: '0 2px 8px rgba(255,76,65,0.35)' }
              : { color: 'rgba(255,255,255,0.6)' }}
          >
            🚍 Compartido
          </button>
          <button
            onClick={() => setMode('private')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all"
            style={mode === 'private'
              ? { backgroundColor: '#fff', color: '#011627' }
              : { color: 'rgba(255,255,255,0.6)' }}
          >
            🚗 Privado
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* ── MODO COMPARTIDO ── */}
        {mode === 'shared' && (
          <>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Rutas disponibles hoy</p>
            <div className="space-y-3">
              {SHARED_ROUTES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoute(r.id === selectedRoute ? null : r.id)}
                  className="w-full rounded-2xl p-4 text-left transition-all active:scale-95"
                  style={{
                    backgroundColor: '#fff',
                    border: `2px solid ${r.id === selectedRoute ? '#ff4c41' : '#f0f0f0'}`,
                    boxShadow: r.id === selectedRoute ? '0 0 0 1px #ff4c41' : 'none',
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{r.icon}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-gray-900">{r.from}</span>
                          <span className="text-gray-300 text-sm">→</span>
                          <span className="font-black text-gray-900">{r.to}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{r.time} · {r.duration} · {r.vehicle}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-lg" style={{ color: '#ff4c41' }}>${r.price}</p>
                      <p className="text-xs text-gray-400">por asiento</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">👥 {r.seats} asientos disponibles</span>
                    {r.badge && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: r.badge === 'Últimos asientos' ? '#fff5f5' : '#fff8e1',
                          color: r.badge === 'Últimos asientos' ? '#ff4c41' : '#d97706',
                        }}>
                        {r.badge === 'Últimos asientos' ? '🔴' : '⭐'} {r.badge}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── MODO PRIVADO ── */}
        {mode === 'private' && (
          <>
            <div className="bg-white rounded-2xl shadow-sm overflow-visible" style={{ border: '1px solid #f0f0f0' }}>

              {/* Origen */}
              <div className="relative" style={{ borderBottom: '1px solid #f5f5f5' }}>
                <div className="flex items-center gap-3 px-4 py-4">
                  <span className="text-lg">📍</span>
                  <input
                    type="text" value={origin}
                    onChange={(e) => handleOriginChange(e.target.value)}
                    placeholder="¿Desde dónde sales?"
                    className="flex-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                  />
                  {originCoords && <span className="text-green-500 text-xs font-bold">✓</span>}
                </div>
                {originSugg.length > 0 && (
                  <div className="absolute left-0 right-0 top-full bg-white rounded-xl shadow-lg border border-gray-100 z-30 overflow-hidden">
                    {originSugg.map((s, i) => (
                      <button key={i} onClick={() => pickOrigin(s)}
                        className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0 truncate">
                        📍 {s.place_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Destino */}
              <div className="relative">
                <div className="flex items-center gap-3 px-4 py-4">
                  <span className="text-lg">🏁</span>
                  <input
                    type="text" value={destination}
                    onChange={(e) => handleDestChange(e.target.value)}
                    placeholder="¿A dónde vas?"
                    className="flex-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                  />
                  {destCoords && <span className="text-green-500 text-xs font-bold">✓</span>}
                </div>
                {destSugg.length > 0 && (
                  <div className="absolute left-0 right-0 top-full bg-white rounded-xl shadow-lg border border-gray-100 z-30 overflow-hidden">
                    {destSugg.map((s, i) => (
                      <button key={i} onClick={() => pickDest(s)}
                        className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0 truncate">
                        📍 {s.place_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Hint si falta confirmar coordenadas */}
            {((origin && !originCoords) || (destination && !destCoords)) && (
              <p className="text-xs text-amber-600 px-1">
                Selecciona una dirección de las sugerencias para confirmar la ubicación.
              </p>
            )}

            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Tipo de vehículo</p>
            <div className="space-y-2">
              {PRIVATE_VEHICLES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicle(v.id === selectedVehicle ? null : v.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all"
                  style={{
                    border: `2px solid ${v.id === selectedVehicle ? '#ff4c41' : '#f1f5f9'}`,
                    backgroundColor: v.id === selectedVehicle ? '#fff8f7' : '#fff',
                  }}
                >
                  <span className="text-3xl">{v.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-gray-900">{v.label}</p>
                      {'badge' in v && v.badge && (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">
                          {(v as any).badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{v.desc}</p>
                  </div>
                  <span className="font-black text-sm flex-shrink-0" style={{ color: '#ff4c41' }}>
                    desde ${v.price}
                  </span>
                  {v.id === selectedVehicle && (
                    <span className="text-lg" style={{ color: '#ff4c41' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {error && (
          <p className="text-sm font-medium px-1" style={{ color: '#ff4c41' }}>{error}</p>
        )}

        <button
          onClick={handleBook}
          disabled={loading || !canBook}
          className="w-full py-4 rounded-2xl font-bold text-white text-sm transition-all"
          style={{
            backgroundColor: '#ff4c41',
            opacity: (loading || !canBook) ? 0.5 : 1,
            boxShadow: '0 4px 16px rgba(255,76,65,0.35)',
          }}
        >
          {loading
            ? (mode === 'shared' ? 'Reservando asiento...' : 'Buscando conductor...')
            : (mode === 'shared' ? 'Reservar asiento' : 'Solicitar vehículo privado')}
        </button>

      </div>
    </AppShell>
  );
}
