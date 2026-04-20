'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRideService } from '@/hooks/features/useRideService';
import { LocationSelector } from './LocationSelector';
import { MapboxMap } from '@/components/features/tracking/TrackingMap';
import type { VehicleType, ServiceTier } from '@/types';
import { VEHICLE_TYPES } from '@/types';
import {
  calculateDistance,
  calculateEstimatedDuration,
  getFareBreakdown,
} from '@/services/ride/fareCalculator';

type TransportMode = 'privado' | 'compartido';
type SimpleVehicle = 'suv' | 'van' | 'bus';

const SIMPLE_VEHICLES: Record<SimpleVehicle, {
  label: string; emoji: string; desc: string;
  maxPax: number; vehicleForPax: (pax: number) => VehicleType;
}> = {
  suv: {
    label: 'SUV', emoji: '🚗', desc: 'Hasta 5 personas', maxPax: 5,
    vehicleForPax: (pax) => pax <= 4 ? 'suv' : 'suv_xl',
  },
  van: {
    label: 'VAN', emoji: '🚐', desc: 'Hasta 14 personas', maxPax: 14,
    vehicleForPax: (pax) => pax <= 7 ? 'van' : 'van_xl',
  },
  bus: {
    label: 'BUS', emoji: '🚌', desc: '15 o más personas', maxPax: 100,
    vehicleForPax: (pax) => pax <= 25 ? 'minibus' : 'bus',
  },
};

function suggestSimpleVehicle(pax: number): SimpleVehicle {
  if (pax <= 5) return 'suv';
  if (pax <= 14) return 'van';
  return 'bus';
}

// ─────────────────────────────────────────────────────────────
function RideRequestFormInner() {
  const searchParams = useSearchParams();

  const {
    pickupLocation,
    dropoffLocation,
    loading,
    error,
    setPickupLocation,
    setDropoffLocation,
    createRide,
  } = useRideService();

  const [mode, setMode]                   = useState<TransportMode>('privado');
  const [passengers, setPassengers]       = useState(1);
  const [simpleVehicle, setSimpleVehicle] = useState<SimpleVehicle>('suv');
  const [tier, setTier]                   = useState<ServiceTier>('confort');
  const [isScheduled, setIsScheduled]     = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [localFare, setLocalFare]         = useState<number | null>(null);
  const [fareFixed, setFareFixed]         = useState(false);

  // For compartido: always lock to SUV
  useEffect(() => {
    if (mode === 'compartido') setSimpleVehicle('suv');
  }, [mode]);

  // Auto-suggest vehicle based on pax count (privado only)
  useEffect(() => {
    if (mode === 'privado') setSimpleVehicle(suggestSimpleVehicle(passengers));
  }, [passengers, mode]);

  // Derived: actual VehicleType from simplified choice + pax count
  const vehicleType: VehicleType = SIMPLE_VEHICLES[simpleVehicle].vehicleForPax(passengers);
  const vehicleConfig = VEHICLE_TYPES[vehicleType];

  // Pre-fill from URL params
  useEffect(() => {
    const from = searchParams.get('from');
    const to   = searchParams.get('to');
    const date = searchParams.get('date');
    const time = searchParams.get('time');
    if (from && !pickupLocation)  setPickupLocation({ address: from, lat: 0, lon: 0 });
    if (to   && !dropoffLocation) setDropoffLocation({ address: to,  lat: 0, lon: 0 });
    if (date) { setScheduledDate(date); setIsScheduled(true); }
    if (time) { setScheduledTime(time); setIsScheduled(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate fare whenever route or vehicle changes
  useEffect(() => {
    if (
      pickupLocation && dropoffLocation &&
      pickupLocation.lat !== 0 && dropoffLocation.lat !== 0 &&
      pickupLocation.lat !== dropoffLocation.lat
    ) {
      try {
        const breakdown = getFareBreakdown(pickupLocation, dropoffLocation, vehicleType, tier, mode);
        const fare = breakdown.totalFare;
        setLocalFare(isNaN(fare) || !isFinite(fare) ? null : fare);
        setFareFixed(breakdown.isPriceFixed);
      } catch {
        setLocalFare(null);
        setFareFixed(false);
      }
    } else {
      setLocalFare(null);
      setFareFixed(false);
    }
  }, [pickupLocation, dropoffLocation, vehicleType, tier, vehicleConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupLocation || !dropoffLocation) return;
    await createRide(
      vehicleType,
      tier,
      passengers,
      isScheduled ? `${scheduledDate}T${scheduledTime}` : undefined,
      mode,
    );
  };

  const today         = new Date().toISOString().split('T')[0];
  const maxPax        = mode === 'compartido' ? 4 : SIMPLE_VEHICLES[simpleVehicle].maxPax;
  const hasRoute      = !!(pickupLocation && dropoffLocation);
  const hasValidRoute = hasRoute && pickupLocation!.lat !== 0 && dropoffLocation!.lat !== 0;
  // isScheduled = usuario ingresó fecha Y hora; si está incompleto (solo fecha o solo hora) no confirmar
  const scheduleOk    = !scheduledDate && !scheduledTime   // inmediato
    || (scheduledDate && scheduledTime);                    // programado completo
  const canConfirm    = hasValidRoute && localFare !== null && !loading && !!scheduleOk;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm">{error}</div>
      )}

      {/* ══════════════════════════════════════════
          TARJETA PRINCIPAL — todo en un lugar
          ══════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #0033A0, #ff4c41)' }} />
        <div className="p-5 space-y-5">

          <h2 className="text-xl font-black text-gray-900">¿A dónde deseas viajar?</h2>

          {/* Origen + Destino */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">📍 Origen</label>
              <LocationSelector
                type="pickup"
                value={pickupLocation || undefined}
                onChange={setPickupLocation}
                placeholder="Ciudad de origen"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">🏁 Destino</label>
              <LocationSelector
                type="dropoff"
                value={dropoffLocation || undefined}
                onChange={setDropoffLocation}
                placeholder="Ciudad de destino"
              />
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Tipo de viaje + Personas */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Toggle privado / compartido */}
            <div className="flex rounded-2xl border border-gray-200 overflow-hidden flex-shrink-0">
              {([
                { key: 'privado'    as TransportMode, icon: '🔒', label: 'Privado' },
                { key: 'compartido' as TransportMode, icon: '👥', label: 'Compartido' },
              ]).map(opt => (
                <button key={opt.key} type="button"
                  onClick={() => {
                    setMode(opt.key);
                    if (opt.key === 'compartido') setPassengers(p => Math.min(p, 4));
                  }}
                  className={`px-4 py-2.5 text-sm font-bold transition-all flex items-center gap-1.5 ${
                    mode === opt.key
                      ? 'bg-[#0033A0] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{opt.icon}</span>{opt.label}
                </button>
              ))}
            </div>

            {/* Contador de personas */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button type="button"
                onClick={() => setPassengers(p => Math.max(1, p - 1))}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 text-lg flex items-center justify-center transition-all active:scale-95">
                −
              </button>
              <span className="text-lg font-black text-[#0033A0] min-w-[2rem] text-center">{passengers}</span>
              <button type="button"
                onClick={() => setPassengers(p => Math.min(maxPax, p + 1))}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 text-lg flex items-center justify-center transition-all active:scale-95">
                +
              </button>
              <span className="text-sm text-gray-500">{passengers === 1 ? 'persona' : 'personas'}</span>
            </div>
          </div>

          {/* Tipo de vehículo — solo para PRIVADO */}
          {mode === 'privado' ? (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Vehículo</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(SIMPLE_VEHICLES) as SimpleVehicle[]).map(sv => {
                  const v = SIMPLE_VEHICLES[sv];
                  const isSelected = simpleVehicle === sv;
                  const fits = passengers <= v.maxPax;
                  return (
                    <button key={sv} type="button"
                      onClick={() => fits && setSimpleVehicle(sv)}
                      className={`p-3 rounded-2xl border-2 text-center transition-all ${
                        isSelected
                          ? 'border-[#0033A0] bg-blue-50'
                          : !fits
                            ? 'border-gray-100 opacity-40 cursor-not-allowed'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-2xl mb-1">{v.emoji}</div>
                      <div className={`text-xs font-black ${isSelected ? 'text-[#0033A0]' : 'text-gray-700'}`}>{v.label}</div>
                      <div className="text-xs text-gray-400 leading-tight mt-0.5">{v.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Compartido: SUV fijo, solo se elige categoría */
            <div className="flex items-center gap-3 bg-blue-50 rounded-2xl px-4 py-3 border border-blue-100">
              <span className="text-2xl">🚗</span>
              <div>
                <p className="text-sm font-black text-[#0033A0]">SUV Compartida</p>
                <p className="text-xs text-gray-500">Hasta 4 personas · elige tu categoría abajo</p>
              </div>
            </div>
          )}

          {/* Categoría: Confort / Premium */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Categoría</p>
            <div className="grid grid-cols-2 gap-2">
              {(['confort', 'premium'] as ServiceTier[]).map(t => {
                const isSelected = tier === t;
                return (
                  <button key={t} type="button" onClick={() => setTier(t)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${
                      isSelected
                        ? t === 'premium' ? 'border-yellow-400 bg-yellow-50' : 'border-[#0033A0] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span>{t === 'premium' ? '⭐' : '✓'}</span>
                      <span className={`text-sm font-black ${t === 'premium' ? 'text-yellow-700' : 'text-[#0033A0]'}`}>
                        {t === 'premium' ? 'Premium' : 'Confort'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {t === 'premium' ? vehicleConfig.priceFromPremium : vehicleConfig.priceFromConfort}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fecha y hora — siempre visible */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">📅 Fecha y hora <span className="normal-case font-normal text-gray-400">(dejar en blanco para viaje inmediato)</span></p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Fecha</label>
                <input type="date" min={today} value={scheduledDate}
                  onChange={e => { setScheduledDate(e.target.value); setIsScheduled(!!e.target.value && !!scheduledTime); }}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0033A0] text-sm text-gray-800 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Hora</label>
                <input type="time" value={scheduledTime}
                  onChange={e => { setScheduledTime(e.target.value); setIsScheduled(!!scheduledDate && !!e.target.value); }}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0033A0] text-sm text-gray-800 bg-white" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════
          MAPA — solo cuando hay coordenadas válidas
          ══════════════════════════════════════════ */}
      {hasValidRoute && (
        <div className="rounded-3xl overflow-hidden shadow-md border border-gray-100">
          <MapboxMap
            pickup={{ lat: pickupLocation!.lat, lon: pickupLocation!.lon, label: pickupLocation!.address }}
            dropoff={{ lat: dropoffLocation!.lat, lon: dropoffLocation!.lon, label: dropoffLocation!.address }}
            distance={Math.round(calculateDistance(pickupLocation as any, dropoffLocation as any) * 10) / 10}
            duration={calculateEstimatedDuration(pickupLocation as any, dropoffLocation as any)}
          />
        </div>
      )}

      {/* Aviso: seleccionar desde la lista */}
      {hasRoute && !hasValidRoute && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-700 flex items-center gap-2">
          <span>⚠️</span>
          <span>Selecciona las ciudades desde la lista para calcular la tarifa.</span>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TARIFA
          ══════════════════════════════════════════ */}
      {hasValidRoute && (
        localFare !== null ? (
          <div className={`border rounded-2xl p-4 ${fareFixed ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-gray-700">
                    {vehicleConfig.label} · {tier === 'premium' ? '⭐ Premium' : '✓ Confort'}
                  </p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${fareFixed ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'}`}>
                    {fareFixed ? '✓ Tarifa fija' : '~ Estimado'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {Math.round(calculateDistance(pickupLocation as any, dropoffLocation as any) * 10) / 10} km ·
                  ~{calculateEstimatedDuration(pickupLocation as any, dropoffLocation as any)} min de viaje
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {mode === 'compartido' ? `👥 Compartido · ${passengers} personas` : '🔒 Privado'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-[#0033A0]">${localFare.toFixed(0)}</p>
                <p className="text-xs text-gray-400">{fareFixed ? 'precio fijo' : 'aprox.'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-[#0033A0] rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Calculando tarifa…</span>
          </div>
        )
      )}

      {/* ══════════════════════════════════════════
          BOTÓN CONFIRMAR
          ══════════════════════════════════════════ */}
      <button
        type="submit"
        disabled={!canConfirm}
        className="w-full py-4 rounded-2xl font-black text-white text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg"
        style={{ background: !canConfirm ? '#9ca3af' : 'linear-gradient(135deg, #0033A0, #ff4c41)' }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Confirmando viaje…
          </span>
        ) : !hasRoute
          ? 'Ingresa origen y destino'
          : !hasValidRoute
            ? 'Selecciona desde la lista'
            : !localFare
              ? 'Calculando tarifa…'
              : isScheduled
                ? `📅 Reservar · ${scheduledDate} ${scheduledTime}`
                : `Confirmar viaje · $${localFare.toFixed(0)}`
        }
      </button>

    </form>
  );
}

export function RideRequestForm() {
  return (
    <Suspense fallback={<div className="animate-pulse bg-gray-100 rounded-3xl h-96" />}>
      <RideRequestFormInner />
    </Suspense>
  );
}
