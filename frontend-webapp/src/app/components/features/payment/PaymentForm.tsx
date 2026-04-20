'use client';

import { useState } from 'react';
import { paymentService } from '@/services/payment';
import type { PaymentMethod, InitiatePaymentResult } from '@/types';
import { PAYMENT_METHODS, PLATFORM_FEE_PERCENTAGE } from '@/types';

interface PaymentFormProps {
  rideId?:            string;
  amount?:            number;
  onPaymentComplete?: (method?: string) => void;
}

/**
 * PaymentForm -- Seleccion de metodo y disparo del flujo de pago.
 *
 * DATAFAST: redirige al entorno PCI DSS de DATAFAST (no se ingresan tarjetas aqui).
 * DeUna:    redirige al portal Banco Pichincha.
 * Efectivo: confirmacion local sin gateway.
 */
export function PaymentForm({
  rideId = '',
  amount = 0,
  onPaymentComplete,
}: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('datafast');
  const [loading, setLoading]             = useState(false);
  const [error,   setError]               = useState<string | null>(null);

  const summary = paymentService.calculatePaymentSummary(amount);

  const handlePay = async () => {
    if (rideId === '') { setError('ID de viaje no disponible'); return; }
    setError(null);
    setLoading(true);

    try {
      if (paymentMethod === 'cash') {
        onPaymentComplete?.('cash');
        return;
      }

      // Modo demo: rideId local o vacio
      if (rideId === '' || rideId.startsWith('trip-')) {
        onPaymentComplete?.(paymentMethod === 'datafast' ? 'card' : paymentMethod);
        return;
      }

      // DeUna: redirect al portal Banco Pichincha
      if (paymentMethod === 'deuna') {
        const result = await paymentService.initiatePayment({
          rideId,
          amountUsd:   amount,
          description: 'Viaje Going',
          gateway:     'deuna',
        });
        if (result.mode === 'redirect' && result.redirectUrl) {
          window.location.href = result.redirectUrl;
          return;
        }
        onPaymentComplete?.('deuna');
        return;
      }

      // DATAFAST
      const result = await paymentService.initiatePayment({
        rideId,
        amountUsd:   amount,
        description: 'Viaje Going',
      });

      if (result.mode === 'redirect' && result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }

      if (result.mode === 'lightbox' && result.token && result.checkoutJsUrl) {
        await loadDatafastSdk(result.checkoutJsUrl);
        (window as any).PAYMENT_WIDGET?.initiate(result.token);
        return;
      }

      if (result.mode === 'direct_api') {
        onPaymentComplete?.(paymentMethod === 'datafast' ? 'card' : paymentMethod);
        return;
      }

      throw new Error('Respuesta inesperada del servidor de pagos');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  const btnLabel = loading
    ? 'Procesando...'
    : paymentMethod === 'cash'
    ? 'Confirmar pago en efectivo'
    : paymentMethod === 'deuna'
    ? `Pagar $${summary.total.toFixed(2)} con DeUna`
    : `Pagar $${summary.total.toFixed(2)} con DATAFAST`;

  return (
    <div className="bg-white rounded-lg shadow-md p-6" data-testid="payment-form">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Pago del viaje</h3>

      {/* Resumen */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4" data-testid="payment-summary">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Tarifa base</span>
          <span className="font-semibold">${summary.baseFare.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-4">
          <span className="text-gray-600">Comision plataforma ({PLATFORM_FEE_PERCENTAGE}%)</span>
          <span className="font-semibold">${summary.platformFee.toFixed(2)}</span>
        </div>
        <div className="border-t pt-2 flex justify-between text-lg">
          <span className="font-bold">Total</span>
          <span className="font-bold text-[#0033A0]">${summary.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Seleccion de metodo */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Metodo de pago</label>
        <div className="space-y-2">
          {(Object.entries(PAYMENT_METHODS) as Array<[PaymentMethod, (typeof PAYMENT_METHODS)[PaymentMethod]]>)
            .map(([method, cfg]) => (
              <label
                key={method}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                  paymentMethod === method ? 'border-[#0033A0] bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input type="radio" value={method} checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)} className="w-4 h-4 accent-[#0033A0]" />
                <span className="text-xl">{cfg.emoji}</span>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{cfg.label}</p>
                  <p className="text-xs text-gray-500">{cfg.description}</p>
                </div>
              </label>
            ))}
        </div>
      </div>

      {/* Notas por metodo */}
      {paymentMethod === 'datafast' && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
          <span className="text-blue-500 mt-0.5">🔒</span>
          <p className="text-xs text-blue-700">
            Seras redirigido a la pagina segura de DATAFAST. Going nunca almacena datos de tarjetas.
          </p>
        </div>
      )}
      {paymentMethod === 'deuna' && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-green-50 border border-green-100">
          <span className="text-green-500 mt-0.5">🏦</span>
          <p className="text-xs text-green-700">
            Seras redirigido al portal seguro de DeUna / Banco Pichincha para autorizar el pago.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Boton */}
      <button onClick={handlePay} disabled={loading}
        className="w-full py-3 rounded-xl font-bold text-white bg-[#0033A0] hover:bg-[#002680] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        data-testid="pay-button">
        {btnLabel}
      </button>
    </div>
  );
}

function loadDatafastSdk(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = url; s.onload = () => resolve(); s.onerror = () => reject(new Error('SDK DATAFAST no disponible'));
    document.head.appendChild(s);
  });
}
