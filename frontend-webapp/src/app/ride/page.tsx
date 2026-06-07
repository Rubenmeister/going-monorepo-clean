'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRideStore } from '../stores/rideStore';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { getStoredToken } from '@/lib/providers/auth-client';
import { COLORS } from '../components/design-tokens';
import { IconUsers, IconVan, IconPackage, IconArrowRight } from '../components/icons';
import { StaticRouteMap } from '../components/features/tracking/StaticRouteMap';

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
type ServiceMode = 'compartido' | 'privado' | 'ciudad' | null;
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

/* ─── Service Picker (entry cards, igual que móvil) ──────────────────
   Brand-aligned (Hero v6): mismos colores que la home para consistencia
   visual end-to-end.
     Compartido → rojo  · más popular
     Privado    → amarillo
     Envíos     → negro
*/
function ServicePicker({ onSelect }: { onSelect: (m: 'compartido' | 'privado' | 'ciudad' | 'envios') => void }) {
  return (
    <div className="space-y-3">
      {/* Bienvenida */}
      <div className="pb-1">
        <h2 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}>¿Cómo quieres viajar?</h2>
        <p className="text-sm text-gray-500 mt-0.5">Elige el tipo de servicio que necesitas</p>
      </div>

      {/* Viaje Compartido — rojo Going App */}
      <button
        onClick={() => onSelect('compartido')}
        className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm hover:bg-red-50/50 active:scale-[0.98] transition-all text-left"
        style={{ borderColor: COLORS.gray[100] }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = COLORS.brand.red + '4D')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = COLORS.gray[100])}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: COLORS.brand.redBg, color: COLORS.brand.red }}>
          <IconUsers size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-base font-black text-gray-900" style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}>Viaje Compartido</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white uppercase tracking-wider" style={{ backgroundColor: COLORS.brand.red }}>
              Más popular
            </span>
          </div>
          <p className="text-sm text-gray-500">Paga solo tu asiento · entre ciudades</p>
        </div>
        <IconArrowRight size={18} className="text-gray-300" />
      </button>

      {/* Viaje Privado — amarillo Going App */}
      <button
        onClick={() => onSelect('privado')}
        className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm hover:bg-yellow-50/50 active:scale-[0.98] transition-all text-left"
        style={{ borderColor: COLORS.gray[100] }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = COLORS.brand.yellow + '80')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = COLORS.gray[100])}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: COLORS.brand.yellowBg, color: COLORS.brand.yellowDark }}>
          <IconVan size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-base font-black text-gray-900 block mb-0.5" style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}>Viaje Privado</span>
          <p className="text-sm text-gray-500">Auto, SUV, VAN, Minibús o Bus · de 1 a 30 personas</p>
        </div>
        <IconArrowRight size={18} className="text-gray-300" />
      </button>

      {/* En la ciudad — azul Going App · taxi urbano inmediato */}
      <button
        onClick={() => onSelect('ciudad')}
        className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm hover:bg-blue-50/50 active:scale-[0.98] transition-all text-left"
        style={{ borderColor: COLORS.gray[100] }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = COLORS.brand.blue + '4D')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = COLORS.gray[100])}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EEF2FF', color: COLORS.brand.blue }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-base font-black text-gray-900 block mb-0.5" style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}>En la ciudad</span>
          <p className="text-sm text-gray-500">Carrera inmediata dentro de tu ciudad · al instante</p>
        </div>
        <IconArrowRight size={18} className="text-gray-300" />
      </button>

      {/* Envíos — negro Going App */}
      <button
        onClick={() => onSelect('envios')}
        className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all text-left"
        style={{ borderColor: COLORS.gray[100] }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = COLORS.brand.black + '4D')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = COLORS.gray[100])}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: COLORS.gray[100], color: COLORS.brand.black }}>
          <IconPackage size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-base font-black text-gray-900 block mb-0.5" style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}>Envíos</span>
          <p className="text-sm text-gray-500">Puerta a puerta · rastreo en vivo · comprobante de entrega</p>
        </div>
        <IconArrowRight size={18} className="text-gray-300" />
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
  pickup?: { lat: number; lon: number };
  dropoff?: { lat: number; lon: number };
  onContinue: () => void;
}

function ConfirmationPanel({
  rideToken, driverName, driverPlate, driverPhoto,
  origin, destination, estimatedFare, pickup, dropoff, onContinue,
}: ConfirmationPanelProps) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(rideToken)}&size=200x200&margin=10&color=0033A0`;
  const shortToken = rideToken.length > 8 ? rideToken.slice(-8).toUpperCase() : rideToken.toUpperCase();
  // El QR viene de una API externa (api.qrserver.com). Si falla, ocultamos
  // la imagen rota — el token en texto grande de abajo sirve de comprobante.
  const [qrFailed, setQrFailed] = useState(false);

  return (
    <div className="space-y-4">

      {/* ── Miniatura del mapa de la ruta (Static Images API) ── */}
      {pickup && dropoff && (
        <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          <StaticRouteMap pickup={pickup} dropoff={dropoff} width={600} height={200} className="w-full h-auto block" />
        </div>
      )}

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

        {!qrFailed && (
          <div className="p-3 bg-white rounded-2xl border-2 border-[#0033A0]/20 shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="QR código viaje"
              width={180}
              height={180}
              className="rounded-xl"
              onError={() => setQrFailed(true)}
            />
          </div>
        )}

        <div className="bg-gray-50 rounded-xl px-6 py-3 text-center border border-gray-200">
          <p className="text-xs text-gray-400 font-medium mb-1">Token del viaje</p>
          <p className="text-2xl font-black tracking-[0.3em] text-[#0033A0]">{shortToken}</p>
        </div>

        <p className="text-xs text-gray-400 text-center max-w-xs">
          Conserva este token como comprobante. Puedes usarlo para cualquier reclamación posterior.
        </p>
      </div>

      {/* ── Continuar a pago — CTA principal rojo Going App ── */}
      <button
        onClick={onContinue}
        className="w-full text-white font-bold text-base py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all hover:opacity-90"
        style={{ backgroundColor: COLORS.brand.red }}
      >
        Continuar al pago →
      </button>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────── */
function RidePageInner() {
  const router             = useRouter();
  const searchParams       = useSearchParams();
  const { auth }           = useMonorepoApp();
  const { activeRide, clearRide, resetForRetry } = useRideStore();

  // Tipo de servicio inicial leído de la URL (?type=shared|van|city) para que
  // "Reservar/Cotizar" desde el home lleve DIRECTO al formulario, sin volver a
  // preguntar "¿cómo quieres viajar?".
  const typeParam = searchParams.get('type');
  const initialMode: ServiceMode =
    typeParam === 'shared' || typeParam === 'compartido' ? 'compartido' :
    typeParam === 'city'   || typeParam === 'ciudad'     ? 'ciudad'     :
    typeParam === 'van'    || typeParam === 'private' || typeParam === 'privado' ? 'privado' :
    null;

  const [step, setStep]               = useState<Step>('request');
  const [serviceMode, setServiceMode] = useState<ServiceMode>(initialMode);

  // Nombre del usuario logueado para el saludo (sesión ya persistida).
  const firstName = ((auth.user as any)?.firstName || (auth.user as any)?.name?.split(' ')[0] || '') as string;
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
      // Preservar la ruta COMPLETA (incl. ?type=shared|van|city) para que al
      // volver del login/registro caiga directo en el tipo de viaje elegido,
      // sin pasar otra vez por el selector ("dar vueltas").
      const current = `${window.location.pathname}${window.location.search}`;
      router.replace(`/auth/login?from=${encodeURIComponent(current)}`);
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
      // Tanto inmediato como reservado van al panel de seguimiento. El panel
      // NO busca conductor en vivo si el estado es 'reserved' (muestra el
      // aviso de reserva y avisará ~1h/5min antes), y continúa el ciclo
      // completo: conductor en camino → compartir → SOS → fin de viaje → pago.
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
              onClick={() => step === 'request' ? router.push('/') : router.back()}
              className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              {step === 'request'      ? (serviceMode ? (serviceMode === 'compartido' ? 'Viaje Compartido' : serviceMode === 'ciudad' ? 'En la ciudad' : 'Viaje Privado') : 'Solicitar viaje') :
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

        {/* Saludo al usuario logueado (sesión ya iniciada) */}
        {step === 'request' && firstName && (
          <p className="text-sm text-gray-500 mb-3">
            Hola, <span className="font-bold text-gray-800">{firstName}</span> 👋
          </p>
        )}

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
            pickup={activeRide.pickup}
            dropoff={activeRide.dropoff}
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
