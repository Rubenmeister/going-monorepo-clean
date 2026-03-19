'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useRideStore } from '../stores/rideStore';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';

const RideRequestForm = dynamic(
  () =>
    import('../components/features/ride/RideRequestForm').then((m) => ({
      default: m.RideRequestForm,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-gray-100 rounded-xl h-96" />
    ),
  }
);

const TrackingMap = dynamic(
  () =>
    import('../components/features/tracking/TrackingMap').then((m) => ({
      default: m.TrackingMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-gray-100 rounded-xl h-64" />
    ),
  }
);

const RideStatus = dynamic(
  () =>
    import('../components/features/tracking/RideStatus').then((m) => ({
      default: m.RideStatus,
    })),
  { ssr: false }
);

const PaymentForm = dynamic(
  () =>
    import('../components/features/payment/PaymentForm').then((m) => ({
      default: m.PaymentForm,
    })),
  { ssr: false }
);

const RatingForm = dynamic(
  () =>
    import('../components/features/rating/RatingForm').then((m) => ({
      default: m.RatingForm,
    })),
  { ssr: false }
);

const ChatInterface = dynamic(
  () =>
    import('../components/features/chat/ChatInterface').then((m) => ({
      default: m.ChatInterface,
    })),
  { ssr: false }
);

type Step = 'type' | 'request' | 'tracking' | 'payment' | 'rating';
type TransportMode = 'privado' | 'compartido';
type RideCategory = 'economy' | 'comfort' | 'premium' | 'shared';

const RIDE_TYPES: Record<
  RideCategory,
  { label: string; icon: string; desc: string; price: string; color: string }
> = {
  economy: {
    label: 'Economy',
    icon: '🚗',
    desc: 'Accesible y confiable',
    price: 'desde $2.50',
    color: '#10B981',
  },
  comfort: {
    label: 'Comfort',
    icon: '🚙',
    desc: 'Más espacio y comodidad',
    price: 'desde $3.25',
    color: '#3B82F6',
  },
  premium: {
    label: 'Premium',
    icon: '🚘',
    desc: 'Experiencia ejecutiva',
    price: 'desde $4.00',
    color: '#F59E0B',
  },
  shared: {
    label: 'Compartido',
    icon: '👥',
    desc: 'Divide el costo con otros',
    price: 'desde $1.50',
    color: '#ff4c41',
  },
};

const STEPS = [
  { key: 'type', label: 'Tipo' },
  { key: 'request', label: 'Ruta' },
  { key: 'tracking', label: 'Seguimiento' },
  { key: 'payment', label: 'Pago' },
  { key: 'rating', label: 'Valorar' },
];

function RidePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { auth } = useMonorepoApp();
  const { activeRide, clearRide } = useRideStore();

  // Auth guard — redirige a login si no hay sesión
  useEffect(() => {
    if (auth !== undefined && !auth.user) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      router.replace(`/auth/login?returnUrl=${returnUrl}`);
    }
  }, [auth, router]);

  const initialType = searchParams.get('type') as RideCategory | null;
  const [step, setStep] = useState<Step>(initialType ? 'request' : 'type');
  const [mode, setMode] = useState<TransportMode>(
    initialType === 'shared' ? 'compartido' : 'privado'
  );
  const [rideCategory, setRideCategory] = useState<RideCategory>(
    initialType || 'economy'
  );
  const [passengers, setPassengers] = useState(1);
  const [paymentAmount, setPaymentAmount] = useState(0);

  useEffect(() => {
    if (activeRide && step === 'request') {
      setPaymentAmount(activeRide.estimatedFare);
      setStep('tracking');
    }
  }, [activeRide, step]);

  useEffect(() => {
    if (activeRide?.status === 'completed' && step === 'tracking') {
      setStep('payment');
    }
  }, [activeRide?.status, step]);

  const handleSelectType = (category: RideCategory) => {
    setRideCategory(category);
    setStep('request');
  };

  const handlePaymentComplete = () => setStep('rating');

  const handleRatingComplete = () => {
    clearRide();
    setStep('type');
  };

  const handleCancelRide = () => {
    clearRide();
    setStep('type');
  };

  const stepOrder = STEPS.map((s) => s.key);
  const currentStepIndex = stepOrder.indexOf(step);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">
              {step === 'type'
                ? '¿Cómo quieres viajar?'
                : `Reservar viaje ${RIDE_TYPES[rideCategory]?.icon}`}
            </h1>
            {step !== 'type' && (
              <button
                onClick={() => setStep('type')}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Cambiar tipo
              </button>
            )}
          </div>

          {/* Progress steps */}
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    i < currentStepIndex
                      ? 'bg-green-500 text-white'
                      : i === currentStepIndex
                      ? 'bg-[#ff4c41] text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {i < currentStepIndex ? '✓' : i + 1}
                </div>
                <span
                  className={`ml-1 text-xs hidden sm:inline ${
                    i === currentStepIndex
                      ? 'text-[#ff4c41] font-medium'
                      : 'text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-1.5 h-0.5 w-4 ${
                      i < currentStepIndex ? 'bg-green-400' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* ── Paso 1: Tipo de viaje ── */}
        {step === 'type' && (
          <div className="space-y-4">

            {/* 1a. Privado vs Compartido */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">¿Cómo quieres viajar?</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'privado' as TransportMode, icon: '🚗', label: 'Viaje Privado', desc: 'El vehículo es solo para ti y tu grupo' },
                    { key: 'compartido' as TransportMode, icon: '👥', label: 'Compartido', desc: 'Comparte ruta y costo con otros pasajeros' },
                  ].map(opt => (
                    <button key={opt.key} onClick={() => setMode(opt.key)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        mode === opt.key ? 'border-[#ff4c41] bg-[#fff2f2]' : 'border-gray-100 hover:border-gray-200'
                      }`}>
                      <div className="text-2xl mb-2">{opt.icon}</div>
                      <div className="font-bold text-gray-900 text-sm">{opt.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5 leading-tight">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 1b. Número de pasajeros */}
              <div className="px-5 py-4 border-t border-gray-50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">¿Cuántas personas viajan?</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setPassengers(p => Math.max(1, p - 1))}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 transition-all text-lg flex items-center justify-center">−</button>
                  <div className="flex-1 text-center">
                    <span className="text-3xl font-black" style={{ color: '#ff4c41' }}>{passengers}</span>
                    <span className="text-gray-400 text-sm ml-1">{passengers === 1 ? 'pasajero' : 'pasajeros'}</span>
                  </div>
                  <button onClick={() => setPassengers(p => Math.min(mode === 'compartido' ? 3 : 40, p + 1))}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 transition-all text-lg flex items-center justify-center">+</button>
                </div>
                {mode === 'compartido' && (
                  <p className="text-xs text-gray-400 text-center mt-2">Máx. 3 pasajeros en viaje compartido</p>
                )}
              </div>

              {/* 1c. Tipo de vehículo */}
              <div className="px-5 pb-5 border-t border-gray-50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 mt-4">Tipo de vehículo</p>
                {mode === 'privado' ? (
                  <div className="space-y-2">
                    {([
                      { cat: 'economy' as RideCategory, icon: '🚗', label: 'Automóvil', seats: '1–4', price: 'desde $2.50', desc: 'Económico y confiable' },
                      { cat: 'comfort' as RideCategory, icon: '🚙', label: 'SUV / SUV XL', seats: '1–6', price: 'desde $3.25', desc: 'Más espacio y comodidad' },
                      { cat: 'premium' as RideCategory, icon: '🚌', label: 'VAN / Minibús / Bus', seats: '1–40', price: 'desde $6.00', desc: 'Para grupos grandes' },
                    ]).map(v => (
                      <button key={v.cat} onClick={() => handleSelectType(v.cat)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                          rideCategory === v.cat ? 'border-[#ff4c41] bg-[#fff2f2]' : 'border-gray-100 hover:border-gray-200'
                        }`}>
                        <span className="text-2xl">{v.icon}</span>
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 text-sm">{v.label}</div>
                          <div className="text-xs text-gray-400">{v.desc} · {v.seats} pax</div>
                        </div>
                        <div className="text-sm font-bold" style={{ color: '#ff4c41' }}>{v.price}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {([
                      { cat: 'shared' as RideCategory, icon: '🚙', label: 'Confort', seats: '1–3', price: 'desde $1.50', desc: 'SUV / SUV XL compartido' },
                    ]).map(v => (
                      <button key={v.cat} onClick={() => handleSelectType(v.cat)}
                        className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-[#ff4c41] bg-[#fff2f2] text-left">
                        <span className="text-2xl">{v.icon}</span>
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 text-sm">{v.label}</div>
                          <div className="text-xs text-gray-400">{v.desc} · máx. {v.seats} pax</div>
                        </div>
                        <div className="text-sm font-bold" style={{ color: '#ff4c41' }}>{v.price}</div>
                      </button>
                    ))}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {[{ icon: '💰', label: 'Hasta 60% más barato' }, { icon: '🌱', label: 'Más sostenible' }, { icon: '⏱️', label: 'Rutas optimizadas' }].map(b => (
                        <div key={b.label} className="rounded-xl p-2.5 text-center bg-gray-50">
                          <div className="text-lg mb-0.5">{b.icon}</div>
                          <div className="text-xs text-gray-500 leading-tight">{b.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CTA continuar */}
            <button onClick={() => handleSelectType(mode === 'compartido' ? 'shared' : rideCategory)}
              className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all hover:opacity-90 shadow-lg"
              style={{ backgroundColor: '#ff4c41' }}>
              Continuar → Elegir ruta →
            </button>
          </div>
        )}

        {/* ── Pasos siguientes ── */}
        {step === 'request' && <RideRequestForm />}

        {step === 'tracking' && (
          <>
            <TrackingMap />
            <RideStatus />
            {activeRide?.status === 'pending' && (
              <button
                onClick={handleCancelRide}
                className="w-full py-3 border border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors text-sm"
              >
                Cancelar viaje
              </button>
            )}
            {activeRide?.status === 'completed' && (
              <button
                onClick={() => setStep('payment')}
                className="w-full py-3 text-white rounded-xl font-medium hover:opacity-90 transition-opacity text-sm"
                style={{ backgroundColor: '#ff4c41' }}
              >
                Ir a pagar →
              </button>
            )}
          </>
        )}

        {step === 'payment' && (
          <PaymentForm
            amount={paymentAmount}
            onPaymentComplete={handlePaymentComplete}
          />
        )}

        {step === 'rating' && (
          <RatingForm
            driverName={activeRide?.driverInfo?.name || 'tu conductor'}
            onComplete={handleRatingComplete}
          />
        )}
      </div>

      {/* Chat flotante durante viaje activo */}
      {activeRide && ['tracking', 'payment'].includes(step) && (
        <ChatInterface
          rideId={activeRide.tripId}
          driverName={activeRide.driverInfo?.name}
          userId="current-user"
          userName="Pasajero"
        />
      )}
    </div>
  );
}

export default function RidePage() {
  return (
    <Suspense
      fallback={<div className="animate-pulse bg-gray-100 min-h-screen" />}
    >
      <RidePageInner />
    </Suspense>
  );
}
