/**
 * Hook for payment operations
 */

import { useState, useCallback } from 'react';
import { paymentService } from '@/services/payment';
import type { PaymentMethod, PaymentStatus, InitiatePaymentResult } from '@/types';

export interface UsePaymentServiceReturn {
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  loading: boolean;
  error: string | null;
  result: InitiatePaymentResult | null;
  setPaymentMethod: (method: PaymentMethod) => void;
  processPayment: (
    rideId: string,
    description?: string
  ) => Promise<InitiatePaymentResult | null>;
  reset: () => void;
}

/**
 * Hook for managing payment operations
 */
export function usePaymentService(
  initialAmount: number = 0
): UsePaymentServiceReturn {
  const [amount]                    = useState(initialAmount);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('datafast');
  const [status, setStatus]         = useState<PaymentStatus>('pending');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [result, setResult]         = useState<InitiatePaymentResult | null>(null);

  const processPayment = useCallback(
    async (rideId: string, description?: string): Promise<InitiatePaymentResult | null> => {
      if (!amount || amount <= 0) {
        setError('Invalid amount');
        return null;
      }

      setLoading(true);
      setError(null);
      setStatus('processing');

      try {
        const response = await paymentService.initiatePayment({
          rideId,
          amountUsd: amount,
          description,
        });
        setResult(response);
        setStatus(response.status ?? 'pending');
        return response;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Payment processing failed';
        setError(message);
        setStatus('error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [amount]
  );

  const reset = useCallback(() => {
    setStatus('pending');
    setError(null);
    setResult(null);
    setPaymentMethod('datafast');
  }, []);

  return {
    amount,
    paymentMethod,
    status,
    loading,
    error,
    result,
    setPaymentMethod,
    processPayment,
    reset,
  };
}
