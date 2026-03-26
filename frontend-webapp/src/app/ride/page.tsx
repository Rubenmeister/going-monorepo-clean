'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useRideStore } from '../stores/rideStore';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';

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
type Step = 'request' | 'tracking' | 'payment' | 'accounting' | 'rating';

/* ─── Page ──────────────────────────────────────────────────────────── */
function RidePageInner() {
  const router             = useRouter();
  const { auth }           = useMonorepoApp();
  const { activeRide, clearRide } = useRideStore();

  /* Auth guard */
  useEffect(() => {
    if (auth !== undefined && !auth.user) {
      router.replace(`/auth/login?from=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
  }, [auth, router]);

  const [step, setStep]               = useState<Step>('request');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('card');

  /* Mover a tracking cuando el viaje se crea */
  useEffect(() => {
    if (activeRide && step === 'request') {
      setPaymentAmount(activeRide.estimatedFare);
      setStep('tracking');
    }
  }, [activeRide, step]);

  /* Mover a pago cuando el viaje se completa */
  useEffect(() => {
    if (activeRide?.status === 'completed' && step === 'tracking') {
      setStep('payment');
    }
  }, [activeRide?.status, step]);

  const handleCancelRide      = () => { clearRide(); setStep('request'); };
  const handlePaymentComplete = (method: string) => { setPaymentMethod(method); setStep('accounting'); };
  const handleAccountingDone  = () => setStep('rating');
  const handleRatingComplete  = () => { clearRide(); setStep('request'); };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              {step === 'request'    ? 'Solicitar viaje'   :
               step === 'tracking'   ? 'Tu viaje'          :
               step === 'payment'    ? 'Pago'              :
               step === 'accounting' ? 'Resumen del viaje' :
                                       'Califica tu viaje'  }
            </h1>
          </div>
          {step !== 'request' && step !== 'tracking' && (
            <button onClick={() => setStep('request')} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ← Nuevo viaje
            </button>
          )}
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Paso 1: Solicitar viaje (incluye ruta + opciones completas) */}
        {step === 'request' && <RideRequestForm />}

        {/* Paso 2: Seguimiento en tiempo real */}
        {step === 'tracking' && (
          <RideTrackingPanel
            onCompleted={() => setStep('payment')}
            onCancelled={handleCancelRide}
          />
        )}

        {/* Paso 3: Pago */}
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
          userId="current-user"
          userName="Pasajero"
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
