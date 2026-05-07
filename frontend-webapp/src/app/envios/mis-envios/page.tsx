'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch, getStoredToken, redirectToLogin } from '@/lib/providers/auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com';

interface Parcel {
  id: string;
  trackingCode: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: 'card' | 'cash';
  payerRole?: 'sender' | 'recipient';
  origin?: { address: string };
  destination?: { address: string };
  price?: { amount: number; currency: string };
  createdAt?: string;
  recipientName?: string;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:                   { label: 'Buscando conductor',     color: '#f59e0b' },
  pending_payment:           { label: 'Esperando tu pago',      color: '#f59e0b' },
  pending_recipient_payment: { label: 'Esperando pago receptor',color: '#f59e0b' },
  pickup_assigned:           { label: 'Conductor asignado',     color: '#0033A0' },
  in_transit:                { label: 'En tránsito',            color: '#16a34a' },
  delivered:                 { label: 'Entregado',              color: '#6b7280' },
  cancelled:                 { label: 'Cancelado',              color: '#ef4444' },
};

const SCHEME_LABEL = (p: Parcel): string => {
  if (!p.paymentMethod || !p.payerRole) return '';
  if (p.payerRole === 'sender' && p.paymentMethod === 'card') return 'Tu tarjeta';
  if (p.payerRole === 'sender' && p.paymentMethod === 'cash') return 'Tu efectivo';
  if (p.payerRole === 'recipient' && p.paymentMethod === 'card') return 'Tarjeta del receptor';
  return 'Contra entrega (efectivo)';
};

export default function MisEnviosPage() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      redirectToLogin('/envios/mis-envios');
      return;
    }
    authFetch(`${API_URL}/parcels/my`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.parcels)
          ? (data as any).parcels
          : [];
        // Convertir Parcel domain primitives → shape esperado por la página
        setParcels(
          list.map((p: any) => ({
            id: p.id ?? p._id,
            trackingCode: p.trackingCode,
            status: p.status,
            paymentStatus: p.paymentStatus,
            paymentMethod: p.paymentMethod,
            payerRole: p.payerRole,
            origin: p.origin,
            destination: p.destination,
            price: p.price,
            createdAt: p.createdAt,
            recipientName: p.recipientName,
          })),
        );
      })
      .catch(() => setParcels([]))
      .finally(() => setLoading(false));
  }, []);

  const fmtDate = (iso?: string) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link
            href="/dashboard/pasajero"
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            ←
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Mis envíos</h1>
          <Link
            href="/envios/cotizar"
            className="ml-auto text-sm font-bold text-white px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: '#ff4c41' }}
          >
            + Nuevo envío
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#ff4c41] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : parcels.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="font-black text-lg text-gray-900 mb-2">
              Aún no tienes envíos
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Cotiza tu primer envío en segundos. Mismo día, rastreo en tiempo
              real, entrega garantizada.
            </p>
            <Link
              href="/envios/cotizar"
              className="inline-block px-6 py-3 rounded-xl font-bold text-white"
              style={{ backgroundColor: '#ff4c41' }}
            >
              Cotizar ahora →
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {parcels.map((p) => {
              const status = STATUS_LABEL[p.status] ?? {
                label: p.status,
                color: '#6b7280',
              };
              return (
                <li key={p.id}>
                  <Link
                    href={`/envios/tracking/${p.trackingCode}`}
                    className="block bg-white rounded-2xl p-4 border border-gray-100 hover:border-[#ff4c41] hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: status.color }}
                          >
                            {status.label}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            #{p.trackingCode}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 truncate">
                          → {p.destination?.address ?? 'Destino desconocido'}
                        </p>
                        {p.recipientName && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Para: {p.recipientName}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-black text-gray-900">
                          ${p.price?.amount.toFixed(2) ?? '—'}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {SCHEME_LABEL(p)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>📍 {p.origin?.address?.slice(0, 40) ?? '—'}</span>
                      <span>{fmtDate(p.createdAt)}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
