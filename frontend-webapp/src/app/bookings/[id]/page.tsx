'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { rideService } from '@/services/ride/rideService';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-gateway-780842550857.us-central1.run.app/api';

interface TripDetail {
  id: string;
  type: 'ride' | 'accommodation' | 'tour' | 'experience' | 'parcel';
  status: string;
  title: string;
  date: string;
  amount: number;
  // ride fields
  pickup?: string;
  dropoff?: string;
  driverName?: string;
  driverRating?: number;
  driverVehicle?: string;
  driverPlate?: string;
  distance?: number;
  duration?: number;
  paymentMethod?: string;
  // parcel fields
  origin?: string;
  destination?: string;
  trackingCode?: string;
  weight?: number;
  // accommodation/tour/experience
  location?: string;
  description?: string;
  checkIn?: string;
  checkOut?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  confirmed:   { label: 'Confirmada',   color: '#10b981', bg: '#ecfdf5', icon: '✓'  },
  pending:     { label: 'Pendiente',    color: '#f59e0b', bg: '#fffbeb', icon: '⏳' },
  in_progress: { label: 'En curso',     color: '#3b82f6', bg: '#eff6ff', icon: '▶'  },
  completed:   { label: 'Completada',   color: '#6b7280', bg: '#f9fafb', icon: '✓'  },
  cancelled:   { label: 'Cancelada',    color: '#ef4444', bg: '#fef2f2', icon: '✗'  },
};

const TYPE_LABELS: Record<string, string> = {
  ride: 'Transporte', accommodation: 'Hospedaje', tour: 'Tour',
  experience: 'Experiencia', parcel: 'Envío Express',
};

export default function TripDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const { auth, domain } = useMonorepoApp();
  const rawId = params?.id;
  const id = (Array.isArray(rawId) ? rawId[0] : rawId) ?? '';

  const [detail, setDetail]   = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token') || '';

    async function load() {
      setLoading(true);
      setError(null);

      // Intentar como ride primero, luego como booking, luego como parcel
      const [rideRes, bkgRes, parcelRes] = await Promise.allSettled([
        fetch(`${API_URL}/transport/rides/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
        fetch(`${API_URL}/bookings/${id}`,         { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
        fetch(`${API_URL}/envios/parcels/${id}`,   { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
      ]);

      const ride    = rideRes.status    === 'fulfilled' ? rideRes.value    : null;
      const booking = bkgRes.status     === 'fulfilled' ? bkgRes.value     : null;
      const parcel  = parcelRes.status  === 'fulfilled' ? parcelRes.value  : null;

      if (ride) {
        setDetail({
          id, type: 'ride',
          status:  ride.status ?? 'pending',
          title:   'Transporte Going',
          date:    ride.createdAt ?? ride.requestedAt ?? '',
          amount:  ride.finalFare ?? ride.estimatedFare ?? 0,
          pickup:  ride.pickup?.address ?? ride.pickupAddress ?? '—',
          dropoff: ride.dropoff?.address ?? ride.dropoffAddress ?? '—',
          driverName:   ride.driverInfo?.name,
          driverRating: ride.driverInfo?.rating,
          driverVehicle: ride.driverInfo?.vehicle,
          driverPlate:   ride.driverInfo?.licensePlate,
          distance:      ride.distance,
          duration:      ride.duration,
          paymentMethod: ride.paymentMethod,
        });
      } else if (parcel) {
        setDetail({
          id, type: 'parcel',
          status:       parcel.status ?? 'pending',
          title:        'Envío Express',
          date:         parcel.createdAt ?? '',
          amount:       parcel.price?.amount ?? parcel.cost ?? 0,
          origin:       parcel.origin,
          destination:  parcel.destination,
          trackingCode: parcel.trackingCode ?? parcel.trackingId,
          weight:       parcel.weight,
        });
      } else if (booking) {
        const type = (['tour', 'experience', 'accommodation'].find(t =>
          booking.serviceType === t || booking.type === t
        ) ?? 'accommodation') as TripDetail['type'];
        setDetail({
          id, type,
          status:      booking.status ?? 'pending',
          title:       booking.name ?? booking.title ?? TYPE_LABELS[type],
          date:        booking.scheduledAt ?? booking.date ?? booking.createdAt ?? '',
          amount:      booking.totalPrice?.amount ?? booking.amount ?? 0,
          location:    booking.location ?? booking.address,
          description: booking.description ?? booking.detail,
          checkIn:     booking.checkIn,
          checkOut:    booking.checkOut,
        });
      } else {
        setError('No se pudo cargar el detalle de esta reserva.');
      }
      setLoading(false);
    }

    load();
  }, [id]);

  const handleCancel = async () => {
    if (!detail) return;
    if (!confirm('¿Cancelar esta reserva?')) return;
    setCancelling(true);
    try {
      if (detail.type === 'ride') {
        await rideService.cancelRide(id);
      } else {
        await domain.bookings.cancel(id);
      }
      setDetail(prev => prev ? { ...prev, status: 'cancelled' } : prev);
    } catch (e: any) {
      alert(`No se pudo cancelar: ${e.message}`);
    } finally {
      setCancelling(false);
    }
  };

  const st = STATUS_CONFIG[detail?.status ?? 'pending'] ?? STATUS_CONFIG.pending;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/bookings"
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            ←
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Detalle de reserva</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-4xl mb-3">😔</p>
            <p className="font-semibold text-gray-800">{error}</p>
            <Link href="/bookings" className="mt-4 inline-block text-sm text-[#ff4c41] font-semibold underline">
              Volver a reservas
            </Link>
          </div>
        ) : detail && (
          <>
            {/* Status card */}
            <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: st.bg }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: st.color + '20' }}>
                {st.icon}
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-medium">{TYPE_LABELS[detail.type]}</p>
                <p className="font-bold text-gray-900 text-lg">{detail.title}</p>
                <p className="text-sm font-semibold" style={{ color: st.color }}>{st.label}</p>
              </div>
              <p className="text-2xl font-black" style={{ color: '#ff4c41' }}>${detail.amount.toFixed(2)}</p>
            </div>

            {/* Fecha */}
            {detail.date && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <span className="text-xl">📅</span>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Fecha</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {new Date(detail.date).toLocaleString('es-EC', {
                      day: '2-digit', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Ride details */}
            {detail.type === 'ride' && (
              <>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Ruta</p>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                      <div className="w-0.5 h-8 bg-gray-200" />
                      <div className="w-3 h-3 rounded-full bg-[#ff4c41] flex-shrink-0" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <p className="text-xs text-gray-400">Origen</p>
                        <p className="text-sm font-medium text-gray-800">{detail.pickup}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Destino</p>
                        <p className="text-sm font-medium text-gray-800">{detail.dropoff}</p>
                      </div>
                    </div>
                  </div>
                  {(detail.distance || detail.duration) && (
                    <div className="flex gap-4 pt-2 border-t border-gray-50">
                      {detail.distance && (
                        <div>
                          <p className="text-xs text-gray-400">Distancia</p>
                          <p className="text-sm font-bold text-gray-800">{detail.distance.toFixed(1)} km</p>
                        </div>
                      )}
                      {detail.duration && (
                        <div>
                          <p className="text-xs text-gray-400">Duración</p>
                          <p className="text-sm font-bold text-gray-800">{detail.duration} min</p>
                        </div>
                      )}
                      {detail.paymentMethod && (
                        <div>
                          <p className="text-xs text-gray-400">Pago</p>
                          <p className="text-sm font-bold text-gray-800 capitalize">{detail.paymentMethod}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {detail.driverName && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Conductor</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">👤</div>
                      <div>
                        <p className="font-bold text-gray-900">{detail.driverName}</p>
                        {detail.driverRating && (
                          <p className="text-yellow-400 text-sm">
                            {'★'.repeat(Math.round(detail.driverRating))}
                            <span className="text-gray-400 ml-1">{detail.driverRating.toFixed(1)}</span>
                          </p>
                        )}
                        {detail.driverVehicle && (
                          <p className="text-xs text-gray-400">{detail.driverVehicle} · <span className="font-mono font-bold text-gray-600">{detail.driverPlate}</span></p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Parcel details */}
            {detail.type === 'parcel' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Envío</p>
                {detail.trackingCode && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                    <p className="text-xs text-blue-500 font-medium mb-1">Código de rastreo</p>
                    <p className="font-black text-blue-900 tracking-widest font-mono">{detail.trackingCode}</p>
                  </div>
                )}
                <div className="space-y-2">
                  {detail.origin && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400 w-16 flex-shrink-0 text-xs">Origen</span>
                      <span className="text-gray-800 font-medium">{detail.origin}</span>
                    </div>
                  )}
                  {detail.destination && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400 w-16 flex-shrink-0 text-xs">Destino</span>
                      <span className="text-gray-800 font-medium">{detail.destination}</span>
                    </div>
                  )}
                  {detail.weight && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400 w-16 flex-shrink-0 text-xs">Peso</span>
                      <span className="text-gray-800 font-medium">{detail.weight} kg</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Accommodation / tour / experience details */}
            {['accommodation', 'tour', 'experience'].includes(detail.type) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{TYPE_LABELS[detail.type]}</p>
                {detail.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 text-xs w-20 flex-shrink-0">Lugar</span>
                    <span className="text-gray-800 font-medium">{detail.location}</span>
                  </div>
                )}
                {detail.description && (
                  <p className="text-sm text-gray-600">{detail.description}</p>
                )}
                {detail.checkIn && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 text-xs w-20 flex-shrink-0">Check-in</span>
                    <span className="text-gray-800 font-medium">{new Date(detail.checkIn).toLocaleDateString('es-EC')}</span>
                  </div>
                )}
                {detail.checkOut && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 text-xs w-20 flex-shrink-0">Check-out</span>
                    <span className="text-gray-800 font-medium">{new Date(detail.checkOut).toLocaleDateString('es-EC')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {['confirmed', 'pending'].includes(detail.status) && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 py-3 rounded-2xl border border-red-300 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {cancelling ? 'Cancelando…' : '✗ Cancelar reserva'}
                </button>
              )}
              <Link href="/ride"
                className="flex-1 py-3 rounded-2xl text-white font-bold text-sm text-center transition-all hover:opacity-90"
                style={{ backgroundColor: '#ff4c41' }}>
                + Nuevo viaje
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
          </>
        )}
      </div>
    </div>
  );
}
