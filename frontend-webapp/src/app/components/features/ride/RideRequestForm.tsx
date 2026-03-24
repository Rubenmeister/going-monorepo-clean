'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRideService } from '@/hooks/features/useRideService';
import { LocationSelector } from './LocationSelector';
import type { VehicleType, ServiceTier } from '@/types';
import { VEHICLE_TYPES, recommendVehicleForPax, availableVehiclesForPax } from '@/types';
import {
  calculateFare,
  calculateDistance,
  calculateEstimatedDuration,
} from '@/services/ride/fareCalculator';
import Image from 'next/image';

// ─────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────
type TransportMode = 'privado' | 'compartido';

interface SavedAddress {
  label: string;
  icon: string;
  address: string;
  lat: number;
  lon: number;
}

// ─────────────────────────────────────────────────────────────
// Direcciones guardadas — localStorage + defaults fijos
// ─────────────────────────────────────────────────────────────
function getSavedAddresses(): SavedAddress[] {
  try {
    const stored = localStorage.getItem('going_saved_addresses');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function getRecentAddresses(): SavedAddress[] {
  try {
    const stored = localStorage.getItem('going_recent_addresses');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveRecentAddress(loc: { address: string; lat: number; lon: number }) {
  try {
    const recent: SavedAddress[] = getRecentAddresses();
    const entry: SavedAddress = { label: loc.address.split(',')[0], icon: '🕐', address: loc.address, lat: loc.lat, lon: loc.lon };
    const updated = [entry, ...recent.filter(r => r.address !== loc.address)].slice(0, 5);
    localStorage.setItem('going_recent_addresses', JSON.stringify(updated));
  } catch {/* */}
}

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────
function RideRequestFormInner() {
  const searchParams = useSearchParams();

  // ── Ubicaciones ──
  const {
    pickupLocation,
    dropoffLocation,
    loading,
    error,
    setPickupLocation,
    setDropoffLocation,
    createRide,
  } = useRideService();

  // ── Configuración del viaje ──
  const [mode, setMode]               = useState<TransportMode>('privado');
  const [passengers, setPassengers]   = useState(1);
  const [vehicleType, setVehicleType] = useState<VehicleType>('suv');
  const [tier, setTier]               = useState<ServiceTier>('confort');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [localFare, setLocalFare]     = useState<number | null>(null);

  // ── Direcciones ──
  const [savedAddresses]  = useState<SavedAddress[]>(() => getSavedAddresses());
  const [recentAddresses, setRecentAddresses] = useState<SavedAddress[]>(() => getRecentAddresses());

  // Auto-recomendar vehículo cuando cambian los pasajeros
  useEffect(() => {
    setVehicleType(recommendVehicleForPax(passengers));
  }, [passengers]);

  // Pre-fill desde URL params
  useEffect(() => {
    const from = searchParams.get('from');
    const to   = searchParams.get('to');
    const date = searchParams.get('date');
    const time = searchParams.get('time');
    if (from && !pickupLocation)  setPickupLocation({ address: from, lat: 0, lon: 0 });
    if (to   && !dropoffLocation) setDropoffLocation({ address: to,  lat: 0, lon: 0 });
    if (date) { setScheduledDate(date); setIsScheduled(true); }
    if (time) setScheduledTime(time);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calcular tarifa al cambiar ubicaciones o configuración
  useEffect(() => {
    if (
      pickupLocation && dropoffLocation &&
      pickupLocation.lat !== 0 && dropoffLocation.lat !== 0 &&
      pickupLocation.lat !== dropoffLocation.lat
    ) {
      const base = calculateFare(pickupLocation, dropoffLocation, vehicleType);
      const multiplier = tier === 'premium'
        ? VEHICLE_TYPES[vehicleType].multiplierPremium
        : VEHICLE_TYPES[vehicleType].multiplierConfort;
      const confortMultiplier = VEHICLE_TYPES[vehicleType].multiplierConfort;
      const adjusted = Math.round((base / confortMultiplier) * multiplier * 100) / 100;
      setLocalFare(adjusted);
    } else {
      setLocalFare(null);
    }
  }, [pickupLocation, dropoffLocation, vehicleType, tier]);

  const handlePickup = (loc: Parameters<typeof setPickupLocation>[0]) => {
    setPickupLocation(loc);
    if (loc && loc.lat !== 0) {
      saveRecentAddress(loc as any);
      setRecentAddresses(getRecentAddresses());
    }
  };

  const handleDropoff = (loc: Parameters<typeof setDropoffLocation>[0]) => {
    setDropoffLocation(loc);
    if (loc && loc.lat !== 0) {
      saveRecentAddress(loc as any);
      setRecentAddresses(getRecentAddresses());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupLocation || !dropoffLocation) return;
    await createRide(
      vehicleType,
      tier,
      passengers,
      isScheduled ? `${scheduledDate}T${scheduledTime}` : undefined
    );
  };

  const today             = new Date().toISOString().split('T')[0];
  const maxPax            = mode === 'compartido' ? 4 : 100;
  const availableVehicles = availableVehiclesForPax(passengers);
  const recommended       = recommendVehicleForPax(passengers);
  const currentVehicle    = VEHICLE_TYPES[vehicleType];
  const currentImage      = tier === 'premium' ? currentVehicle.imagePremium : currentVehicle.imageConfort;

  // Direcciones de acceso rápido
  const quickAddresses: SavedAddress[] = [
    ...savedAddresses,
    ...recentAddresses.filter(r => !savedAddresses.find(s => s.address === r.address)),
  ].slice(0, 5);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm">{error}</div>
      )}

      {/* ══════════════════════════════════════════
          1. ORIGEN Y DESTINO
          ══════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Barra de color */}
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #0033A0, #ff4c41)' }} />

        <div className="p-5 space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">¿A dónde vas?</p>

          {/* Accesos rápidos — direcciones guardadas y recientes */}
          {quickAddresses.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {quickAddresses.map((qa, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleDropoff({ address: qa.address, lat: qa.lat, lon: qa.lon })}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 transition-colors"
                >
                  <span>{qa.icon}</span>
                  <span className="max-w-[100px] truncate">{qa.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Campos de ubicación */}
          <div className="relative space-y-2">
            {/* Línea conectora */}
            <div className="absolute left-5 top-11 bottom-11 w-0.5 bg-gray-200 z-0" />

            <div className="relative z-10">
              <LocationSelector
                type="pickup"
                value={pickupLocation || undefined}
                onChange={handlePickup}
                placeholder="¿De dónde sales?"
              />
            </div>
            <div className="relative z-10">
              <LocationSelector
                type="dropoff"
                value={dropoffLocation || undefined}
                onChange={handleDropoff}
                placeholder="¿Hacia dónde vas?"
              />
            </div>
          </div>

          {/* Ahora vs Programar */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsScheduled(false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                !isScheduled ? 'bg-[#0033A0] text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              ⚡ Ahora
            </button>
            <button
              type="button"
              onClick={() => setIsScheduled(true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isScheduled ? 'bg-[#0033A0] text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              📅 Programar
            </button>
          </div>

          {isScheduled && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">📅 Fecha</label>
                <input
                  type="date" min={today} value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0033A0] text-sm text-gray-800"
                  required={isScheduled}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">🕐 Hora</label>
                <input
                  type="time" value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0033A0] text-sm text-gray-800"
                  required={isScheduled}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          2. TIPO DE VIAJE — Privado / Compartido
          ══════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Tipo de viaje</p>
        <div className="grid grid-cols-2 gap-3">
          {([
            { key: 'privado'    as TransportMode, icon: '🔒', label: 'Privado',    desc: 'Solo para tu grupo' },
            { key: 'compartido' as TransportMode, icon: '👥', label: 'Compartido', desc: 'Divide el costo' },
          ] as const).map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                setMode(opt.key);
                if (opt.key === 'compartido') setPassengers(p => Math.min(p, 4));
              }}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                mode === opt.key
                  ? 'border-[#0033A0] bg-blue-50'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="text-2xl mb-1.5">{opt.icon}</div>
              <div className="font-bold text-gray-900 text-sm">{opt.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          3. NÚMERO DE PERSONAS
          ══════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-5 py-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Número de personas</p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setPassengers(p => Math.max(1, p - 1))}
            className="w-12 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 text-2xl flex items-center justify-center transition-all active:scale-95"
          >
            −
          </button>
          <div className="flex-1 text-center">
            <span className="text-5xl font-black" style={{ color: '#0033A0' }}>{passengers}</span>
            <span className="text-gray-400 text-sm ml-2">{passengers === 1 ? 'persona' : 'personas'}</span>
          </div>
          <button
            type="button"
            onClick={() => setPassengers(p => Math.min(maxPax, p + 1))}
            className="w-12 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 text-2xl flex items-center justify-center transition-all active:scale-95"
          >
            +
          </button>
        </div>
        {mode === 'compartido' && (
          <p className="text-xs text-gray-400 text-center mt-2">Máx. 4 personas en viaje compartido</p>
        )}
      </div>

      {/* ══════════════════════════════════════════
          4. TIPO DE VEHÍCULO + CATEGORÍA
          ══════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Imagen del vehículo */}
        <div className="relative h-40 w-full bg-gray-200">
          <Image
            src={currentImage}
            alt={`${currentVehicle.label} ${tier}`}
            fill
            className="object-cover"
            sizes="(max-width: 672px) 100vw, 672px"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-4 text-white">
            <p className="text-base font-black">{currentVehicle.label}</p>
            <p className="text-xs opacity-80">{currentVehicle.desc}</p>
          </div>
          <div className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full font-bold ${
            tier === 'premium' ? 'bg-yellow-400 text-yellow-900' : 'bg-white text-gray-800'
          }`}>
            {tier === 'premium' ? '⭐ PREMIUM' : '✓ CONFORT'}
          </div>
        </div>

        <div className="p-5 space-y-5">

          {/* Tipo de vehículo */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Tipo de vehículo</p>
            <div className="flex flex-wrap gap-2">
              {availableVehicles.map(type => {
                const v = VEHICLE_TYPES[type];
                const isSelected    = vehicleType === type;
                const isRecommended = type === recommended;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setVehicleType(type)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                      isSelected
                        ? 'border-[#0033A0] bg-[#0033A0] text-white'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                    }`}
                  >
                    {v.label}
                    {isRecommended && !isSelected && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">rec.</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categoría: Confort / Premium */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Categoría</p>
            <div className="grid grid-cols-2 gap-3">
              {(['confort', 'premium'] as ServiceTier[]).map(t => {
                const isSelected = tier === t;
                const price      = t === 'premium' ? currentVehicle.priceFromPremium : currentVehicle.priceFromConfort;
                const features   = t === 'premium' ? currentVehicle.featuresPremium  : currentVehicle.featuresConfort;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTier(t)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      isSelected
                        ? t === 'premium'
                          ? 'border-yellow-400 bg-yellow-50'
                          : 'border-[#0033A0] bg-blue-50'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-base">{t === 'premium' ? '⭐' : '✓'}</span>
                      <span className="font-black text-sm uppercase tracking-wide" style={{ color: t === 'premium' ? '#B45309' : '#0033A0' }}>
                        {t}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed mb-2">{features.join(' · ')}</p>
                    <p className="text-sm font-bold" style={{ color: t === 'premium' ? '#B45309' : '#0033A0' }}>{price}</p>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════
          5. RESUMEN DE TARIFA
          ══════════════════════════════════════════ */}
      {pickupLocation && dropoffLocation && pickupLocation.lat !== 0 && dropoffLocation.lat !== 0 && (
        localFare ? (
          <FareCard
            fare={localFare}
            pickup={pickupLocation}
            dropoff={dropoffLocation}
            vehicleType={vehicleType}
            tier={tier}
            mode={mode}
            passengers={passengers}
            scheduled={isScheduled ? `${scheduledDate} ${scheduledTime}` : undefined}
          />
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
        disabled={
          !pickupLocation || !dropoffLocation || !localFare || loading ||
          (isScheduled && (!scheduledDate || !scheduledTime))
        }
        className="w-full py-4 rounded-2xl font-black text-white text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg"
        style={{ background: !pickupLocation || !dropoffLocation || !localFare ? '#9ca3af' : 'linear-gradient(135deg, #0033A0, #ff4c41)' }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Confirmando viaje…
          </span>
        ) : isScheduled
          ? `📅 Reservar · ${scheduledDate} ${scheduledTime}`
          : !pickupLocation || !dropoffLocation
          ? 'Ingresa origen y destino'
          : `Confirmar viaje · $${localFare?.toFixed(2) ?? '—'}`
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

// ─────────────────────────────────────────────────────────────
// FareCard
// ─────────────────────────────────────────────────────────────
interface FareCardProps {
  fare:        number;
  pickup:      { lat: number; lon: number };
  dropoff:     { lat: number; lon: number };
  vehicleType: VehicleType;
  tier:        ServiceTier;
  mode:        TransportMode;
  passengers:  number;
  scheduled?:  string;
}

function FareCard({ fare, pickup, dropoff, vehicleType, tier, mode, passengers, scheduled }: FareCardProps) {
  const distance = Math.round(calculateDistance(pickup as any, dropoff as any) * 10) / 10;
  const duration = calculateEstimatedDuration(pickup as any, dropoff as any);
  const vehicle  = VEHICLE_TYPES[vehicleType];

  const isPremium = tier === 'premium';
  const accentColor = isPremium ? '#B45309' : '#0033A0';
  const bg          = isPremium ? '#FFFBEB' : '#EFF6FF';
  const borderColor = isPremium ? '#FDE68A' : '#BFDBFE';

  return (
    <div className="rounded-2xl p-4 border" style={{ background: bg, borderColor }}>
      <div className="flex items-center justify-between mb-3 pb-3 border-b" style={{ borderColor }}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900 text-sm">{vehicle.label}</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: borderColor, color: accentColor }}>
            {isPremium ? '⭐ Premium' : '✓ Confort'}
          </span>
          <span className="text-xs text-gray-400">
            {mode === 'compartido' ? `👥 ${passengers}p compartido` : `🔒 privado`}
          </span>
        </div>
        {scheduled && (
          <span className="text-xs px-2.5 py-1 rounded-full font-bold text-white bg-[#0033A0]">📅 Programado</span>
        )}
      </div>
      <div className="flex justify-between items-end">
        <div className="space-y-1 text-xs text-gray-500">
          <p>📍 {distance} km</p>
          <p>⏱️ ~{duration} min estimados</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Tarifa estimada</p>
          <p className="text-3xl font-black" style={{ color: accentColor }}>${fare.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
