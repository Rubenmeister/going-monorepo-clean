'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useRideStore } from '../stores/rideStore';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { getStoredToken } from '@/lib/providers/auth-client';

/* ─── Lazy-loaded heavy components ─────────────────────────────────── */
const RideRequestForm = dynamic(
  () => import('../components/features/ride/RideRequestForm').then(m => ({ default: m.RideRequestForm })),
  { ssr: false, loading: () => <div className="animate-pulse bg-gray-100 rounded-3xl h-96" /> }
);
const RideTrackingPanel = dynamic(
  () => import('../components/features/tracking/RideTrackingPanel').then(m => ({ default: m.RideTrackingPanel })),
  { ssr: false, loading: () => <div className="animate-pulse bg-gray-100 rounded-2xl h-64" /> }
);
const PaymentForm = dynamic(
  () => import('../components/features/payment/PaymentForm').then(m => ({ default: m.PaymentForm })),
  { ssr: false }
);
const RideAccounting = dynamic(
  () => import('../components/features/payment/RideAccounting').then(m => ({ default: m.RideAccounting })),
  { ssr: false }
);
const RatingForm = dynamic(
  () => import('../components/features/rating/RatingForm').then(m => ({ default: m.RatingForm })),
  { ssr: false }
);
const ChatInterface = dynamic(
  () => import('../components/features/chat/ChatInterface').then(m => ({ default: m.ChatInterface })),
  { ssr: false }
);

/* ─── Types ─────────────────────────────────────────────────────────── */
type ServiceMode = 'compartido' | 'privado' | null;
type Step = 'request' | 'tracking' | 'confirmation' | 'payment' | 'accounting' | 'rating';

const STEPS: Step[] = ['request', 'tracking', 'confirmation', 'payment', 'accounting', 'rating'];

/* ─── Stepper component ─────────────────────────────────────────────── */
function RideStepper({ step }: { step: Step }) {
  const current = STEPS.indexOf(step);
  return (
    <div className="flex items-center justify-center gap-1 pt-2 pb-1">
      {STEPS.map((s, i) => {
        const isDone   = i < current;
        const isActive = i === current;
        return (
          <span key={s} className="flex items-center gap-1">
            <span className={`block rounded-full transition-all duration-300 ${
              isActive ? 'w-6 h-2 bg-[#ff4c41]' : isDone ? 'w-2 h-2 bg-[#ff4c41] opacity-40' : 'w-2 h-2 bg-gray-200'
            }`} />
            {i < STEPS.length - 1 && (
              <span className={`block w-4 h-px ${isDone ? 'bg-[#ff4c41] opacity-40' : 'bg-gray-200'}`} />
            )}
          </span>
        );
      })}
    </div>
  );
}

/* ─── Service Picker (entry cards, igual que móvil) ────────────────── */
function ServicePicker({ onSelect }: { onSelect: (m: 'compartido' | 'privado' | 'envios') => void }) {
  return (
    <div className="space-y-3">
      {/* Bienvenida */}
      <div className="pb-1">
        <h2 className="text-2xl font-black text-gray-900">¿Cómo quieres viajar?</h2>
        <p className="text-sm text-gray-500 mt-0.5">Elige el tipo de servicio que necesitas</p>
      </div>

      {/* Viaje Compartido */}
      <button
        onClick={() => onSelect('compartido')}
        className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm hover:border-[#0033A0]/30 hover:bg-blue-50/50 active:scale-[0.98] transition-all text-left"
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EFF6FF' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0033A0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-base font-black text-gray-900">Viaje Compartido</span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-[#0033A0] text-white">★ MÁS POPULAR</span>
          </div>
          <p className="text-sm text-gray-500">Paga solo tu asiento · SUV entre ciudades</p>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>

      {/* Viaje Privado */}
      <button
        onClick={() => onSelect('privado')}
        className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm hover:border-[#ff4c41]/30 hover:bg-red-50/50 active:scale-[0.98] transition-all text-left"
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFF0EF' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff4c41" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-base font-black text-gray-900 block mb-0.5">Viaje Privado</span>
          <p className="text-sm text-gray-500">Vehículo exclusivo · SUV, VAN o BUS</p>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>

      {/* Envíos */}
      <button
        onClick={() => onSelect('envios')}
        className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm hover:border-[#059669]/30 hover:bg-green-50/50 active:scale-[0.98] transition-all text-left"
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F0FDF4' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73L11 21.73a2 2 0 0 0 2 0L20 17.73A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-base font-black text-gray-900 block mb-0.5">Envíos</span>
          <p className="text-sm text-gray-500">De punto a punto · Rastreo · Registro de entrega</p>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  );
}

/* ─── Confirmation Panel (QR + token) ──────────────────────────────── */
interface ConfirmationPanelProps {
  rideToken: string;
  driverName: string;
  driverPlate?: string;
  driverPhoto?: string;
  origin: string;
  destination: string;
  estimatedFare: number;
  onContinue: () => void;
}

function ConfirmationPanel({
  rideToken, driverName, driverPlate, driverPhoto,
  origin, destination, estimatedFare, onContinue,
}: ConfirmationPanelProps) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(rideToken)}&size=200x200&margin=10&color=0033A0`;
  const shortToken = rideToken.length > 8 ? rideToken.slice(-8).toUpperCase() : rideToken.toUpperCase();

  return (
    <div className="space-y-4">

      {/* ── Conductor confirmado ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          {driverPhoto ? (
            <img src={driverPhoto} alt={driverName}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-[#0033A0]/20" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#0033A0]/10 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="#0033A0" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#0033A0" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          )}
          <div className="flex-1">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Conductor asignado</p>
            <p className="text-lg font-bold text-gray-900">{driverName}</p>
            {driverPlate && (
              <span className="inline-block mt-1 bg-[#0033A0] text-white text-xs font-bold px-3 py-1 rounded-lg tracking-widest">
                {driverPlate}
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-xs text-green-600 font-semibold">Viaje completado</span>
          </div>
        </div>
      </div>

      {/* ── Ruta ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
        <div className="flex items-start gap-3">
          <div className="mt-1 w-3 h-3 rounded-full bg-[#0033A0] flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400 font-medium">Origen</p>
            <p className="text-sm font-semibold text-gray-800">{origin}</p>
          </div>
        </div>
        <div className="ml-1.5 border-l-2 border-dashed border-gray-200 h-4" />
        <div className="flex items-start gap-3">
          <div className="mt-1 w-3 h-3 rounded-full bg-[#ff4c41] flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400 font-medium">Destino</p>
            <p className="text-sm font-semibold text-gray-800">{destination}</p>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">Tarifa estimada</span>
          <span className="text-lg font-bold text-gray-900">${estimatedFare.toFixed(2)}</span>
        </div>
      </div>

      {/* ── QR Code ── */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center gap-4">
        <div>
          <p className="text-center text-sm font-semibold text-gray-700 mb-1">¡Viaje completado!</p>
          <p className="text-center text-xs text-gray-400">Este es el comprobante de tu viaje. Guárdalo como referencia antes de pagar.</p>
        </div>

        <div className="p-3 bg-white rounded-2xl border-2 border-[#0033A0]/20 shadow-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt="QR código viaje"
            width={180}
            height={180}
            className="rounded-xl"
          />
        </div>

        <div className="bg-gray-50 rounded-xl px-6 py-3 text-center border border-gray-200">
          <p className="text-xs text-gray-400 font-medium mb-1">Token del viaje</p>
          <p className="text-2xl font-black tracking-[0.3em] text-[#0033A0]">{shortToken}</p>
        </div>

        <p className="text-xs text-gray-400 text-center max-w-xs">
          Conserva este token como comprobante. Puedes usarlo para cualquier reclamación posterior.
        </p>
      </div>

      {/* ── Continuar a pago ── */}
      <button
        onClick={onContinue}
        className="w-full bg-[#0033A0] text-white font-bold text-base py-4 rounded-2xl shadow-lg hover:bg-[#002280] active:scale-[0.98] transition-all"
      >
        Continuar al pago →
      </button>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────── */
function RidePageInner() {
  const router             = useRouter();
  const { auth }           = useMonorepoApp();
  const { activeRide, clearRide, resetForRetry } = useRideStore();

  const [step, setStep]               = useState<Step>('request');
  const [serviceMode, setServiceMode] = useState<ServiceMode>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('card');

  /* Auth guard INICIAL — redirige antes de mostrar el formulario.
   *
   * Lectura DIRECTA de localStorage para evitar race conditions con la
   * hidratación del Zustand store (que es async via useEffect en
   * RootLayoutClient). En el primer render post-navegación hard, el store
   * puede estar vacío aunque haya token persistido. Leyendo localStorage
   * directamente garantizamos que no haya falsos negativos que causen el
   * loop /ride <-> /auth/login.
   */
  useEffect(() => {
    if (auth.isLoading) return;
    if (typeof window === 'undefined') return;

    const hasLocalToken =
      !!localStorage.getItem('authToken') ||
      !!localStorage.getItem('auth_token') ||
      !!getStoredToken();

    if (!auth.user && !hasLocalToken) {
      router.replace(`/auth/login?from=/ride`);
    }
  }, [auth.isLoading, auth.user, router]);

  /* Avanzar a tracking cuando el viaje se crea.
   * NO requerimos auth.user del store porque puede ser null por race con
   * la hidratación. El guard previo ya validó que hay sesión via
   * localStorage; si llegamos acá con activeRide es porque el viaje se
   * creó OK. */
  useEffect(() => {
    if (activeRide && step === 'request') {
      setPaymentAmount(activeRide.estimatedFare);
      setStep('tracking');
    }
  }, [activeRide, step]);

  /* Mover a confirmación (resumen + QR) cuando el viaje se completa */
  useEffect(() => {
    if (activeRide?.status === 'completed' && step === 'tracking') {
      setStep('confirmation');
    }
  }, [activeRide?.status, step]);

  const handleCancelRide         = () => { clearRide(); setStep('request'); setServiceMode(null); };
  const handleConfirmationContinue = () => setStep('payment');
  const handlePaymentComplete    = (method: string) => { setPaymentMethod(method); setStep('accounting'); };
  const handleAccountingDone     = () => setStep('rating');
  const handleRatingComplete     = () => { clearRide(); setStep('request'); };

  // Tras no_driver: descarta el ride fallido pero conserva pickup/dropoff
  // (ya viven en el store) y vuelve al form en el mismo modo. El form remonta
  // y reusa los locations del store.
  const handleRetrySame = () => {
    resetForRetry();
    setStep('request');
  };

  // Tras no_driver: fuerza modo compartido y vuelve al form. Si el usuario
  // tocó un slot, pre-rellena fecha+hora vía URL para que el form los lea
  // en su useEffect de mount.
  const handleSwitchToShared = (time?: string) => {
    resetForRetry();
    setServiceMode('compartido');
    if (time) {
      const today = new Date().toISOString().slice(0, 10);
      const params = new URLSearchParams({ date: today, time });
      router.replace(`/ride?${params.toString()}`);
    } else {
      router.replace('/ride');
    }
    setStep('request');
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => step === 'request' ? router.push('/dashboard/pasajero') : router.back()}
              className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              {step === 'request'      ? (serviceMode ? (serviceMode === 'compartido' ? 'Viaje Compartido' : 'Viaje Privado') : 'Solicitar viaje') :
               step === 'tracking'     ? 'Tu viaje'           :
               step === 'confirmation' ? 'Confirmación'       :
               step === 'payment'      ? 'Pago'               :
               step === 'accounting'   ? 'Resumen del viaje'  :
                                         'Califica tu viaje'  }
            </h1>
          </div>
          {step === 'request' && serviceMode !== null && (
            <button onClick={() => setServiceMode(null)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ← Cambiar
            </button>
          )}
          {step !== 'request' && step !== 'tracking' && (
            <button onClick={() => setStep('request')} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ← Nuevo viaje
            </button>
          )}
        </div>
        <div className="max-w-2xl mx-auto">
          <RideStepper step={step} />
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Paso 1a: Elegir tipo de servicio */}
        {step === 'request' && serviceMode === null && (
          <ServicePicker onSelect={mode => {
            if (mode === 'envios') { router.push('/envios/cotizar'); return; }
            setServiceMode(mode);
          }} />
        )}

        {/* Paso 1b: Formulario de viaje */}
        {step === 'request' && serviceMode !== null && (
          <RideRequestForm defaultMode={serviceMode} />
        )}

        {/* Paso 2: Seguimiento en tiempo real */}
        {step === 'tracking' && (
          <RideTrackingPanel
            onCompleted={() => setStep('confirmation')}
            onCancelled={handleCancelRide}
            onRetrySame={handleRetrySame}
            onSwitchToShared={handleSwitchToShared}
          />
        )}

        {/* Paso 3: Confirmación con QR / token */}
        {step === 'confirmation' && activeRide && (
          <ConfirmationPanel
            rideToken={activeRide.tripId}
            driverName={activeRide.driverInfo?.name ?? 'Tu conductor'}
            driverPlate={activeRide.driverInfo?.licensePlate}
            driverPhoto={activeRide.driverInfo?.photo}
            origin={activeRide.pickup?.address ?? ''}
            destination={activeRide.dropoff?.address ?? ''}
            estimatedFare={activeRide.estimatedFare}
            onContinue={handleConfirmationContinue}
          />
        )}

        {/* Paso 4: Pago */}
        {step === 'payment' && (
          <PaymentForm
            amount={paymentAmount}
            onPaymentComplete={(method?: string) => handlePaymentComplete(method ?? 'card')}
          />
        )}

        {/* Paso 4: Contabilidad */}
        {step === 'accounting' && (
          <RideAccounting
            amount={paymentAmount}
            paymentMethod={paymentMethod}
            onDone={handleAccountingDone}
          />
        )}

        {/* Paso 5: Valoración */}
        {step === 'rating' && (
          <RatingForm
            driverName={activeRide?.driverInfo?.name || 'tu conductor'}
            onComplete={handleRatingComplete}
          />
        )}
      </div>

      {/* Chat flotante durante el viaje */}
      {activeRide && step === 'tracking' && (
        <ChatInterface
          rideId={activeRide.tripId}
          driverName={activeRide.driverInfo?.name}
          userId={(auth.user as any)?.id ?? (auth.user as any)?._id ?? 'anon'}
          userName={(auth.user as any)?.firstName ?? 'Pasajero'}
        />
      )}
    </div>
  );
}

export default function RidePage() {
  return (
    <Suspense fallback={<div className="animate-pulse bg-gray-100 min-h-screen" />}>
      <RidePageInner />
    </Suspense>
  );
}
