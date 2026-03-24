'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const API_URL  = process.env.NEXT_PUBLIC_API_URL       || 'https://api-gateway-780842550857.us-central1.run.app';
const TRANSPORT = process.env.NEXT_PUBLIC_TRANSPORT_URL || 'https://transport-service-780842550857.us-central1.run.app';

interface DriverUser {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  roles: string[];
}

interface RideRequest {
  rideId: string;
  passengerId: string;
  passengerName?: string;
  origin: { address: string; latitude: number; longitude: number };
  destination: { address: string; latitude: number; longitude: number };
  estimatedFare: number;
  distanceKm?: number;
  createdAt?: string;
}

interface HistoryRide {
  _id: string;
  status: string;
  origin?: { address: string };
  destination?: { address: string };
  fare?: number;
  createdAt?: string;
}

function parseJwt(token: string): DriverUser | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const p = JSON.parse(atob(base64));
    return { id: p.sub || p.userId || '', firstName: p.firstName || 'Conductor', lastName: p.lastName, email: p.email, roles: Array.isArray(p.roles) ? p.roles : [] };
  } catch { return null; }
}

type Tab = 'home' | 'requests' | 'history' | 'wallet';

export default function DriverPanelPage() {
  const [user, setUser]       = useState<DriverUser | null>(null);
  const [tab, setTab]         = useState<Tab>('home');
  const [online, setOnline]   = useState(false);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [history, setHistory]   = useState<HistoryRide[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [todayEarnings, setTodayEarnings]   = useState(0);
  const [todayTrips, setTodayTrips]         = useState(0);
  const [accepting, setAccepting]           = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { window.location.href = '/auth/login?from=/conductores/panel'; return; }
    const decoded = parseJwt(token);
    if (!decoded || !decoded.roles.includes('driver')) {
      window.location.href = '/auth/login?from=/conductores/panel'; return;
    }
    setUser(decoded);
  }, []);

  // Polling de solicitudes de viaje cuando está online
  useEffect(() => {
    if (!user || !online) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      setRequests([]);
      return;
    }
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${TRANSPORT}/transport/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const list: RideRequest[] = (Array.isArray(data) ? data : data.rides ?? []).map((r: any) => ({
          rideId:         r._id || r.rideId,
          passengerId:    r.userId || r.passengerId,
          passengerName:  r.passengerName,
          origin:         r.origin,
          destination:    r.destination,
          estimatedFare:  r.estimatedFare ?? r.price?.amount ?? 8.5,
          distanceKm:     r.distanceKm,
          createdAt:      r.createdAt,
        }));
        setRequests(list);
      } catch {/* silencioso */}
    };
    fetchRequests();
    pollRef.current = setInterval(fetchRequests, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [user, online]);

  const loadHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${TRANSPORT}/transport/driver/${user.id}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.ok ? await res.json() : [];
      const list: HistoryRide[] = Array.isArray(data) ? data : [];
      setHistory(list);
      const today = new Date().toDateString();
      const todayRides = list.filter(r =>
        r.status === 'completed' && r.createdAt && new Date(r.createdAt).toDateString() === today
      );
      setTodayTrips(todayRides.length);
      setTodayEarnings(todayRides.reduce((sum, r) => sum + (r.fare ?? 0), 0));
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (tab === 'history' && history.length === 0) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (user) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const acceptRide = async (ride: RideRequest) => {
    setAccepting(ride.rideId);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${TRANSPORT}/transport/${ride.rideId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId:   user?.id,
          driverName: `${user?.firstName} ${user?.lastName ?? ''}`.trim(),
          etaMinutes: 5,
        }),
      });
      if (res.ok) {
        setRequests(prev => prev.filter(r => r.rideId !== ride.rideId));
        window.location.href = `/conductores/viaje/${ride.rideId}`;
      }
    } catch {/* */} finally {
      setAccepting(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0033A0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = `${user.firstName[0]}${user.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0033A0 100%)' }} className="text-white px-6 pt-8 pb-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
              {initials}
            </div>
            <div>
              <p className="text-white/60 text-xs">Panel de conductor</p>
              <h1 className="text-xl font-bold">{user.firstName} {user.lastName ?? ''}</h1>
            </div>
          </div>
          <button onClick={logout} className="text-xs text-white/60 hover:text-white border border-white/20 px-3 py-1.5 rounded-lg transition-colors">
            Salir
          </button>
        </div>

        {/* Toggle online / offline */}
        <div className="max-w-2xl mx-auto mt-6">
          <button
            onClick={() => setOnline(v => !v)}
            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
              online
                ? 'bg-[#FFCD00] text-[#0033A0] shadow-yellow-400/30'
                : 'bg-white/10 text-white/70 border border-white/20'
            }`}
          >
            <span className={`w-3 h-3 rounded-full ${online ? 'bg-[#0033A0] animate-pulse' : 'bg-white/30'}`} />
            {online ? 'En línea · Recibiendo viajes' : 'Offline · Toca para activarte'}
          </button>
        </div>
      </div>

      {/* ── Stats del día ── */}
      <div className="max-w-2xl mx-auto w-full px-6 -mt-8">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '💰', value: `$${todayEarnings.toFixed(2)}`, label: 'Hoy' },
            { icon: '🚗', value: String(todayTrips),             label: 'Viajes hoy' },
            { icon: '⭐', value: '—',                            label: 'Calificación' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
              <p className="text-xl mb-1">{s.icon}</p>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="max-w-2xl mx-auto w-full px-6 mt-4">
        <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 p-1 shadow-sm">
          {([
            { key: 'home',     icon: '🏠', label: 'Inicio' },
            { key: 'requests', icon: '📋', label: requests.length > 0 ? `Viajes (${requests.length})` : 'Viajes' },
            { key: 'history',  icon: '🕐', label: 'Historial' },
            { key: 'wallet',   icon: '💳', label: 'Wallet' },
          ] as { key: Tab; icon: string; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                tab === t.key
                  ? 'bg-[#0033A0] text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span className="text-base">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenido por tab ── */}
      <div className="max-w-2xl mx-auto w-full px-6 mt-4 flex-1 pb-10">

        {/* HOME */}
        {tab === 'home' && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Acceso rápido</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '📂', label: 'Mis documentos', href: '/conductores/registro' },
                { icon: '📚', label: 'Academia Going',  href: '/academy' },
                { icon: '💬', label: 'Soporte',          href: '/contact' },
                { icon: '⚙️', label: 'Mi cuenta',        href: '/account' },
              ].map(item => (
                <Link key={item.label} href={item.href}
                  className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-[#0033A0] hover:shadow-md transition-all flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-sm font-semibold text-gray-800">{item.label}</span>
                </Link>
              ))}
            </div>
            {!online && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-[#0033A0] font-semibold text-sm">Actívate para recibir viajes</p>
                <p className="text-blue-600 text-xs mt-1">Toca el botón de arriba para ponerte en línea.</p>
              </div>
            )}
          </div>
        )}

        {/* SOLICITUDES */}
        {tab === 'requests' && (
          <div className="space-y-3">
            {!online ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <p className="text-4xl mb-3">📴</p>
                <p className="text-gray-600 font-semibold">Estás offline</p>
                <p className="text-gray-400 text-sm mt-1">Actívate para ver solicitudes de viaje</p>
                <button onClick={() => setOnline(true)} className="mt-4 bg-[#0033A0] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors">
                  Activarme ahora
                </button>
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-gray-600 font-semibold">Buscando viajes…</p>
                <p className="text-gray-400 text-sm mt-1">Las solicitudes aparecerán aquí</p>
                <div className="mt-4 flex justify-center">
                  <div className="w-6 h-6 border-2 border-[#0033A0] border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
            ) : (
              requests.map(ride => (
                <div key={ride.rideId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-[#FFCD00] px-4 py-2.5 flex items-center justify-between">
                    <span className="text-[#0033A0] font-black text-2xl">${ride.estimatedFare.toFixed(2)}</span>
                    {ride.distanceKm && (
                      <span className="text-[#0033A0]/70 text-sm font-semibold">{ride.distanceKm.toFixed(1)} km</span>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{ride.origin.address}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{ride.destination.address}</p>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => acceptRide(ride)}
                      disabled={accepting === ride.rideId}
                      className="w-full py-3 bg-[#0033A0] text-white rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {accepting === ride.rideId ? (
                        <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Aceptando…</>
                      ) : 'Aceptar viaje →'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* HISTORIAL */}
        {tab === 'history' && (
          <div className="space-y-2">
            {loadingHistory ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#0033A0] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <p className="text-4xl mb-2">📋</p>
                <p className="text-gray-500 text-sm">Aún no tienes viajes completados.</p>
              </div>
            ) : (
              history.map(ride => {
                const date = ride.createdAt ? new Date(ride.createdAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' }) : '';
                const done = ride.status === 'completed';
                return (
                  <div key={ride._id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">🚗</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{ride.destination?.address ?? 'Destino'}</p>
                      <p className="text-xs text-gray-400 truncate">{ride.origin?.address ?? ''} · {date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">{ride.fare ? `$${ride.fare.toFixed(2)}` : '—'}</p>
                      <span className={`text-xs font-medium ${done ? 'text-green-600' : 'text-gray-400'}`}>
                        {done ? 'Completado' : ride.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* WALLET */}
        {tab === 'wallet' && (
          <div className="space-y-4">
            <div className="rounded-3xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #0033A0 0%, #001f6b 100%)' }}>
              <p className="text-white/60 text-sm">Saldo disponible</p>
              <p className="text-4xl font-black mt-1">$0.00</p>
              <p className="text-white/50 text-xs mt-3">Ganancias acumuladas del período actual</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-all flex flex-col items-center gap-2">
                <span className="text-2xl">📤</span>
                <span className="text-sm font-semibold text-gray-700">Transferir</span>
              </button>
              <button className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-all flex flex-col items-center gap-2">
                <span className="text-2xl">📊</span>
                <span className="text-sm font-semibold text-gray-700">Reporte</span>
              </button>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-[#0033A0] font-semibold text-sm">💡 Próximamente</p>
              <p className="text-blue-600 text-xs mt-1">Retiros a cuenta bancaria y reportes detallados estarán disponibles pronto.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
