'use client';

import { useState } from 'react';
import { usePaymentService } from '@/hooks/features/usePaymentService';
import type { PaymentMethod } from '@/types';
import { PAYMENT_METHODS, PLATFORM_FEE_PERCENTAGE } from '@/types';
import { paymentService } from '@/services/payment';

interface PaymentFormProps {
  rideId?: string;
  amount?: number;
  onPaymentComplete?: () => void;
}

/**
 * Payment form component for ride payment
 */
export function PaymentForm({
  rideId = '',
  amount = 0,
  onPaymentComplete,
}: PaymentFormProps) {
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  const {
    paymentMethod,
    status,
    loading,
    error,
    setPaymentMethod,
    processPayment,
  } = usePaymentService(amount);

  const paymentSummary = paymentService.calculatePaymentSummary(amount);

  const handlePayment = async () => {
    await processPayment(rideId, cardDetails);
    if (status === 'completed') {
      onPaymentComplete?.();
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md p-6"
      data-testid="payment-method-selector"
    >
      <h3 className="text-lg font-bold text-gray-800 mb-4">Payment</h3>

      {/* Payment summary */}
      <PaymentSummaryDisplay summary={paymentSummary} />

      {/* Payment method selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select payment method
        </label>
        <div className="space-y-2">
          {(
            Object.entries(PAYMENT_METHODS) as Array<
              [PaymentMethod, (typeof PAYMENT_METHODS)[PaymentMethod]]
            >
          ).map(([method, config]) => (
            <label
              key={method}
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                type="radio"
                value={method}
                checked={paymentMethod === method}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
                className="w-4 h-4"
              />
              <span className="flex items-center gap-2">
                <span>{config.emoji}</span>
                <span className="capitalize">{config.label}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Card form for card payment */}
      {paymentMethod === 'card' && (
        <CardDetailsForm
          cardDetails={cardDetails}
          onCardDetailsChange={setCardDetails}
        />
      )}

      {/* Status display */}
      {status !== 'pending' && <PaymentStatusDisplay status={status} />}

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm font-medium bg-red-100 text-red-800">
          {error}
        </div>
      )}

      {/* Pay button */}
      <button
        onClick={handlePayment}
        disabled={loading || status === 'completed'}
        className="w-full bg-going-primary text-white py-2 rounded-lg font-semibold hover:bg-going-dark disabled:bg-gray-400 transition"
        data-testid="pay-button"
      >
        {loading ? 'Processing...' : `Pay $${paymentSummary.total.toFixed(2)}`}
      </button>
    </div>
  );
}

/**
 * Payment summary display component
 */
function PaymentSummaryDisplay({
  summary,
}: {
  summary: ReturnType<typeof paymentService.calculatePaymentSummary>;
}) {
  return (
    <div
      className="bg-gray-50 rounded-lg p-4 mb-4"
      data-testid="payment-summary"
    >
      <div className="flex justify-between mb-2">
        <span className="text-gray-600">Base fare</span>
        <span className="font-semibold">${summary.baseFare.toFixed(2)}</span>
      </div>
      <div className="flex justify-between mb-4">
        <span className="text-gray-600">
          Platform fee ({PLATFORM_FEE_PERCENTAGE}%)
        </span>
        <span className="font-semibold">${summary.platformFee.toFixed(2)}</span>
      </div>
      <div className="border-t pt-2 flex justify-between text-lg">
        <span className="font-bold">Total</span>
        <span className="font-bold text-going-primary">
          ${summary.total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

/**
 * Card details input form
 */
function CardDetailsForm({
  cardDetails,
  onCardDetailsChange,
}: {
  cardDetails: { cardNumber: string; expiryDate: string; cvv: string };
  onCardDetailsChange: (details: typeof cardDetails) => void;
}) {
  return (
    <div className="mb-4 space-y-3" data-testid="payment-form">
      <input
        type="text"
        placeholder="Card number"
        value={cardDetails.cardNumber}
        onChange={(e) =>
          onCardDetailsChange({ ...cardDetails, cardNumber: e.target.value })
        }
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="MM/YY"
          value={cardDetails.expiryDate}
          onChange={(e) =>
            onCardDetailsChange({ ...cardDetails, expiryDate: e.target.value })
          }
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <input
          type="text"
          placeholder="CVC"
          value={cardDetails.cvv}
          onChange={(e) =>
            onCardDetailsChange({ ...cardDetails, cvv: e.target.value })
          }
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>
    </div>
  );
}

/**
 * Payment status display
 */
function PaymentStatusDisplay({ status }: { status: string }) {
  const statusConfig = {
    processing: {
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      message: '⏳ Processing payment...',
    },
    completed: {
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      message: '✅ Payment completed!',
    },
    failed: {
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      message: '❌ Payment failed',
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  return (
    <div
      className={`mb-4 p-3 rounded-lg text-sm font-medium ${config.bgColor} ${config.textColor}`}
      data-testid="payment-status"
    >
      {config.message}
    </div>
  );
}
