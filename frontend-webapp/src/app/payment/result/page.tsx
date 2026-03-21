'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { paymentService } from '@/services/payment';

type ResultState = 'loading' | 'approved' | 'rejected' | 'cancelled' | 'error';

/**
 * /payment/result — Página de retorno después del pago con DATAFAST.
 *
 * DATAFAST redirige aquí con:
 *   ?status=approved&txn=<transactionId>   → pago aprobado
 *   ?status=cancelled&txn=<transactionId>  → usuario canceló
 *   ?status=rejected&txn=<transactionId>   → pago rechazado por banco
 *
 * La página consulta el estado real al backend para evitar manipulación del query string.
 */
function PaymentResultInner() {
  const params    = useSearchParams();
  const router    = useRouter();
  const [state, setState] = useState<ResultState>('loading');
  const [txnId,  setTxnId]  = useState('');
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    const status = params.get('status');
    const txn    = params.get('txn') ?? '';
    setTxnId(txn);

    // Si el usuario canceló, no necesitamos consultar el backend
    if (status === 'cancelled') { setState('cancelled'); return; }

    if (!txn) { setState('error'); return; }

    // Verificar estado real con el backend (no confiar solo en el query string)
    paymentService.getPaymentStatus(txn)
      .then(result => {
        setAmount(result.amount ?? null);
        switch (result.status) {
          case 'approved': setState('approved'); break;
          case 'rejected': setState('rejected'); break;
          case 'error':    setState('error');    break;
          default: {
            // pending/processing → el webhook aún no llegó, reintentar con backoff (máx 5 intentos)
            let attempts = 0;
            const MAX_ATTEMPTS = 5;
            const poll = () => {
              if (attempts >= MAX_ATTEMPTS) { setState('error'); return; }
              attempts++;
              const delay = 3000 * attempts; // 3s, 6s, 9s, 12s, 15s
              setTimeout(() => {
                paymentService.getPaymentStatus(txn)
                  .then(r => {
                    if (r.status === 'approved') setState('approved');
                    else if (r.status === 'rejected') setState('rejected');
                    else if (r.status === 'pending' || r.status === 'processing') poll();
                    else setState('error');
                  })
                  .catch(() => setState('error'));
              }, delay);
            };
            poll();
          }
        }
      })
      .catch(() => setState('error'));
  }, [params]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        {state === 'loading' && (
          <>
            <div className="text-5xl mb-4 animate-pulse">⏳</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Verificando pago…</h2>
            <p className="text-gray-500 text-sm">Estamos confirmando tu transacción con DATAFAST.</p>
          </>
        )}

        {state === 'approved' && (
          <>
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">¡Pago aprobado!</h2>
            {amount && <p className="text-gray-500 mb-1">Total cobrado: <strong>${amount.toFixed(2)}</strong></p>}
            <p className="text-xs text-gray-400 mb-6">Referencia: {txnId.slice(0, 12)}…</p>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 rounded-xl font-bold text-white bg-[#0033A0] hover:bg-[#002680] transition-all"
            >
              Volver al inicio
            </button>
          </>
        )}

        {(state === 'rejected' || state === 'error') && (
          <>
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {state === 'rejected' ? 'Pago rechazado' : 'Error en el pago'}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {state === 'rejected'
                ? 'Tu banco rechazó la transacción. Verifica los datos de tu tarjeta e intenta de nuevo.'
                : 'Ocurrió un error al procesar tu pago. Por favor intenta de nuevo.'}
            </p>
            <button
              onClick={() => router.back()}
              className="w-full py-3 rounded-xl font-bold text-white bg-[#ff4c41] hover:bg-[#e03d32] transition-all"
            >
              Intentar de nuevo
            </button>
          </>
        )}

        {state === 'cancelled' && (
          <>
            <div className="text-5xl mb-4">🔙</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Pago cancelado</h2>
            <p className="text-gray-500 text-sm mb-6">Cancelaste el proceso de pago. Tu viaje no fue cobrado.</p>
            <button
              onClick={() => router.back()}
              className="w-full py-3 rounded-xl font-bold text-[#0033A0] bg-blue-50 hover:bg-blue-100 transition-all"
            >
              Volver
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50" />}>
      <PaymentResultInner />
    </Suspense>
  );
}
