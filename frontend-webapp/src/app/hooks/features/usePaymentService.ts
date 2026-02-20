/**
 * Hook for payment operations
 */

import { useState, useCallback } from 'react';
import { paymentService } from '@/services/payment';
import type { PaymentMethod, PaymentRequest, PaymentStatus } from '@/types';

export interface UsePaymentServiceReturn {
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  loading: boolean;
  error: string | null;
  setPaymentMethod: (method: PaymentMethod) => void;
  processPayment: (
    rideId: string,
    cardDetails?: { cardNumber: string; expiryDate: string; cvv: string }
  ) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for managing payment operations
 */
export function usePaymentService(
  initialAmount: number = 0
): UsePaymentServiceReturn {
  const [amount, setAmount] = useState(initialAmount);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = useCallback(
    async (
      rideId: string,
      cardDetails?: { cardNumber: string; expiryDate: string; cvv: string }
    ) => {
      // Validate inputs
      if (!amount || amount <= 0) {
        setError('Invalid amount');
        return;
      }

      // Validate card details if using card payment
      if (paymentMethod === 'card' && cardDetails) {
        const isValid = paymentService.validateCardDetails(
          cardDetails.cardNumber,
          cardDetails.expiryDate,
          cardDetails.cvv
        );
        if (!isValid) {
          setError('Invalid card details');
          return;
        }
      }

      setLoading(true);
      setError(null);
      setStatus('processing');

      try {
        const request: PaymentRequest = {
          rideId,
          amount,
          method: paymentMethod,
          cardDetails,
        };

        const response = await paymentService.processPayment(request);
        setStatus(response.status);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Payment processing failed';
        setError(message);
        setStatus('failed');
      } finally {
        setLoading(false);
      }
    },
    [amount, paymentMethod]
  );

  const reset = useCallback(() => {
    setStatus('pending');
    setError(null);
    setPaymentMethod('card');
  }, []);

  return {
    amount,
    paymentMethod,
    status,
    loading,
    error,
    setPaymentMethod,
    processPayment,
    reset,
  };
}
