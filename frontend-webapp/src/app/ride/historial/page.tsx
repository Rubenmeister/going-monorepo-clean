'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-gateway-780842550857.us-central1.run.app';

function parseJwt(token: string) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch { return null; }
}

interface Ride {
  _id: string;
  status: string;
  origin?: { address: string };
  destination?: { address: string };
  fare?: number;
  createdAt?: string;
}

const STATUS: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Buscando conductor', color: '#f59e0b' },
  accepted:    { label: 'Conductor asignado', color: '#0033A0' },
  in_progress: { label: 'En curso',           color: '#16a34a' },
  completed:   { label: 'Completado',         color: '#6b7280' },
  cancelled:   { label: 'Cancelado',          color: '#ef4444' },
};

export default function HistorialPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { window.location.href = '/auth/login?from=/ride/historial'; return; }
    const p = parseJwt(token);
    if (!p) { window.location.href = '/auth/login'; return; }

    fetch(`${API_URL}/transport/user/${p.sub || p.userId}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setRides(Array.isArray(data) ? data : []))
      .catch(() => setRides([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard/pasajero"
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            ←
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Historial de viajes</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#0033A0] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rides.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center">
            <p className="text-5xl mb-3">🚕</p>
            <p className="text-lg font-bold text-gray-700">Sin viajes aún</p>
            <p className="text-sm text-gray-400 mt-1">¡Reserva tu primer viaje con Going!</p>
            <Link href="/ride"
              className="inline-block mt-4 px-6 py-3 rounded-2xl text-white font-bold text-sm"
              style={{ backgroundColor: '#ff4c41' }}>
              Buscar viaje →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {rides.map(ride => {
              const s = STATUS[ride.status] ?? { label: ride.status, color: '#6b7280' };
              const date = ride.createdAt
                ? new Date(ride.createdAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })
                : '';
              return (
                <div key={ride._id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">🚗</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {ride.destination?.address ?? 'Destino desconocido'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {ride.origin?.address ?? ''}{date ? ` · ${date}` : ''}
                    </p>
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
  );
}
