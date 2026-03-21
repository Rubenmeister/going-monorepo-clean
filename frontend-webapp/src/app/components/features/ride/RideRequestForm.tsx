'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRideService } from '@/hooks/features/useRideService';
import { LocationSelector } from './LocationSelector';
import type { RideType } from '@/types';
import { RIDE_TYPES } from '@/types';

function RideRequestFormInner() {
  const searchParams = useSearchParams();
  const [selectedRideType, setSelectedRideType] = useState<RideType>('economy');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);

  const {
    pickupLocation,
    dropoffLocation,
    estimatedFare,
    loading,
    error,
    setPickupLocation,
    setDropoffLocation,
    createRide,
  } = useRideService();

  // Pre-fill from URL params (coming from Home search)
  useEffect(() => {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const date = searchParams.get('date');
    const time = searchParams.get('time');

    if (from && !pickupLocation) {
      setPickupLocation({ address: from, lat: 0, lon: 0 });
    }
    if (to && !dropoffLocation) {
      setDropoffLocation({ address: to, lat: 0, lon: 0 });
    }
    if (date) {
      setScheduledDate(date);
      setIsScheduled(true);
    }
    if (time) {
      setScheduledTime(time);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupLocation || !dropoffLocation) return;
    await createRide(selectedRideType);
  };

  // Today's date for min constraint
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
      <h2 className="text-2xl font-bold text-gray-900">Solicitar viaje</h2>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Locations */}
      <div className="space-y-3">
        <LocationSelector
          type="pickup"
          value={pickupLocation || undefined}
          onChange={setPickupLocation}
          placeholder="¿De dónde sales?"
        />
        <LocationSelector
          type="dropoff"
          value={dropoffLocation || undefined}
          onChange={setDropoffLocation}
          placeholder="¿Hacia dónde vas?"
        />
      </div>

      {/* Scheduled vs. Now toggle */}
      <div className="flex gap-2">
        <button type="button"
          onClick={() => setIsScheduled(false)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            !isScheduled ? 'bg-[#ff4c41] text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}>
          ⚡ Ahora
        </button>
        <button type="button"
          onClick={() => setIsScheduled(true)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            isScheduled ? 'bg-[#ff4c41] text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}>
          📅 Programar
        </button>
      </div>

      {/* Date & time (only when scheduled) */}
      {isScheduled && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              📅 Fecha
            </label>
            <input
              type="date"
              min={today}
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff4c41] text-sm text-gray-800"
              required={isScheduled}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              🕐 Hora
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={e => setScheduledTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff4c41] text-sm text-gray-800"
              required={isScheduled}
            />
          </div>
        </div>
      )}

      {/* Ride type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tipo de vehículo
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(RIDE_TYPES) as Array<[RideType, (typeof RIDE_TYPES)[RideType]]>).map(
            ([type, { emoji }]) => {
              const labels: Record<RideType, string> = {
                economy: 'Económico',
                comfort: 'Comfort',
                premium: 'Premium',
              };
              return (
                <button key={type} type="button"
                  onClick={() => setSelectedRideType(type)}
                  className={`p-3 rounded-2xl border-2 transition ${
                    selectedRideType === type
                      ? 'border-[#ff4c41] bg-[#ff4c41] bg-opacity-10'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                  <p className="text-2xl mb-1">{emoji}</p>
                  <p className="font-semibold text-gray-800 text-sm">{labels[type]}</p>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Fare estimate */}
      {estimatedFare && pickupLocation && dropoffLocation && (
        <FareEstimate
          fare={estimatedFare}
          pickup={pickupLocation}
          dropoff={dropoffLocation}
          rideType={selectedRideType}
          scheduled={isScheduled ? `${scheduledDate} ${scheduledTime}` : undefined}
        />
      )}

      {!estimatedFare && pickupLocation && dropoffLocation && (
        <div className="bg-[#fff2f2] rounded-2xl p-4 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-[#ff4c41] rounded-full animate-spin" />
          <span className="text-sm text-gray-600">Calculando tarifa...</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!pickupLocation || !dropoffLocation || loading || !estimatedFare || (isScheduled && (!scheduledDate || !scheduledTime))}
        className="w-full text-white py-3.5 rounded-2xl font-semibold transition disabled:bg-gray-300 disabled:cursor-not-allowed hover:opacity-90 text-base"
        style={{ backgroundColor: '#ff4c41' }}
      >
        {loading
          ? 'Confirmando viaje...'
          : isScheduled
          ? `Programar viaje · ${scheduledDate} ${scheduledTime}`
          : 'Confirmar viaje ahora'}
      </button>
    </form>
  );
}

export function RideRequestForm() {
  return (
    <Suspense fallback={<div className="animate-pulse bg-gray-100 rounded-2xl h-96" />}>
      <RideRequestFormInner />
    </Suspense>
  );
}

/* ── FareEstimate ───────────────────────────────────────────────────── */
interface FareEstimateProps {
  fare: number;
  pickup: { lat: number; lon: number };
  dropoff: { lat: number; lon: number };
  rideType: RideType;
  scheduled?: string;
}

function FareEstimate({ fare, pickup, dropoff, rideType, scheduled }: FareEstimateProps) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(dropoff.lat - pickup.lat);
  const dLon = toRad(dropoff.lon - pickup.lon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(pickup.lat)) * Math.cos(toRad(dropoff.lat)) * Math.sin(dLon / 2) ** 2;
  const distance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
  const duration = Math.round(distance * 2.5);

  const baseFare = 2.5;
  const perKmRate = 0.75;

  const categoryInfo: Record<RideType, { label: string; emoji: string }> = {
    economy: { label: 'Económico', emoji: '🚗' },
    comfort: { label: 'Comfort', emoji: '🚙' },
    premium: { label: 'Premium', emoji: '🚘' },
  };
  const info = categoryInfo[rideType];

  return (
    <div className="bg-[#fff2f2] rounded-2xl p-4 border border-[#ffe6e4]">
      <div className="mb-4 pb-4 border-b border-[#ffe6e4] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{info.emoji}</span>
          <span className="text-sm font-medium text-gray-700">{info.label}</span>
        </div>
        {scheduled && (
          <span className="text-xs bg-[#ff4c41] text-white px-2.5 py-1 rounded-full font-bold">
            📅 Programado
          </span>
        )}
      </div>
      <div className="mb-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Tarifa base:</span>
          <span>${baseFare.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>{distance} km × ${perKmRate.toFixed(2)}/km:</span>
          <span>${(distance * perKmRate).toFixed(2)}</span>
        </div>
      </div>
      <div className="pt-4 border-t border-[#ffe6e4]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Tarifa estimada:</span>
          <span className="text-2xl font-bold" style={{ color: '#ff4c41' }}>
            ${fare.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>{distance.toFixed(1)} km</span>
          <span>~{duration} min</span>
        </div>
      </div>
    </div>
  );
}
