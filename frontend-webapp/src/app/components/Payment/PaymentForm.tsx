'use client';

import { useState } from 'react';

interface PaymentFormProps {
  rideId?: string;
  amount?: number;
  onPaymentComplete?: () => void;
}

export function PaymentForm({ rideId: _rideId, amount = 0, onPaymentComplete }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'cash'>('card');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');

  // Use provided amount or fallback
  const fare = amount;

  const handlePayment = async () => {
    try {
      setLoading(true);
      setStatus('processing');

      // Mock payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setStatus('completed');
      onPaymentComplete?.();
    } catch (error) {
      setStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6" data-testid="payment-method-selector">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Payment</h3>

      {/* Payment summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4" data-testid="payment-summary">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Base fare</span>
          <span className="font-semibold">${(fare * 0.8).toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-4">
          <span className="text-gray-600">Platform fee (20%)</span>
          <span className="font-semibold">${(fare * 0.2).toFixed(2)}</span>
        </div>
        <div className="border-t pt-2 flex justify-between text-lg">
          <span className="font-bold">Total</span>
          <span className="font-bold text-going-primary">${fare.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment method selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select payment method
        </label>
        <div className="space-y-2">
          {(['card', 'wallet', 'cash'] as const).map((method) => (
            <label key={method} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                value={method}
                checked={paymentMethod === method}
                onChange={(e) => setPaymentMethod(e.target.value as typeof method)}
                className="w-4 h-4"
              />
              <span className="flex items-center gap-2">
                {method === 'card' && '💳'}
                {method === 'wallet' && '👛'}
                {method === 'cash' && '💵'}
                <span className="capitalize">{method}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Card form for card payment */}
      {paymentMethod === 'card' && (
        <div className="mb-4 space-y-3" data-testid="payment-form">
          <input
            type="text"
            placeholder="Card number"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="MM/YY"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="text"
              placeholder="CVC"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      )}

      {/* Status display */}
      {status !== 'pending' && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm font-medium ${
            status === 'processing'
              ? 'bg-blue-100 text-blue-800'
              : status === 'completed'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
          data-testid="payment-status"
        >
          {status === 'processing' && '⏳ Processing payment...'}
          {status === 'completed' && '✅ Payment completed!'}
          {status === 'failed' && '❌ Payment failed'}
        </div>
      )}

      {/* Pay button */}
      <button
        onClick={handlePayment}
        disabled={loading || status === 'completed'}
        className="w-full bg-going-primary text-white py-2 rounded-lg font-semibold hover:bg-going-dark disabled:bg-gray-400 transition"
        data-testid="pay-button"
      >
        {loading ? 'Processing...' : `Pay $${fare.toFixed(2)}`}
      </button>
    </div>
  );
}

export default PaymentForm;
