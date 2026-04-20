'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-gateway-780842550857.us-central1.run.app/api';

function parseJwt(token: string) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch { return null; }
}

interface PointsData {
  balance: number;
  tier: string;
  nextTier: string;
  nextTierAt: number;
  history: { id: string; description: string; points: number; date: string }[];
}

const TIER_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  bronze:   { color: '#cd7f32', bg: '#fdf3e7', icon: '🥉', label: 'Bronce' },
  silver:   { color: '#9ca3af', bg: '#f3f4f6', icon: '🥈', label: 'Plata'  },
  gold:     { color: '#f59e0b', bg: '#fffbeb', icon: '🥇', label: 'Oro'    },
  platinum: { color: '#0033A0', bg: '#eff6ff', icon: '💎', label: 'Platino'},
};

const REWARDS = [
  { points: 500,  label: 'Descuento $2',          icon: '🎟️', desc: '2 USD en tu próximo viaje' },
  { points: 1000, label: 'Viaje gratis $5',        icon: '🚗', desc: 'Válido para viajes hasta $5' },
  { points: 2000, label: 'Hospedaje 10% off',      icon: '🏨', desc: 'Descuento en alojamientos Going' },
  { points: 5000, label: 'Tour de Galápagos -20%', icon: '🌋', desc: 'Descuento en tours seleccionados' },
];

export default function PuntosPage() {
  const [data, setData]     = useState<PointsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId]   = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
    if (!token) { window.location.href = '/auth/login?from=/puntos'; return; }
    const p = parseJwt(token);
    const uid = p?.id || p?.sub || p?.userId || '';
    if (uid) setUserId(uid);

    if (!uid) {
      setData({ balance: 0, tier: 'bronze', nextTier: 'silver', nextTierAt: 1000, history: [] });
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/users/${uid}/points`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json) {
          setData({
            balance:    json.balance ?? json.points ?? 0,
            tier:       json.tier ?? 'bronze',
            nextTier:   json.nextTier ?? 'silver',
            nextTierAt: json.nextTierAt ?? 1000,
            history:    json.history ?? json.transactions ?? [],
          });
        } else {
          // Fallback visual si la API no existe aún
          setData({ balance: 0, tier: 'bronze', nextTier: 'silver', nextTierAt: 1000, history: [] });
        }
      })
      .catch(() => setData({ balance: 0, tier: 'bronze', nextTier: 'silver', nextTierAt: 1000, history: [] }))
      .finally(() => setLoading(false));
  }, []);

  const tier = TIER_CONFIG[data?.tier ?? 'bronze'] ?? TIER_CONFIG.bronze;
  const progress = data ? Math.min((data.balance / data.nextTierAt) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard/pasajero"
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            ←
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Going Puntos</h1>
          <span className="ml-auto text-sm font-bold px-3 py-1 rounded-full" style={{ background: tier.bg, color: tier.color }}>
            {tier.icon} {tier.label}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Balance card */}
        <div className="rounded-3xl p-6 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #ff4c41, #c0392b)' }}>
          <p className="text-white/70 text-sm mb-1">Tus puntos Going</p>
          {loading ? (
            <div className="h-14 w-32 bg-white/20 rounded-2xl animate-pulse" />
          ) : (
            <p className="text-6xl font-black">{data?.balance ?? 0}</p>
          )}
          <p className="text-white/60 text-xs mt-1">pts acumulados</p>
        </div>

        {/* Tier progress */}
        {data && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-bold text-gray-700">Progreso hacia {TIER_CONFIG[data.nextTier]?.label ?? 'siguiente nivel'}</p>
              <p className="text-xs text-gray-400">{data.balance} / {data.nextTierAt} pts</p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #ff4c41, #ff7c72)' }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Te faltan <span className="font-bold text-gray-700">{Math.max(0, data.nextTierAt - data.balance)} pts</span> para {TIER_CONFIG[data.nextTier]?.label ?? 'subir de nivel'} {TIER_CONFIG[data.nextTier]?.icon}
            </p>
          </div>
        )}

        {/* Cómo ganar puntos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm font-bold text-gray-700 mb-3">¿Cómo ganar puntos?</p>
          <div className="space-y-2">
            {[
              { icon: '🚗', label: 'Cada viaje completado',   pts: '+10 pts' },
              { icon: '📦', label: 'Cada envío realizado',    pts: '+8 pts'  },
              { icon: '🏨', label: 'Reserva de hospedaje',    pts: '+50 pts' },
              { icon: '⭐', label: 'Califica tu conductor',   pts: '+2 pts'  },
              { icon: '👥', label: 'Refiere un amigo',        pts: '+100 pts'},
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-[#ff4c41]">{item.pts}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Catálogo de recompensas */}
        <div>
          <p className="text-sm font-bold text-gray-700 mb-3 px-1">Canjea tus puntos</p>
          <div className="grid grid-cols-2 gap-3">
            {REWARDS.map(r => {
              const canRedeem = (data?.balance ?? 0) >= r.points;
              return (
                <div key={r.label}
                  className={`bg-white rounded-2xl border p-4 transition-all ${canRedeem ? 'border-[#ff4c41] shadow-sm hover:shadow-md cursor-pointer' : 'border-gray-100 opacity-60'}`}>
                  <span className="text-3xl">{r.icon}</span>
                  <p className="font-bold text-gray-900 text-sm mt-2">{r.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                  <p className={`text-xs font-black mt-2 ${canRedeem ? 'text-[#ff4c41]' : 'text-gray-400'}`}>{r.points} pts</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Historial */}
        {data && data.history.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-bold text-gray-700 mb-3">Historial reciente</p>
            <div className="space-y-2">
              {data.history.slice(0, 10).map(h => (
                <div key={h.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-700">{h.description}</p>
                    <p className="text-xs text-gray-400">{new Date(h.date).toLocaleDateString('es-EC')}</p>
                  </div>
                  <span className={`text-sm font-bold ${h.points >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {h.points >= 0 ? '+' : ''}{h.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA ganar más */}
        <Link href="/ride"
          className="block w-full py-4 rounded-2xl text-center font-bold text-white text-sm transition-all hover:opacity-90"
          style={{ backgroundColor: '#ff4c41' }}>
          🚗 Hacer un viaje y ganar puntos
        </Link>
      </div>
    </div>
  );
}
