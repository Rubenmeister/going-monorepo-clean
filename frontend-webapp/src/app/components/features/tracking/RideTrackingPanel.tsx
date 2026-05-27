'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRideStore } from '@/stores/rideStore';
import { useRideSocket } from '@/hooks/useWebSocket';
import { rideService } from '@/services/ride';
import { calculateFare, calculateDistance } from '@/services/ride/fareCalculator';
import { fetchSharedSlots, type TimeSlot } from '@/services/ride/sharedSlots';
import { VEHICLE_TYPES } from '@/types';
import type { Location, VehicleType, ServiceTier } from '@/types';

const TrackingMap = dynamic(
  () => import('./TrackingMap').then((m) => ({ default: m.TrackingMap })),
  { ssr: false }
);

const ShareTracking = dynamic(
  () => import('./ShareTracking').then((m) => ({ default: m.ShareTracking })),
  { ssr: false }
);

interface RideTrackingPanelProps {
  onCompleted: () => void;
  onCancelled: () => void;
  /** Reintentar el viaje conservando origen/destino/modo (sin pasar por el ServicePicker). */
  onRetrySame: () => void;
  /** Forzar modo compartido y volver al form, opcionalmente con hora pre-elegida (HH:mm). */
  onSwitchToShared: (time?: string) => void;
}

/* ── Stars helper ── */
function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400 text-xs">
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
      <span className="text-gray-400 ml-1">{rating.toFixed(1)}</span>
    </span>
  );
}

export function RideTrackingPanel({ onCompleted, onCancelled, onRetrySame, onSwitchToShared }: RideTrackingPanelProps) {
  const { activeRide, updateRideStatus, updateFinalFare, updateDriverInfo } = useRideStore();

  const [proxyNumber,   setProxyNumber]   = useState<string | null>(null);
  const [driverArrived, setDriverArrived] = useState(false);
  const [verified,      setVerified]      = useState(false);
  const [showShare,     setShowShare]     = useState(false);
  const [showStopInput, setShowStopInput] = useState(false);
  const [stopAddress,   setStopAddress]   = useState('');
  const [extraStops,    setExtraStops]    = useState<Location[]>([]);
  const [currentFare,   setCurrentFare]   = useState(activeRide?.estimatedFare ?? 0);
  const [showVerify,    setShowVerify]    = useState(false);
  const [noDriverSlots,        setNoDriverSlots]        = useState<TimeSlot[]>([]);
  const [loadingNoDriverSlots, setLoadingNoDriverSlots] = useState(false);
  /** Segundos transcurridos buscando conductor — driver del countdown UX. */
  const [searchElapsed, setSearchElapsed] = useState(0);

  const rideId = activeRide?.tripId ?? '';

  /* ── WebSocket eventos del viaje ── */
  useRideSocket(rideId, {
    'ride:driver_accepted': useCallback((data: unknown) => {
      const d = data as {
        rideId: string;
        driver?: { name: string; vehicle: string; plate: string; rating: number; photoUrl?: string };
      };
      if (!activeRide) return;
      updateRideStatus(activeRide.tripId, 'accepted');
      if (d?.driver) {
        updateDriverInfo(activeRide.tripId, {
          name:         d.driver.name,
          vehicle:      d.driver.vehicle,
          licensePlate: d.driver.plate,
          rating:       d.driver.rating,
          photo:        d.driver.photoUrl ?? '',
        });
      }
    }, [activeRide, updateRideStatus, updateDriverInfo]),
    'ride:started': useCallback(() => {
      if (activeRide) updateRideStatus(activeRide.tripId, 'in_progress');
    }, [activeRide, updateRideStatus]),
    'ride:driver_arrived': useCallback(() => {
      setDriverArrived(true);
      setShowVerify(true);
    }, []),
    'ride:fare_updated': useCallback((data: unknown) => {
      const d = data as { totalFare: number };
      if (d?.totalFare) {
        setCurrentFare(d.totalFare);
        if (activeRide) updateFinalFare(activeRide.tripId, d.totalFare);
      }
    }, [activeRide, updateFinalFare]),
    'ride:completed': useCallback(() => {
      if (activeRide) updateRideStatus(activeRide.tripId, 'completed');
    }, [activeRide, updateRideStatus]),
    'ride:cancelled': useCallback(() => {
      onCancelled();
    }, [onCancelled]),
  });

  /* ── Fetch proxy number cuando el conductor es asignado ── */
  useEffect(() => {
    if (!rideId || proxyNumber) return;
    if (activeRide?.status === 'accepted' || activeRide?.status === 'in_progress') {
      rideService.getProxyNumber(rideId)
        .then((r) => setProxyNumber(r.proxyNumber))
        .catch(() => { /* Twilio no configurado — silencioso */ });
    }
  }, [rideId, activeRide?.status, proxyNumber]);

  /* ── Sync fare con activeRide ── */
  useEffect(() => {
    if (activeRide?.finalFare) setCurrentFare(activeRide.finalFare);
    else if (activeRide?.estimatedFare) setCurrentFare(activeRide.estimatedFare);
  }, [activeRide?.estimatedFare, activeRide?.finalFare]);

  /* ── Detectar cuando el viaje se completa ── */
  useEffect(() => {
    if (activeRide?.status === 'completed') onCompleted();
  }, [activeRide?.status, onCompleted]);

  /* ── Failsafe: 90s sin conductor + countdown UX ──
   * Antes 130s — demasiado para que el user se quede mirando un spinner sin
   * feedback. 90s da margen real al matching y al user le mostramos el
   * tiempo transcurrido + mensajes progresivos para que no sienta que la
   * app está colgada. Si en 90s no hubo match, pasamos a no_driver con
   * opciones (carpool, reintentar, cancelar).
   */
  useEffect(() => {
    if (activeRide?.status !== 'pending') {
      setSearchElapsed(0);
      return;
    }
    // Cuenta visible cada 1s
    const tick = setInterval(() => setSearchElapsed((e) => e + 1), 1000);
    const timer = setTimeout(() => {
      if (useRideStore.getState().activeRide?.status === 'pending') {
        useRideStore.getState().updateRideStatus(activeRide.tripId, 'no_driver' as never);
      }
    }, 90_000);
    return () => {
      clearTimeout(timer);
      clearInterval(tick);
    };
  }, [activeRide?.tripId, activeRide?.status]);

  /* ── Slots compartidos reales como fallback en no_driver ── */
  useEffect(() => {
    if (activeRide?.status !== 'no_driver') return;
    if (!activeRide.pickup || !activeRide.dropoff) return;
    // Sin coords reales no podemos consultar /search del backend.
    if (!activeRide.pickup.lat || !activeRide.dropoff.lat) return;
    let cancelled = false;
    setLoadingNoDriverSlots(true);
    const today = new Date().toISOString().slice(0, 10);
    fetchSharedSlots(activeRide.pickup, activeRide.dropoff, today, activeRide.estimatedFare ?? 15)
      .then(s => { if (!cancelled) setNoDriverSlots(s); })
      .finally(() => { if (!cancelled) setLoadingNoDriverSlots(false); });
    return () => { cancelled = true; };
  }, [activeRide?.status, activeRide?.pickup, activeRide?.dropoff, activeRide?.estimatedFare]);

  /* ── Agregar parada extra ── */
  const handleAddStop = () => {
    if (!stopAddress.trim() || !activeRide) return;
    const lastPoint = extraStops.length > 0
      ? extraStops[extraStops.length - 1]
      : activeRide.pickup;

    const newStop: Location = { address: stopAddress, lat: 0, lon: 0 };
    const updatedStops = [...extraStops, newStop];
    setExtraStops(updatedStops);
    setStopAddress('');
    setShowStopInput(false);

    if (lastPoint.lat && lastPoint.lat !== 0) {
      const vehicleType = (activeRide.vehicleType as VehicleType) || 'suv';
      const tierMult = (activeRide.serviceTier as ServiceTier) === 'premium'
        ? VEHICLE_TYPES[vehicleType].multiplierPremium
        : VEHICLE_TYPES[vehicleType].multiplierConfort;
      const extraDist = calculateDistance(lastPoint, activeRide.dropoff);
      const extraFare = Math.round(extraDist * 0.5 * tierMult * 100) / 100;
      const newTotal  = Math.round((currentFare + extraFare) * 100) / 100;
      setCurrentFare(newTotal);
      updateFinalFare(activeRide.tripId, newTotal);
    }
  };

  /* ── Cancelar viaje ── */
  const handleCancel = async () => {
    if (!rideId) return;
    try {
      await rideService.cancelRide(rideId);
    } catch {
      // silencioso
    }
    onCancelled();
  };

  if (!activeRide) return null;
  const status = activeRide.status;

  /* ── Estado: sin conductor disponible ── */
  if (status === 'no_driver') {
    const availableSlots = noDriverSlots.filter(s => s.seatsLeft > 0).slice(0, 4);

    return (
      <div className="space-y-4 py-4">
        <div className="text-center px-6 pt-4">
          <div className="text-5xl mb-3">😔</div>
          <p className="text-xl font-bold text-gray-800">Sin conductor disponible</p>
          <p className="text-sm text-gray-500 mt-1">
            No hay conductores en tu zona para el horario solicitado.
          </p>
        </div>

        <div className="px-4 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">¿Qué quieres hacer?</p>

          <button onClick={onRetrySame}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all"
            style={{ borderColor: '#ff4c41', backgroundColor: '#fff2f2' }}>
            <span className="text-2xl">🔄</span>
            <div>
              <p className="font-bold text-sm text-gray-900">Buscar conductor ahora</p>
              <p className="text-xs text-gray-500">Reintenta la misma solicitud inmediatamente</p>
            </div>
          </button>

          <button onClick={onRetrySame}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-200 text-left transition-all hover:border-gray-300 bg-white">
            <span className="text-2xl">📅</span>
            <div>
              <p className="font-bold text-sm text-gray-900">Programar para más tarde</p>
              <p className="text-xs text-gray-500">Vuelve al formulario y elige otra hora del día</p>
            </div>
          </button>

          <button onClick={() => onSwitchToShared()}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-200 text-left transition-all hover:border-gray-300 bg-white">
            <span className="text-2xl">🧑</span>
            <div>
              <p className="font-bold text-sm text-gray-900">Probar viaje compartido</p>
              <p className="text-xs text-gray-500">Más opciones disponibles y tarifa reducida</p>
            </div>
          </button>
        </div>

        <div className="mx-4 bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-blue-800 mb-2">💡 Próximas salidas compartidas hoy</p>
          {loadingNoDriverSlots ? (
            <div className="flex items-center justify-center py-3">
              <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : availableSlots.length === 0 ? (
            <p className="text-xs text-blue-500 py-2">
              Sin salidas compartidas hoy en esta ruta. Programa para mañana o vuelve al inicio.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {availableSlots.map(slot => (
                <button key={slot.id} onClick={() => onSwitchToShared(slot.time)}
                  className="py-2 px-3 rounded-xl text-xs font-bold text-blue-700 bg-white border border-blue-200 hover:bg-blue-100 transition-colors flex items-center justify-between gap-2">
                  <span>{slot.time}</span>
                  <span className="text-blue-500">${slot.price}</span>
                </button>
              ))}
            </div>
          )}
          {availableSlots.length > 0 && (
            <p className="text-xs text-blue-500 mt-2">Toca un horario para reservar tu cupo compartido</p>
          )}
        </div>

        <div className="px-4 pb-4">
          <button onClick={onCancelled}
            className="w-full py-3 rounded-2xl border border-gray-200 text-gray-500 font-medium text-sm hover:bg-gray-50 transition-colors">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">

      {/* ══ MAPA ══ */}
      <TrackingMap />

      {/* ══ ESTADO PRINCIPAL ══ */}
      <StatusBanner
        status={status}
        driverArrived={driverArrived}
        driverInfo={activeRide.driverInfo}
        fare={currentFare}
        extraStops={extraStops.length}
        searchElapsed={searchElapsed}
      />

      {/* ══ ACCIONES TEMPRANAS EN PENDING ══
         Antes solo había "Cancelar viaje" al final del panel y el user no
         lo veía sin scrollear. Ahora exponemos ambas acciones inmediatamente
         después del banner, mientras se busca conductor: el user puede
         cambiar a un viaje compartido sin esperar el failsafe de 90s, o
         cancelar de una si cambió de opinión. */}
      {status === 'pending' && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onSwitchToShared()}
            className="py-3 rounded-2xl border-2 font-semibold text-sm transition-all hover:opacity-90"
            style={{ borderColor: '#0033A0', color: '#0033A0', backgroundColor: '#EEF2FF' }}
          >
            🚐 Probar compartido
          </button>
          <button
            onClick={handleCancel}
            className="py-3 rounded-2xl border-2 border-red-300 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors"
          >
            ✕ Cancelar
          </button>
        </div>
      )}

      {/* ══ BOARDING PASS: QR + PIN (pending y accepted) ══ */}
      {(status === 'pending' || status === 'accepted') && (
        <BoardingPassCard rideId={rideId} />
      )}

      {/* ══ NÚMERO PROXY (conductor asignado) ══ */}
      {proxyNumber && (status === 'accepted' || status === 'in_progress') && (
        <PhoneCard number={proxyNumber} />
      )}

      {/* ══ INFO DEL CONDUCTOR ══ */}
      {activeRide.driverInfo && status !== 'pending' && (
        <DriverCard info={activeRide.driverInfo} />
      )}

      {/* ══ PARADAS EXTRA (durante viaje) ══ */}
      {status === 'in_progress' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-gray-700">📍 Paradas en ruta</p>
            <button
              onClick={() => setShowStopInput(!showStopInput)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#ff4c41' }}
            >
              + Agregar parada
            </button>
          </div>

          {extraStops.length > 0 && (
            <div className="space-y-1 mb-3">
              {extraStops.map((stop, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-xl">
                  <span className="text-orange-500">📍</span>
                  <span className="flex-1 truncate">{stop.address}</span>
                </div>
              ))}
            </div>
          )}

          {showStopInput && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={stopAddress}
                onChange={(e) => setStopAddress(e.target.value)}
                placeholder="Dirección de la parada"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4c41]"
                onKeyDown={(e) => e.key === 'Enter' && handleAddStop()}
                autoFocus
              />
              <button
                onClick={handleAddStop}
                disabled={!stopAddress.trim()}
                className="px-4 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-40 transition-all hover:opacity-90"
                style={{ backgroundColor: '#ff4c41' }}
              >
                OK
              </button>
            </div>
          )}

          {extraStops.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-500">Tarifa actualizada ({extraStops.length} parada{extraStops.length > 1 ? 's' : ''} extra)</span>
              <span className="font-black text-base" style={{ color: '#ff4c41' }}>${currentFare.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* ══ COMPARTIR VIAJE ══ */}
      {(status === 'accepted' || status === 'in_progress') && !showShare && (
        <button
          onClick={() => setShowShare(true)}
          className="w-full py-3 rounded-2xl border-2 border-gray-200 text-gray-700 font-medium text-sm hover:border-gray-300 transition-colors flex items-center justify-center gap-2"
        >
          🔗 Compartir ubicación en tiempo real
        </button>
      )}
      {showShare && activeRide && (
        <ShareTracking
          rideId={rideId}
          origin={activeRide?.pickup?.address ?? ''}
          destination={activeRide?.dropoff?.address ?? ''}
        />
      )}

      {/* ══ BOTÓN SOS ══ */}
      {(status === 'accepted' || status === 'in_progress') && (
        <Link
          href="/sos"
          className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{ backgroundColor: '#7f1d1d', color: '#fff' }}
        >
          🆘 Emergencia / SOS
        </Link>
      )}

      {/* ══ BOTÓN CANCELAR (solo si pending) ══ */}
      {status === 'pending' && (
        <button
          onClick={handleCancel}
          className="w-full py-3 border border-red-300 text-red-600 rounded-2xl font-medium hover:bg-red-50 transition-colors text-sm"
        >
          Cancelar viaje
        </button>
      )}

      {/* ══ MODAL DE VERIFICACIÓN ══ */}
      {showVerify && !verified && (
        <VerificationModal
          rideId={rideId}
          driverInfo={activeRide.driverInfo}
          onVerified={() => { setVerified(true); setShowVerify(false); }}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Sub-componentes
   ══════════════════════════════════════════════════════════════ */

/* ── Banner de estado ── */
function StatusBanner({
  status, driverArrived, driverInfo, fare, extraStops, searchElapsed = 0,
}: {
  status: string;
  driverArrived: boolean;
  driverInfo?: { name: string };
  fare: number;
  extraStops: number;
  /** Segundos transcurridos en estado 'pending' — para feedback de búsqueda. */
  searchElapsed?: number;
}) {
  // Mensaje contextual progresivo en pending: vamos cambiando la copy según
  // los segundos transcurridos, así el user nunca ve un texto estático
  // durante 90 segundos y no piensa que la app se colgó.
  const pendingMessage = (() => {
    if (searchElapsed < 15) return 'Buscando conductor cerca de ti…';
    if (searchElapsed < 40) return 'Ampliando búsqueda en tu zona…';
    if (searchElapsed < 75) return 'Pocos conductores libres — seguimos intentando…';
    return 'Aún sin match — falta poco para mostrarte alternativas';
  })();
  // mm:ss para el badge del countdown (siempre 0–1:30 en pending)
  const elapsedLabel = `${Math.floor(searchElapsed / 60)}:${String(searchElapsed % 60).padStart(2, '0')}`;

  const configs: Record<string, { icon: string; label: string; color: string; bg: string }> = {
    pending:     { icon: '🔍', label: pendingMessage,                  color: '#6366f1', bg: '#EEF2FF' },
    accepted:    { icon: '🚗', label: `${driverInfo?.name ?? 'Conductor'} en camino`, color: '#10b981', bg: '#ECFDF5' },
    in_progress: { icon: '🛣️', label: 'Viaje en curso',                color: '#ff4c41', bg: '#fff2f2' },
    completed:   { icon: '✅', label: 'Viaje completado',              color: '#10b981', bg: '#ECFDF5' },
    cancelled:   { icon: '❌', label: 'Viaje cancelado',               color: '#ef4444', bg: '#FEF2F2' },
  };
  const cfg = configs[status] || configs.pending;
  const isPending = status === 'pending';

  return (
    <div className="rounded-2xl p-4" style={{ background: cfg.bg }}>
      <div className="flex items-center gap-3">
      {status === 'pending' ? (
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl animate-pulse" style={{ background: cfg.color + '20' }}>
          {cfg.icon}
        </div>
      ) : (
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: cfg.color + '20' }}>
          {driverArrived ? '📍' : cfg.icon}
        </div>
      )}
      <div className="flex-1">
        <p className="font-bold text-gray-900 text-sm">
          {driverArrived && status === 'accepted' ? '¡Conductor llegó! Verifica identidad' : cfg.label}
        </p>
        {isPending && (
          <p className="text-xs text-gray-500 mt-0.5">
            Tiempo de búsqueda: <span className="font-mono font-bold" style={{ color: cfg.color }}>{elapsedLabel}</span>
          </p>
        )}
      </div>
      <div className="text-right">
        <p className="font-black text-lg" style={{ color: cfg.color }}>${fare.toFixed(2)}</p>
        {extraStops > 0 && (
          <p className="text-xs text-orange-500 font-medium">+{extraStops} parada{extraStops > 1 ? 's' : ''}</p>
        )}
      </div>
      </div>
      {/* Barra de progreso visible solo en pending — full width al cumplir 90s.
         Da feedback continuo de que "algo se está moviendo" en lugar de un
         spinner estático que mantiene la duda de si la app está colgada. */}
      {isPending && (
        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: cfg.color + '20' }}>
          <div
            className="h-full transition-all duration-1000 ease-linear"
            style={{
              width: `${Math.min((searchElapsed / 90) * 100, 100)}%`,
              backgroundColor: cfg.color,
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ── Boarding Pass: QR + PIN de seguridad ── */
function BoardingPassCard({ rideId }: { rideId: string }) {
  const [expanded, setExpanded] = useState(true);

  // PIN determinístico de 4 dígitos basado en el rideId
  const pin = rideId.replace(/\D/g, '').slice(-4).padStart(4, '0');

  // QR codifica el tripId para que el conductor app lo escanee
  const qrData = encodeURIComponent(`going://ride/${rideId}`);
  const qrSrc  = `https://api.qrserver.com/v1/create-qr-code/?data=${qrData}&size=180x180&margin=10&bgcolor=ffffff`;

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 text-sm font-medium hover:border-gray-300 transition-colors flex items-center justify-center gap-2"
      >
        🎫 Mostrar boarding pass
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50" style={{ backgroundColor: '#011627' }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🎫</span>
          <p className="text-sm font-black text-white">Boarding Pass</p>
        </div>
        <button onClick={() => setExpanded(false)} className="text-white/40 hover:text-white/80 text-xs transition-colors">
          Ocultar
        </button>
      </div>

      <div className="p-4 flex gap-5 items-center">
        {/* QR */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100">
            {rideId ? (
              <img
                src={qrSrc}
                alt="QR boarding pass"
                className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <span className="text-3xl">📷</span>
            )}
          </div>
          <p className="text-center text-xs text-gray-400 mt-1">Escanea</p>
        </div>

        {/* PIN */}
        <div className="flex-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">PIN de seguridad</p>
          <div className="flex gap-2">
            {pin.split('').map((d, i) => (
              <div
                key={i}
                className="w-10 h-12 rounded-xl flex items-center justify-center text-xl font-black border-2"
                style={{ borderColor: '#ff4c41', color: '#ff4c41', backgroundColor: '#fff2f2' }}
              >
                {d}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            Muestra el QR o dicta el PIN a tu conductor para confirmar el viaje.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Número proxy ── */
function PhoneCard({ number }: { number: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(number).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">📞 Número de contacto con el conductor</p>
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3">
          <p className="text-lg font-black tracking-widest text-gray-900">{number}</p>
          <p className="text-xs text-gray-400 mt-0.5">Número temporal · válido hasta 30 min después del viaje</p>
        </div>
        <button
          onClick={copy}
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-all"
          style={{ background: copied ? '#10b981' : '#f3f4f6' }}
        >
          <span className="text-lg">{copied ? '✓' : '📋'}</span>
        </button>
      </div>
    </div>
  );
}

/* ── Info del conductor ── */
function DriverCard({ info }: { info: { name: string; rating: number; vehicle: string; licensePlate: string; photo: string } }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
        {info.photo
          ? <img src={info.photo} alt={info.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900">{info.name}</p>
        <Stars rating={info.rating} />
        <p className="text-xs text-gray-400 mt-0.5 truncate">{info.vehicle} · <span className="font-mono font-bold text-gray-600">{info.licensePlate}</span></p>
      </div>
    </div>
  );
}

/* ── Modal de verificación de identidad ── */
function VerificationModal({
  rideId, driverInfo, onVerified,
}: {
  rideId: string;
  driverInfo?: { name: string; vehicle: string; licensePlate: string };
  onVerified: () => void;
}) {
  const [step, setStep] = useState<'driver' | 'phone'>('driver');
  const [phoneConfirmed, setPhoneConfirmed] = useState(false);

  // PIN determinístico de 4 dígitos basado en el rideId
  const verifyCode = rideId.replace(/\D/g, '').slice(-4).padStart(4, '0');

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center border-b border-gray-100">
          <div className="text-4xl mb-2">🔐</div>
          <h3 className="text-lg font-black text-gray-900">Verificación de identidad</h3>
          <p className="text-sm text-gray-400 mt-1">Confirma que es tu conductor antes de subir</p>
        </div>

        {step === 'driver' ? (
          <div className="p-6 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">El conductor debe mostrarte este código</p>
            <div className="bg-gray-50 rounded-2xl p-5 text-center">
              <p className="text-5xl font-black tracking-widest text-gray-900 font-mono">{verifyCode}</p>
            </div>
            {driverInfo && (
              <div className="bg-[#fff2f2] rounded-xl p-3 text-sm space-y-1">
                <p><span className="text-gray-400">Conductor:</span> <span className="font-bold">{driverInfo.name}</span></p>
                <p><span className="text-gray-400">Vehículo:</span> <span className="font-bold">{driverInfo.vehicle}</span></p>
                <p><span className="text-gray-400">Placa:</span> <span className="font-bold font-mono">{driverInfo.licensePlate}</span></p>
              </div>
            )}
            <button
              onClick={() => setStep('phone')}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90"
              style={{ backgroundColor: '#ff4c41' }}
            >
              El código coincide → Continuar
            </button>
            <button
              onClick={() => {}}
              className="w-full py-2.5 text-xs text-red-500 font-medium hover:underline"
            >
              El código no coincide — Reportar problema
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">El conductor verificará tu número de teléfono</p>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">El conductor ve los últimos dígitos de tu número</p>
              <p className="text-2xl font-black text-gray-900">···· ···· <span style={{ color: '#ff4c41' }}>confirmado</span></p>
            </div>
            <label
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-100 cursor-pointer"
              onClick={() => setPhoneConfirmed(!phoneConfirmed)}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${phoneConfirmed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                {phoneConfirmed && <span className="text-white text-xs font-bold">✓</span>}
              </div>
              <span className="text-sm text-gray-700 font-medium">El conductor confirmó mi identidad</span>
            </label>
            <button
              onClick={onVerified}
              disabled={!phoneConfirmed}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all disabled:opacity-40 hover:opacity-90"
              style={{ backgroundColor: '#10b981' }}
            >
              ✅ Iniciar viaje
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
