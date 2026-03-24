'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-gateway-780842550857.us-central1.run.app';

interface UserInfo {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  roles: string[];
}

interface Ride {
  _id: string;
  status: string;
  origin?: { address: string };
  destination?: { address: string };
  fare?: number;
  createdAt?: string;
}

function parseJwt(token: string): UserInfo | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const p = JSON.parse(atob(base64));
    return {
      id: p.sub || p.userId || '',
      firstName: p.firstName || p.name || 'Usuario',
      lastName: p.lastName,
      email: p.email,
      roles: Array.isArray(p.roles) ? p.roles : [],
    };
  } catch { return null; }
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Buscando conductor', color: '#f59e0b' },
  accepted:  { label: 'Conductor asignado', color: '#0033A0' },
  in_progress: { label: 'En curso',         color: '#16a34a' },
  completed: { label: 'Completado',          color: '#6b7280' },
  cancelled: { label: 'Cancelado',           color: '#ef4444' },
};

export default function PassengerDashboard() {
  const [user, setUser]         = useState<UserInfo | null>(null);
  const [rides, setRides]       = useState<Ride[]>([]);
  const [loadingRides, setLoadingRides] = useState(true);
  const [walletBalance] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { window.location.href = '/auth/login?from=/dashboard/pasajero'; return; }
    const decoded = parseJwt(token);
    if (!decoded) { window.location.href = '/auth/login'; return; }
    setUser(decoded);

    // Cargar historial de viajes
    fetch(`${API_URL}/transport/user/${decoded.id}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setRides(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => setRides([]))
      .finally(() => setLoadingRides(false));
  }, []);

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#ff4c41] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = `${user.firstName[0]}${user.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg, #0033A0 0%, #001f6b 100%)' }} className="text-white px-6 pt-8 pb-16">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
              {initials}
            </div>
            <div>
              <p className="text-white/70 text-xs">Bienvenido</p>
              <h1 className="text-xl font-bold">{user.firstName} {user.lastName ?? ''}</h1>
            </div>
          </div>
          <button onClick={logout} className="text-xs text-white/60 hover:text-white border border-white/20 px-3 py-1.5 rounded-lg transition-colors">
            Salir
          </button>
        </div>

        {/* Wallet preview */}
        <div className="max-w-2xl mx-auto mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-between border border-white/20">
            <div>
              <p className="text-white/60 text-xs">Going Wallet</p>
              <p className="text-2xl font-bold mt-0.5">
                {walletBalance !== null ? `$${walletBalance.toFixed(2)}` : '—'}
              </p>
            </div>
            <Link href="/payment/wallet" className="bg-white text-[#0033A0] text-xs font-bold px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors">
              Recargar
            </Link>
          </div>
        </div>
      </div>

      {/* ── Acciones principales ── */}
      <div className="max-w-2xl mx-auto px-6 -mt-6 space-y-4">

        {/* Pedir viaje — card grande */}
        <Link href="/ride" className="block bg-[#FFCD00] rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#0033A0] text-xs font-semibold uppercase tracking-widest mb-1">Transporte</p>
              <h2 className="text-2xl font-black text-[#0033A0] leading-tight">Pedir un viaje</h2>
              <p className="text-[#0033A0]/70 text-sm mt-1">Rápido, seguro y rastreable</p>
            </div>
            <div className="w-16 h-16 bg-[#0033A0] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-3xl">🚗</span>
            </div>
          </div>
        </Link>

        {/* Grid de acciones secundarias */}
        <div className="grid grid-cols-3 gap-3">
          <Link href="/payment/wallet" className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-[#0033A0] hover:shadow-md transition-all flex flex-col items-center gap-2 text-center">
            <span className="text-2xl">💳</span>
            <span className="text-xs font-semibold text-gray-700">Wallet</span>
          </Link>
          <Link href="/ride/historial" className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-[#0033A0] hover:shadow-md transition-all flex flex-col items-center gap-2 text-center">
            <span className="text-2xl">🕐</span>
            <span className="text-xs font-semibold text-gray-700">Historial</span>
          </Link>
          <Link href="/sos" className="bg-white rounded-2xl p-4 border border-red-100 hover:border-red-400 hover:shadow-md transition-all flex flex-col items-center gap-2 text-center group">
            <span className="text-2xl">🆘</span>
            <span className="text-xs font-semibold text-red-500 group-hover:text-red-600">SOS</span>
          </Link>
        </div>

        {/* Más servicios */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Más servicios</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '📦', label: 'Envíos',       href: '/envios',    color: '#f59e0b' },
              { icon: '🏨', label: 'Alojamiento',  href: '/bookings',  color: '#8b5cf6' },
              { icon: '🗺️', label: 'Tours',        href: '/tours',     color: '#10b981' },
              { icon: '⚙️', label: 'Mi cuenta',    href: '/account',   color: '#6b7280' },
            ].map(item => (
              <Link key={item.label} href={item.href}
                className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-all flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-semibold text-gray-800">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Últimos viajes */}
        <div className="pb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Últimos viajes</p>
            <Link href="/ride/historial" className="text-xs text-[#0033A0] font-semibold hover:underline">Ver todos →</Link>
          </div>

          {loadingRides ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#0033A0] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rides.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <p className="text-4xl mb-2">🚕</p>
              <p className="text-gray-500 text-sm">Aún no tienes viajes. ¡Pide el primero!</p>
              <Link href="/ride" className="inline-block mt-3 text-sm font-bold text-[#0033A0] underline">
                Pedir viaje →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {rides.map(ride => {
                const s = STATUS_LABEL[ride.status] ?? { label: ride.status, color: '#6b7280' };
                const date = ride.createdAt ? new Date(ride.createdAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' }) : '';
                return (
                  <div key={ride._id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">🚗</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {ride.destination?.address ?? 'Destino desconocido'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{ride.origin?.address ?? ''} · {date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">
                        {ride.fare ? `$${ride.fare.toFixed(2)}` : '—'}
                      </p>
                      <span className="text-xs font-medium" style={{ color: s.color }}>{s.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
