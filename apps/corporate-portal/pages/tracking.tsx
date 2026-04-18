import Layout from '../components/Layout';
import TrackingConsentBadge from '../components/TrackingConsentBadge';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState, useCallback } from 'react';

interface ActiveTrip {
  bookingId: string;
  userId: string;
  employeeName: string;
  serviceType: string;
  lat: number;
  lng: number;
  speed?: number;
  startedAt: string;
  lastSeen: string;
  consentGranted: boolean;
}

// Simulated trips for demo (Ecuador coordinates)
const INITIAL_TRIPS: ActiveTrip[] = [
  {
    bookingId: 'bk-active-001',
    userId: 'emp-001',
    employeeName: 'Carlos Rodríguez',
    serviceType: 'transport',
    lat: -0.2295,
    lng: -78.5243,
    speed: 45,
    startedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    lastSeen: new Date().toISOString(),
    consentGranted: true,
  },
  {
    bookingId: 'bk-active-002',
    userId: 'emp-003',
    employeeName: 'Luis Pérez',
    serviceType: 'accommodation',
    lat: -0.9677,
    lng: -80.7089,
    speed: 0,
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    lastSeen: new Date().toISOString(),
    consentGranted: true,
  },
];

const SERVICE_ICONS: Record<string, string> = {
  transport: '🚗',
  accommodation: '🏨',
  tour: '🗺️',
  experience: '🎭',
};

function minutesAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff === 1) return '1 min ago';
  return `${diff} mins ago`;
}

export default function Tracking() {
  const { status } = useSession();
  const router = useRouter();
  const [trips, setTrips] = useState(INITIAL_TRIPS as ActiveTrip[]);
  const [selected, setSelected] = useState(null as ActiveTrip | null);
  const [wsStatus, setWsStatus] = useState('disconnected' as 'connecting' | 'connected' | 'disconnected');
  const wsRef = useRef(null as WebSocket | null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  // Simulate position drift for demo purposes
  useEffect(() => {
    const interval = setInterval(() => {
      setTrips((prev) =>
        prev.map((t) =>
          t.speed && t.speed > 0
            ? {
                ...t,
                lat: t.lat + (Math.random() - 0.5) * 0.002,
                lng: t.lng + (Math.random() - 0.5) * 0.002,
                speed: Math.max(0, t.speed + (Math.random() - 0.5) * 10),
                lastSeen: new Date().toISOString(),
              }
            : t
        )
      );
      setTick((t) => t + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket connection to tracking-service
  const connect = useCallback(() => {
    const wsUrl =
      process.env.NEXT_PUBLIC_TRACKING_WS_URL ||
      'ws://localhost:4005/corporate-tracking';
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      setWsStatus('connecting');

      ws.onopen = () => {
        setWsStatus('connected');
        ws.send(
          JSON.stringify({
            event: 'portal:subscribe',
            data: { companyId: 'company-demo', token: 'demo-token' },
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const { event: evt, data } = JSON.parse(event.data);
          if (evt === 'portal:initial-state') {
            setTrips(data.trips);
          } else if (evt === 'trip:location-updated') {
            setTrips((prev) =>
              prev.map((t) =>
                t.bookingId === data.bookingId
                  ? {
                      ...t,
                      lat: data.lat,
                      lng: data.lng,
                      speed: data.speed,
                      lastSeen: data.timestamp,
                    }
                  : t
              )
            );
          } else if (evt === 'trip:started') {
            setTrips((prev) => [...prev, data]);
          } else if (evt === 'trip:ended') {
            setTrips((prev) =>
              prev.filter((t) => t.bookingId !== data.bookingId)
            );
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => setWsStatus('disconnected');
      ws.onerror = () => setWsStatus('disconnected');
    } catch {
      setWsStatus('disconnected');
    }
  }, []);

  if (status === 'loading') return null;

  const consentedTrips = trips.filter((t) => t.consentGranted);

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Top bar */}
        <div className="bg-white border-b px-6 py-4 flex items-center gap-4 shrink-0">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Live Tracking</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Only showing trips where employee gave explicit consent
            </p>
          </div>

          {/* WS status */}
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                wsStatus === 'connected'
                  ? 'bg-green-500'
                  : wsStatus === 'connecting'
                  ? 'bg-yellow-400 animate-pulse'
                  : 'bg-gray-300'
              }`}
            />
            <span className="text-gray-600 capitalize">{wsStatus}</span>
            {wsStatus === 'disconnected' && (
              <button
                onClick={connect}
                className="text-xs text-blue-600 underline"
              >
                Connect
              </button>
            )}
          </div>

          <div className="bg-blue-50 rounded-lg px-3 py-1 text-sm font-semibold text-blue-700">
            {consentedTrips.length} active trip
            {consentedTrips.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left panel – trip list */}
          <div className="w-80 shrink-0 bg-white border-r overflow-y-auto flex flex-col">
            {consentedTrips.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
                <p className="text-4xl mb-3">📍</p>
                <p className="font-medium">No active trips</p>
                <p className="text-sm mt-1">
                  Employees on confirmed trips will appear here once they grant
                  tracking consent.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {consentedTrips.map((trip) => (
                  <li
                    key={trip.bookingId}
                    onClick={() => setSelected(trip)}
                    className={`px-4 py-4 cursor-pointer hover:bg-gray-50 transition ${
                      selected?.bookingId === trip.bookingId
                        ? 'bg-blue-50 border-l-4 border-l-blue-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {trip.employeeName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">
                          {trip.employeeName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {SERVICE_ICONS[trip.serviceType]} {trip.serviceType}
                        </p>
                      </div>
                      <TrackingConsentBadge />
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                      <span>
                        📍 {trip.lat.toFixed(4)}, {trip.lng.toFixed(4)}
                      </span>
                      {trip.speed !== undefined && trip.speed > 0 && (
                        <span>🚀 {trip.speed.toFixed(0)} km/h</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Updated {minutesAgo(trip.lastSeen)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Map area */}
          <div className="flex-1 relative bg-gray-200 overflow-hidden">
            {/* Map placeholder — replace with <Map> from mapbox-gl when token is available */}
            <div className="absolute inset-0 bg-gradient-to-br from-sky-100 to-green-100 flex items-center justify-center">
              <div className="text-center">
                <p className="text-6xl mb-4">🗺️</p>
                <p className="text-gray-600 font-semibold">Interactive Map</p>
                <p className="text-gray-400 text-sm mt-1">
                  Configure NEXT_PUBLIC_TRACKING_MAP_TOKEN (Mapbox) to enable
                </p>
                <p className="text-gray-400 text-sm">
                  live satellite/streets map
                </p>
              </div>
            </div>

            {/* Trip pins overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {consentedTrips.map((trip, i) => {
                // Simple proportional placement demo (not real geo projection)
                const x = 15 + i * 30;
                const y = 30 + (i % 2) * 25;
                return (
                  <div
                    key={trip.bookingId}
                    className="absolute pointer-events-auto cursor-pointer"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    onClick={() => setSelected(trip)}
                  >
                    <div
                      className={`relative flex flex-col items-center ${
                        selected?.bookingId === trip.bookingId
                          ? 'scale-125'
                          : ''
                      } transition-transform`}
                    >
                      <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg whitespace-nowrap">
                        {trip.employeeName.split(' ')[0]}
                      </div>
                      <div className="w-3 h-3 bg-blue-600 rotate-45 -mt-1.5 shadow" />
                      {trip.speed !== undefined && trip.speed > 0 && (
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-ping absolute -top-1 -right-1" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected trip detail panel */}
            {selected && (
              <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80 bg-white rounded-2xl shadow-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                      {selected.employeeName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {selected.employeeName}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">
                        {selected.serviceType}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                  >
                    &times;
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-gray-400">Latitude</p>
                    <p className="font-mono font-semibold text-gray-800">
                      {selected.lat.toFixed(6)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-gray-400">Longitude</p>
                    <p className="font-mono font-semibold text-gray-800">
                      {selected.lng.toFixed(6)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-gray-400">Speed</p>
                    <p className="font-semibold text-gray-800">
                      {selected.speed != null && selected.speed > 0
                        ? `${selected.speed.toFixed(0)} km/h`
                        : 'Stationary'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-gray-400">Trip started</p>
                    <p className="font-semibold text-gray-800">
                      {minutesAgo(selected.startedAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-green-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Consent granted — tracking active
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
