'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRideStore } from '../stores/rideStore';

// Dynamic imports to avoid SSR issues
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

type Step = 'request' | 'tracking' | 'payment' | 'rating';

export default function RidePage() {
  const { activeRide, clearRide } = useRideStore();
  const [step, setStep] = useState<Step>('request');
  const [paymentAmount, setPaymentAmount] = useState(0);

  // Move to tracking when ride is created
  useEffect(() => {
    if (activeRide && step === 'request') {
      setPaymentAmount(activeRide.estimatedFare);
      setStep('tracking');
    }
  }, [activeRide, step]);

  // Move to payment when ride is completed
  useEffect(() => {
    if (activeRide?.status === 'completed' && step === 'tracking') {
      setStep('payment');
    }
  }, [activeRide?.status, step]);

  const handlePaymentComplete = () => {
    setStep('rating');
  };

  const handleRatingComplete = () => {
    clearRide();
    setStep('request');
  };

  const handleCancelRide = () => {
    clearRide();
    setStep('request');
  };

  const stepOrder: Step[] = ['request', 'tracking', 'payment', 'rating'];
  const currentStepIndex = stepOrder.indexOf(step);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Book a Ride</h1>
          {/* Progress steps */}
          <div className="flex items-center gap-1 mt-3">
            {[
              { key: 'request', label: 'Request' },
              { key: 'tracking', label: 'Tracking' },
              { key: 'payment', label: 'Payment' },
              { key: 'rating', label: 'Rating' },
            ].map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    i < currentStepIndex
                      ? 'bg-green-500 text-white'
                      : i === currentStepIndex
                      ? 'bg-[#ff4c41] text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {i < currentStepIndex ? '✓' : i + 1}
                </div>
                <span
                  className={`ml-1 text-xs ${
                    i === currentStepIndex
                      ? 'text-[#ff4c41] font-medium'
                      : 'text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
                {i < 3 && (
                  <div
                    className={`mx-2 h-0.5 w-6 ${
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
        {step === 'request' && <RideRequestForm />}

        {step === 'tracking' && (
          <>
            <TrackingMap />
            <RideStatus />
            {activeRide?.status === 'pending' && (
              <button
                onClick={handleCancelRide}
                className="w-full py-3 border border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
              >
                Cancel Ride
              </button>
            )}
            {activeRide?.status === 'completed' && (
              <button
                onClick={() => setStep('payment')}
                className="w-full py-3 bg-[#ff4c41] text-white rounded-xl font-medium hover:bg-[#e63a2f] transition-colors"
              >
                Proceed to Payment
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
            driverName={activeRide?.driverInfo?.name || 'your driver'}
            onComplete={handleRatingComplete}
          />
        )}
      </div>

      {/* Floating chat when ride is active */}
      {activeRide && ['tracking', 'payment'].includes(step) && (
        <ChatInterface
          rideId={activeRide.tripId}
          driverName={activeRide.driverInfo?.name}
          userId="current-user"
          userName="Passenger"
        />
      )}
    </div>
  );
}
