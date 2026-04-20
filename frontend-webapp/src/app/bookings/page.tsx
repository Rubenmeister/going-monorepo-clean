'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { rideService } from '@/services/ride/rideService';

/* ─── Tipos unificados ───────────────────────────────────────── */
type BookingStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'in_progress';
type BookingType   = 'ride' | 'accommodation' | 'tour' | 'experience' | 'parcel';

interface Booking {
  id:     string;
  type:   BookingType;
  icon:   string;
  title:  string;
  detail: string;
  date:   string;
  time:   string;
  amount: string;
  status: BookingStatus;
  rawStatus: string;
}

const TYPE_ICONS: Record<BookingType, string> = {
  ride:          '🚗',
  accommodation: '🏨',
  tour:          '🗺️',
  experience:    '🎭',
  parcel:        '📦',
};

const STATUS_COLORS: Record<string, string> = {
  confirmed:   'bg-green-100 text-green-700',
  pending:     'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed:   'bg-gray-100 text-gray-600',
  cancelled:   'bg-red-100 text-red-600',
};

const STATUS_LABELS: Record<string, string> = {
  confirmed:   '✓ Confirmada',
  pending:     '⏳ Pendiente',
  in_progress: '▶ En curso',
  completed:   '✓ Completada',
  cancelled:   '✗ Cancelada',
};

type FilterType = 'all' | 'upcoming' | 'completed' | 'cancelled';

/* ─── Normalización de datos de API ─────────────────────────── */
function normalizeStatus(s: string): BookingStatus {
  if (['confirmed', 'accepted'].includes(s))   return 'confirmed';
  if (['pending', 'pending_verification'].includes(s)) return 'pending';
  if (['in_progress', 'ongoing', 'active'].includes(s)) return 'in_progress';
  if (['completed', 'done', 'delivered'].includes(s)) return 'completed';
  if (['cancelled', 'canceled', 'rejected'].includes(s)) return 'cancelled';
  return 'pending';
}

function formatDate(iso: string): { date: string; time: string } {
  if (!iso) return { date: '—', time: '—' };
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
  };
}

function rideToBooking(r: any): Booking {
  const { date, time } = formatDate(r.createdAt ?? r.requestedAt ?? r.scheduledAt);
  const pickup  = r.pickup?.address  ?? r.pickupAddress  ?? '—';
  const dropoff = r.dropoff?.address ?? r.dropoffAddress ?? '—';
  const fare    = r.estimatedFare ?? r.finalFare ?? r.fare?.estimatedTotal ?? 0;
  return {
    id:        r.tripId ?? r.rideId ?? r.id ?? '—',
    type:      'ride',
    icon:      TYPE_ICONS.ride,
    title:     'Transporte Going',
    detail:    `${pickup} → ${dropoff}`,
    date,
    time,
    amount:    `$${Number(fare).toFixed(2)}`,
    status:    normalizeStatus(r.status ?? 'pending'),
    rawStatus: r.status ?? '',
  };
}

function bookingToBooking(b: any, type: BookingType = 'accommodation'): Booking {
  const { date, time } = formatDate(b.scheduledAt ?? b.date ?? b.createdAt);
  const amount = b.totalPrice?.amount ?? b.amount ?? b.price ?? 0;
  const labels: Record<BookingType, string> = {
    accommodation: 'Hospedaje',
    tour:          'Tour',
    experience:    'Experiencia',
    ride:          'Transporte',
    parcel:        'Envío',
  };
  return {
    id:        b.id ?? b._id ?? '—',
    type,
    icon:      TYPE_ICONS[type],
    title:     b.name ?? b.title ?? labels[type],
    detail:    b.description ?? b.detail ?? b.origin ?? '—',
    date,
    time,
    amount:    `$${Number(amount).toFixed(2)}`,
    status:    normalizeStatus(b.status ?? 'pending'),
    rawStatus: b.status ?? '',
  };
}

function parcelToBooking(p: any): Booking {
  const { date, time } = formatDate(p.createdAt ?? p.scheduledAt);
  const amount = p.price?.amount ?? p.amount ?? p.cost ?? 0;
  return {
    id:        p.id ?? p._id ?? '—',
    type:      'parcel',
    icon:      TYPE_ICONS.parcel,
    title:     'Envío Express',
    detail:    `${p.origin ?? '—'} → ${p.destination ?? '—'}${p.weight ? ` · ${p.weight} kg` : ''}`,
    date,
    time,
    amount:    `$${Number(amount).toFixed(2)}`,
    status:    normalizeStatus(p.status ?? 'pending'),
    rawStatus: p.status ?? '',
  };
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function BookingsPage() {
  const { auth, domain } = useMonorepoApp();
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [filter, setFilter]       = useState<FilterType>('all');
  const [cancelling, setCancelling] = useState<string | null>(null);

  const userId = (auth.user as any)?.id ?? (auth.user as any)?._id ?? '';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ridesRes, bookingsRes, parcelsRes] = await Promise.allSettled([
        rideService.getRideHistory(50),
        userId ? domain.bookings.findByUser(userId) : Promise.resolve([]),
        userId ? domain.parcels.findByUser(userId)   : Promise.resolve([]),
      ]);

      const rides:    Booking[] = ridesRes.status    === 'fulfilled' ? (ridesRes.value    as any[]).map(rideToBooking)    : [];
      const bkgs:     Booking[] = bookingsRes.status === 'fulfilled' ? (bookingsRes.value as any[]).map((b: any) => {
        const type = (['tour', 'experience', 'accommodation'].find(t => b.serviceType === t || b.type === t) ?? 'accommodation') as BookingType;
        return bookingToBooking(b, type);
      }) : [];
      const parcels:  Booking[] = parcelsRes.status  === 'fulfilled' ? (parcelsRes.value  as any[]).map(parcelToBooking)  : [];

      // Combinar y ordenar por fecha descendente
      const all = [...rides, ...bkgs, ...parcels].sort((a, b) => {
        const da = new Date(`${a.date} ${a.time}`).getTime();
        const db = new Date(`${b.date} ${b.time}`).getTime();
        return db - da;
      });

      setBookings(all);

      if (all.length === 0 && ridesRes.status === 'rejected') {
        setError('No se pudo conectar al servidor. Revisa tu conexión.');
      }
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (b: Booking) => {
    if (!confirm(`¿Cancelar esta reserva?\n${b.title} · ${b.detail}`)) return;
    setCancelling(b.id);
    try {
      if (b.type === 'ride') {
        await rideService.cancelRide(b.id);
      } else {
        await domain.bookings.cancel(b.id);
      }
      setBookings((prev) => prev.map((x) => x.id === b.id ? { ...x, status: 'cancelled' } : x));
    } catch (e: any) {
      alert(`No se pudo cancelar: ${e.message}`);
    } finally {
      setCancelling(null);
    }
  };

  const filtered = bookings.filter((b) => {
    if (filter === 'upcoming')  return ['confirmed', 'pending', 'in_progress'].includes(b.status);
    if (filter === 'completed') return b.status === 'completed';
    if (filter === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  const counts = {
    total:    bookings.length,
    upcoming: bookings.filter((b) => ['confirmed', 'pending', 'in_progress'].includes(b.status)).length,
    done:     bookings.filter((b) => b.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard/pasajero"
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            ←
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Mis Reservas</h1>
          <button onClick={load} disabled={loading}
            className="ml-auto text-xs text-[#ff4c41] font-semibold hover:underline disabled:opacity-40">
            {loading ? 'Cargando…' : '↻ Actualizar'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* Counters */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total',      value: counts.total,    filter: 'all'       },
            { label: 'Próximas',   value: counts.upcoming, filter: 'upcoming'  },
            { label: 'Completadas',value: counts.done,     filter: 'completed' },
          ].map(c => (
            <button key={c.filter}
              onClick={() => setFilter(c.filter as FilterType)}
              className={`rounded-2xl p-3 text-center transition-all border ${
                filter === c.filter
                  ? 'border-[#ff4c41] bg-red-50'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}>
              <p className={`text-2xl font-black ${filter === c.filter ? 'text-[#ff4c41]' : 'text-gray-900'}`}>
                {c.value}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', 'upcoming', 'completed', 'cancelled'] as FilterType[]).map(f => (
            <button key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === f
                  ? 'bg-[#ff4c41] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              {{ all: 'Todas', upcoming: 'Próximas', completed: 'Completadas', cancelled: 'Canceladas' }[f]}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-5xl mb-4">🎫</p>
            <p className="font-semibold text-gray-700">No hay reservas aquí aún</p>
            <p className="text-sm text-gray-400 mt-1 mb-6">
              {filter === 'all' ? 'Cuando hagas viajes o reservas aparecerán aquí' : `Sin reservas ${filter}`}
            </p>
            <Link href="/ride"
              className="inline-block px-6 py-3 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90"
              style={{ backgroundColor: '#ff4c41' }}>
              🚗 Hacer un viaje
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(b => (
              <Link key={b.id} href={`/bookings/${b.id}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
                    {b.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 text-sm truncate">{b.title}</p>
                      <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[b.status] ?? b.rawStatus}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{b.detail}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-400">{b.date} · {b.time}</span>
                      <span className="text-xs font-bold text-gray-900">{b.amount}</span>
                    </div>
                  </div>
                </div>
                {['confirmed', 'pending'].includes(b.status) && (
                  <div className="mt-3 pt-3 border-t border-gray-50 flex gap-2">
                    <button
                      onClick={(e) => { e.preventDefault(); handleCancel(b); }}
                      disabled={cancelling === b.id}
                      className="flex-1 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      {cancelling === b.id ? 'Cancelando…' : '✗ Cancelar'}
                    </button>
                    <span className="flex-1 py-2 rounded-xl bg-gray-50 text-gray-500 text-xs font-semibold text-center">
                      Ver detalle →
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
