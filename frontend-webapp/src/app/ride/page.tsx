'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useRideStore } from '../stores/rideStore';

const RideRequestForm = dynamic(
  () =>
    import('../components/RideRequest/RideRequestForm').then((m) => ({
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
    import('../components/RideTracking/TrackingMap').then((m) => ({
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
    import('../components/RideTracking/RideStatus').then((m) => ({
      default: m.RideStatus,
    })),
  { ssr: false }
);

const PaymentForm = dynamic(
  () =>
    import('../components/Payment/PaymentForm').then((m) => ({
      default: m.PaymentForm || m.default,
    })),
  { ssr: false }
);

const RatingForm = dynamic(
  () =>
    import('../components/Rating/RatingForm').then((m) => ({
      default: m.RatingForm || m.default,
    })),
  { ssr: false }
);

const ChatInterface = dynamic(
  () => import('../components/Chat/ChatInterface'),
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
  const { activeRide, clearRide } = useRideStore();

  const initialType = searchParams.get('type') as RideCategory | null;
  const [step, setStep] = useState<Step>(initialType ? 'request' : 'type');
  const [mode, setMode] = useState<TransportMode>(
    initialType === 'shared' ? 'compartido' : 'privado'
  );
  const [rideCategory, setRideCategory] = useState<RideCategory>(
    initialType || 'economy'
  );
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
        {/* ── Paso 1: Selección de tipo ── */}
        {step === 'type' && (
          <div className="space-y-4">
            {/* Mode toggle */}
            <div className="bg-white rounded-2xl border border-gray-100 p-1 flex shadow-sm">
              <button
                onClick={() => setMode('privado')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  mode === 'privado'
                    ? 'bg-[#ff4c41] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🚗 Viaje Privado
              </button>
              <button
                onClick={() => setMode('compartido')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  mode === 'compartido'
                    ? 'bg-[#ff4c41] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                👥 Compartido
              </button>
            </div>

            {mode === 'privado' ? (
              <>
                <p className="text-center text-gray-500 text-sm">
                  El vehículo es exclusivo para ti. Elige tu categoría:
                </p>
                <div className="space-y-3">
                  {(['economy', 'comfort', 'premium'] as RideCategory[]).map(
                    (cat) => {
                      const t = RIDE_TYPES[cat];
                      return (
                        <button
                          key={cat}
                          onClick={() => handleSelectType(cat)}
                          className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:border-gray-200 transition-all text-left group"
                        >
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                            style={{ backgroundColor: `${t.color}15` }}
                          >
                            {t.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-gray-900">
                                {t.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">{t.desc}</p>
                          </div>
                          <div className="text-right">
                            <div
                              className="font-bold text-sm"
                              style={{ color: t.color }}
                            >
                              {t.price}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              Seleccionar →
                            </div>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-3">👥</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Viaje Compartido
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Viaja con otros pasajeros que van en la misma dirección.
                      Ahorra hasta un <strong>60%</strong> comparado con el
                      viaje privado.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { icon: '💰', label: 'Hasta 60% más barato' },
                      { icon: '🌱', label: 'Más sostenible' },
                      { icon: '⏱️', label: 'Rutas optimizadas' },
                    ].map((b) => (
                      <div
                        key={b.label}
                        className="rounded-xl p-3 text-center"
                        style={{ backgroundColor: '#fff2f2' }}
                      >
                        <div className="text-xl mb-1">{b.icon}</div>
                        <div className="text-xs text-gray-600 font-medium leading-tight">
                          {b.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className="rounded-xl p-4 mb-5 flex justify-between items-center"
                    style={{ backgroundColor: '#fff2f2' }}
                  >
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                        Precio por asiento
                      </div>
                      <div
                        className="text-2xl font-bold"
                        style={{ color: '#ff4c41' }}
                      >
                        desde $1.50
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                        Espera estimada
                      </div>
                      <div className="text-xl font-bold text-gray-700">
                        5–15 min
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectType('shared')}
                    className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:shadow-md hover:opacity-90"
                    style={{ backgroundColor: '#ff4c41' }}
                  >
                    Buscar viaje compartido
                  </button>
                </div>
              </>
            )}
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
