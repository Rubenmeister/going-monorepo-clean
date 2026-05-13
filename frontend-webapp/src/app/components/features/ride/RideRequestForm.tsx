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
  getRoadDistance,
} from '@/services/ride/fareCalculator';
import { fetchSharedSlots, type TimeSlot } from '@/services/ride/sharedSlots';

// ── Inline SVG icons — sin emojis ─────────────────────────────────────────
const IcoPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </svg>
);
const IcoFlag = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);
const IcoLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IcoPeople = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcoStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoCalendar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IcoWarn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IcoClock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcoChevronDown = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// ── Tipos de vehículo con fotos reales ────────────────────────────────────
type TransportMode = 'privado' | 'compartido';
type SimpleVehicle = 'suv' | 'van' | 'bus';

const SIMPLE_VEHICLES: Record<SimpleVehicle, {
  label: string; photo: string; desc: string;
  maxPax: number; vehicleForPax: (pax: number) => VehicleType;
}> = {
  suv: {
    label: 'SUV', photo: '/images/suv-quito.png', desc: 'Hasta 5 personas', maxPax: 5,
    vehicleForPax: (pax) => pax <= 4 ? 'suv' : 'suv_xl',
  },
  van: {
    label: 'VAN', photo: '/images/van-xl.png', desc: 'Hasta 14 personas', maxPax: 14,
    vehicleForPax: (pax) => pax <= 7 ? 'van' : 'van_xl',
  },
  bus: {
    label: 'BUS', photo: '/images/BUS.png', desc: '15 o más personas', maxPax: 100,
    vehicleForPax: (pax) => pax <= 25 ? 'minibus' : 'bus',
  },
};

function suggestSimpleVehicle(pax: number): SimpleVehicle {
  if (pax <= 5) return 'suv';
  if (pax <= 14) return 'van';
  return 'bus';
}

// ─────────────────────────────────────────────────────────────────────────
function RideRequestFormInner({ defaultMode }: { defaultMode?: TransportMode }) {
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

  const [mode, setMode]                   = useState<TransportMode>(defaultMode ?? 'privado');
  const [passengers, setPassengers]       = useState(1);
  const [simpleVehicle, setSimpleVehicle] = useState<SimpleVehicle>('suv');
  const [tier, setTier]                   = useState<ServiceTier>('confort');
  const [isScheduled, setIsScheduled]     = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [localFare, setLocalFare]         = useState<number | null>(null);
  const [fareFixed, setFareFixed]         = useState(false);
  const [roadDistKm,  setRoadDistKm]      = useState<number | null>(null);
  const [roadDurMin,  setRoadDurMin]      = useState<number | null>(null);

  // ── Acordeón de horarios alternativos (Compartido) ────────────────────
  const [showSlots,    setShowSlots]    = useState(false);
  const [slots,        setSlots]        = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [noTimeMatch,  setNoTimeMatch]  = useState(false); // hora seleccionada sin disponibilidad

  // Compartido → bloquea a SUV
  useEffect(() => {
    if (mode === 'compartido') setSimpleVehicle('suv');
  }, [mode]);

  // Privado → sugiere vehículo según pasajeros
  useEffect(() => {
    if (mode === 'privado') setSimpleVehicle(suggestSimpleVehicle(passengers));
  }, [passengers, mode]);

  const vehicleType: VehicleType = SIMPLE_VEHICLES[simpleVehicle].vehicleForPax(passengers);
  const vehicleConfig = VEHICLE_TYPES[vehicleType];

  // Pre-fill desde URL params
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

  // ── Tarifa: calcula síncronamente, luego refina con distancia real de carretera ──
  useEffect(() => {
    const validRoute =
      pickupLocation && dropoffLocation &&
      pickupLocation.lat !== 0 && dropoffLocation.lat !== 0 &&
      pickupLocation.lat !== dropoffLocation.lat;

    if (!validRoute) {
      setLocalFare(null);
      setFareFixed(false);
      setRoadDistKm(null);
      setRoadDurMin(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        // 1️⃣ Cálculo inmediato con Haversine (tabla fija o estimado rápido)
        const quick = getFareBreakdown(pickupLocation!, dropoffLocation!, vehicleType, tier, mode);
        if (!cancelled) {
          setLocalFare(isNaN(quick.totalFare) || !isFinite(quick.totalFare) ? null : quick.totalFare);
          setFareFixed(quick.isPriceFixed);
        }

        // 2️⃣ Si el precio NO es fijo, mejoramos con distancia real de carretera
        if (!quick.isPriceFixed) {
          const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
          const rd = await getRoadDistance(pickupLocation!, dropoffLocation!, token);
          if (cancelled) return;

          setRoadDistKm(rd.distanceKm);
          setRoadDurMin(rd.durationMin);

          const refined = getFareBreakdown(pickupLocation!, dropoffLocation!, vehicleType, tier, mode, rd);
          if (!cancelled) {
            setLocalFare(isNaN(refined.totalFare) || !isFinite(refined.totalFare) ? null : refined.totalFare);
            setFareFixed(refined.isPriceFixed);
          }
        } else {
          // Ruta con precio fijo → no necesitamos distancia de carretera
          if (!cancelled) { setRoadDistKm(null); setRoadDurMin(null); }
        }
      } catch {
        if (!cancelled) { setLocalFare(null); setFareFixed(false); }
      }
    };

    run();
    return () => { cancelled = true; };
  }, [pickupLocation, dropoffLocation, vehicleType, tier, mode]);

  // Carga horarios cuando: modo compartido + ruta válida + fecha seleccionada
  useEffect(() => {
    if (mode !== 'compartido' || !hasValidRoute || !scheduledDate) {
      setSlots([]);
      setNoTimeMatch(false);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    fetchSharedSlots(
      pickupLocation!.address,
      dropoffLocation!.address,
      scheduledDate,
      localFare ?? 15,
    ).then(data => {
      if (cancelled) return;
      setSlots(data);
      // Detecta si la hora elegida no tiene disponibilidad → abre acordeón automáticamente
      if (scheduledTime) {
        const match = data.find(s => s.time === scheduledTime || s.time.startsWith(scheduledTime));
        const hasMatch = !!match && match.seatsLeft > 0;
        setNoTimeMatch(!hasMatch);
        if (!hasMatch) setShowSlots(true);
      }
    }).finally(() => { if (!cancelled) setLoadingSlots(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, scheduledDate, pickupLocation?.address, dropoffLocation?.address]);

  // Re-evalúa match cuando cambia la hora
  useEffect(() => {
    if (!scheduledTime || slots.length === 0) { setNoTimeMatch(false); return; }
    const match = slots.find(s => s.time === scheduledTime || s.time.startsWith(scheduledTime));
    const hasMatch = !!match && match.seatsLeft > 0;
    setNoTimeMatch(!hasMatch);
    if (!hasMatch) setShowSlots(true);
  }, [scheduledTime, slots]);

  const handleSelectSlot = (slot: TimeSlot) => {
    setScheduledTime(slot.time);
    setIsScheduled(true);
    setShowSlots(false);
    setNoTimeMatch(false);
  };

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
  const maxPax        = mode === 'compartido' ? 3 : SIMPLE_VEHICLES[simpleVehicle].maxPax;
  const hasRoute      = !!(pickupLocation && dropoffLocation);
  const hasValidRoute = hasRoute && pickupLocation!.lat !== 0 && dropoffLocation!.lat !== 0;
  const showSlotsSection = mode === 'compartido' && hasValidRoute && scheduledDate;
  const scheduleOk    = (!scheduledDate && !scheduledTime) || (scheduledDate && scheduledTime);
  const canConfirm    = hasValidRoute && localFare !== null && !loading && !!scheduleOk;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm">{error}</div>
      )}

      {/* ── TARJETA PRINCIPAL ─────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #0033A0, #ff4c41)' }} />
        <div className="p-5 space-y-5">

          <h2 className="text-xl font-black text-gray-900">¿A dónde deseas viajar?</h2>

          {/* Origen + Destino */}
          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                <span className="text-[#ff4c41]"><IcoPin /></span> Origen
              </label>
              <LocationSelector
                type="pickup"
                value={pickupLocation || undefined}
                onChange={setPickupLocation}
                placeholder="Ciudad de origen"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                <span className="text-[#0033A0]"><IcoFlag /></span> Destino
              </label>
              <LocationSelector
                type="dropoff"
                value={dropoffLocation || undefined}
                onChange={setDropoffLocation}
                placeholder="Ciudad de destino"
              />
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Toggle Privado / Compartido + contador */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-2xl border border-gray-200 overflow-hidden flex-shrink-0">
              {([
                { key: 'privado'    as TransportMode, Icon: IcoLock,   label: 'Privado' },
                { key: 'compartido' as TransportMode, Icon: IcoPeople, label: 'Compartido' },
              ]).map(opt => (
                <button key={opt.key} type="button"
                  onClick={() => {
                    setMode(opt.key);
                    if (opt.key === 'compartido') setPassengers(p => Math.min(p, 3));
                  }}
                  className={`px-4 py-2.5 text-sm font-bold transition-all flex items-center gap-1.5 ${
                    mode === opt.key
                      ? 'bg-[#0033A0] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <opt.Icon />{opt.label}
                </button>
              ))}
            </div>

            {/* Contador de personas */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button type="button" onClick={() => setPassengers(p => Math.max(1, p - 1))}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 text-lg flex items-center justify-center transition-all active:scale-95">
                −
              </button>
              <span className="text-lg font-black text-[#0033A0] min-w-[2rem] text-center">{passengers}</span>
              <button type="button" onClick={() => setPassengers(p => Math.min(maxPax, p + 1))}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 text-lg flex items-center justify-center transition-all active:scale-95">
                +
              </button>
              <span className="text-sm text-gray-500">{passengers === 1 ? 'persona' : 'personas'}</span>
            </div>
          </div>

          {/* ── Selector de vehículo (Privado) o SUV Compartida ─────── */}
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
                      className={`rounded-2xl border-2 overflow-hidden text-center transition-all ${
                        isSelected
                          ? 'border-[#0033A0] bg-blue-50'
                          : !fits
                            ? 'border-gray-100 opacity-40 cursor-not-allowed'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {/* Foto del vehículo */}
                      <div className="h-20 overflow-hidden bg-gray-50">
                        <img
                          src={v.photo}
                          alt={v.label}
                          className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                      <div className="p-2">
                        <div className={`text-xs font-black ${isSelected ? 'text-[#0033A0]' : 'text-gray-700'}`}>{v.label}</div>
                        <div className="text-xs text-gray-400 leading-tight mt-0.5">{v.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Compartido: SUV fija con foto */
            <div className="flex items-center gap-3 bg-blue-50 rounded-2xl overflow-hidden border border-blue-100">
              <div className="w-24 h-16 flex-shrink-0 overflow-hidden bg-blue-100">
                <img
                  src="/images/SUV de lujo.png"
                  alt="SUV Compartida"
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = '/images/suv-quito.png'; }}
                />
              </div>
              <div className="py-3 pr-3">
                <p className="text-sm font-black text-[#0033A0]">SUV Compartida</p>
                <p className="text-xs text-gray-500">Hasta 3 pasajeros · precio por asiento</p>
                <p className="text-xs text-[#059669] font-semibold mt-0.5">Más económico que el privado</p>
              </div>
            </div>
          )}

          {/* ── Categoría: Confort / Premium ─────────────────────────── */}
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
                      <span className={t === 'premium' ? 'text-yellow-500' : 'text-[#0033A0]'}>
                        {t === 'premium' ? <IcoStar /> : <IcoCheck />}
                      </span>
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

          {/* ── Fecha y hora ─────────────────────────────────────────── */}
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              <IcoCalendar />
              Fecha y hora
              <span className="normal-case font-normal text-gray-400">(dejar en blanco para viaje inmediato)</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Fecha</label>
                <input type="date" min={today} value={scheduledDate}
                  onChange={e => {
                    // Auto-clamp: si el usuario tipea una fecha pasada (común
                    // si el browser auto-completa o el year defaultea a algo
                    // viejo), saltamos a hoy en lugar de quedar con un valor
                    // inválido que dispara el tooltip nativo "El valor debe
                    // ser igual o posterior a <today>" y bloquea el submit.
                    const raw = e.target.value;
                    const next = raw && raw < today ? today : raw;
                    setScheduledDate(next);
                    setIsScheduled(!!next && !!scheduledTime);
                  }}
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

      {/* ── ACORDEÓN HORARIOS COMPARTIDO ──────────────────────────────── */}
      {showSlotsSection && (
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
          {/* Aviso si la hora solicitada no tiene disponibilidad */}
          {noTimeMatch && scheduledTime && (
            <div className="flex items-center gap-2 px-5 py-3 bg-amber-50 border-b border-amber-100 text-amber-700 text-sm">
              <IcoWarn />
              <span>
                No hay viajes compartidos a las <strong>{scheduledTime}</strong>. Elige otro horario disponible:
              </span>
            </div>
          )}

          {/* Toggle */}
          <button
            type="button"
            onClick={() => setShowSlots(prev => !prev)}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#0033A0] flex-shrink-0">
              <IcoClock />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-gray-800">Ver otras salidas hoy</p>
              <p className="text-xs text-gray-400">
                {loadingSlots
                  ? 'Cargando horarios…'
                  : showSlots
                    ? 'Toca un horario para seleccionarlo'
                    : slots.length > 0
                      ? `${slots.length} horario${slots.length !== 1 ? 's' : ''} disponible${slots.length !== 1 ? 's' : ''}`
                      : 'Sin horarios disponibles'
                }
              </p>
            </div>
            {loadingSlots ? (
              <div className="w-4 h-4 border-2 border-gray-200 border-t-[#0033A0] rounded-full animate-spin" />
            ) : (
              <span className="text-gray-400"><IcoChevronDown open={showSlots} /></span>
            )}
          </button>

          {/* Lista de horarios — expandible */}
          {showSlots && !loadingSlots && (
            <div className="border-t border-gray-100 divide-y divide-gray-50">
              {slots.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-6">Sin horarios disponibles para esta ruta</p>
              ) : slots.map(slot => {
                const isSelected = scheduledTime === slot.time;
                const isFull     = slot.seatsLeft === 0;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={isFull}
                    onClick={() => handleSelectSlot(slot)}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-blue-50'
                        : isFull
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Hora */}
                    <span className={`text-base font-black min-w-[52px] ${isSelected ? 'text-[#0033A0]' : 'text-gray-800'}`}>
                      {slot.time}
                    </span>

                    {/* Info */}
                    <div className="flex-1">
                      {slot.label && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full mr-1 ${
                          slot.label === 'Recomendado'
                            ? 'bg-green-100 text-green-700'
                            : slot.label === 'Último asiento'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-gray-100 text-gray-500'
                        }`}>
                          {slot.label}
                        </span>
                      )}
                      <span className={`text-xs ${slot.seatsLeft === 1 ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>
                        {isFull ? 'Completo' : `${slot.seatsLeft} asiento${slot.seatsLeft !== 1 ? 's' : ''} libre${slot.seatsLeft !== 1 ? 's' : ''}`}
                      </span>
                    </div>

                    {/* Precio + check */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#0033A0]">${slot.price}</span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-[#0033A0] flex items-center justify-center text-white">
                          <IcoCheck />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MAPA ───────────────────────────────────────────────────────── */}
      {hasValidRoute && (
        <div className="rounded-3xl overflow-hidden shadow-md border border-gray-100">
          <MapboxMap
            pickup={{ lat: pickupLocation!.lat, lon: pickupLocation!.lon, label: pickupLocation!.address }}
            dropoff={{ lat: dropoffLocation!.lat, lon: dropoffLocation!.lon, label: dropoffLocation!.address }}
            distance={roadDistKm !== null
              ? Math.round(roadDistKm * 10) / 10
              : Math.round(calculateDistance(pickupLocation as any, dropoffLocation as any) * 10) / 10}
            duration={roadDurMin !== null
              ? Math.round(roadDurMin)
              : calculateEstimatedDuration(pickupLocation as any, dropoffLocation as any)}
          />
        </div>
      )}

      {/* Aviso: seleccionar desde lista */}
      {hasRoute && !hasValidRoute && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-700 flex items-center gap-2">
          <span className="flex-shrink-0"><IcoWarn /></span>
          <span>Selecciona las ciudades desde la lista para calcular la tarifa.</span>
        </div>
      )}

      {/* ── TARIFA ─────────────────────────────────────────────────────── */}
      {hasValidRoute && (
        localFare !== null ? (
          <div className={`border rounded-2xl p-4 ${fareFixed ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-bold text-gray-700">
                    {vehicleConfig.label} · {tier === 'premium' ? 'Premium' : 'Confort'}
                  </p>
                  <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${fareFixed ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'}`}>
                    <IcoCheck /> {fareFixed ? 'Tarifa fija' : 'Estimado'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {roadDistKm !== null
                    ? `${Math.round(roadDistKm * 10) / 10} km`
                    : `${Math.round(calculateDistance(pickupLocation as any, dropoffLocation as any) * 10) / 10} km`
                  } ·
                  ~{roadDurMin !== null
                    ? Math.round(roadDurMin)
                    : calculateEstimatedDuration(pickupLocation as any, dropoffLocation as any)
                  } min
                </p>
                <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  {mode === 'compartido'
                    ? <><IcoPeople /><span>Compartido · {passengers} persona{passengers > 1 ? 's' : ''} · precio por asiento</span></>
                    : <><IcoLock /><span>Vehículo privado</span></>
                  }
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

      {/* ── BOTÓN CONFIRMAR ────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={!canConfirm}
        className="w-full py-4 rounded-2xl font-black text-white text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
        style={{ background: !canConfirm ? '#9ca3af' : 'linear-gradient(135deg, #0033A0, #ff4c41)' }}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Confirmando viaje…
          </>
        ) : !hasRoute
          ? 'Ingresa origen y destino'
          : !hasValidRoute
            ? 'Selecciona desde la lista'
            : !localFare
              ? 'Calculando tarifa…'
              : isScheduled
                ? <><IcoCalendar /> Reservar · {scheduledDate} {scheduledTime}</>
                : `Confirmar viaje · $${localFare.toFixed(0)}`
        }
      </button>

    </form>
  );
}

export function RideRequestForm({ defaultMode }: { defaultMode?: TransportMode }) {
  return (
    <Suspense fallback={<div className="animate-pulse bg-gray-100 rounded-3xl h-96" />}>
      <RideRequestFormInner defaultMode={defaultMode} />
    </Suspense>
  );
}
