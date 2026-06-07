'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authFetch, getStoredToken, redirectToLogin } from '@/lib/providers/auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.goingec.com';
const AMOUNTS = [5, 10, 20, 50];
type Method = 'datafast' | 'deuna';
type Phase = 'select' | 'paying' | 'done' | 'error';

export default function RechargePage() {
  const [amount, setAmount] = useState<number>(10);
  const [custom, setCustom] = useState('');
  const [method, setMethod] = useState<Method>('datafast');
  const [phase, setPhase] = useState<Phase>('select');
  const [error, setError] = useState('');
  const [ref, setRef] = useState('');
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);

  const finalAmount = custom ? Math.max(0, Number(custom) || 0) : amount;

  const start = async () => {
    if (typeof window !== 'undefined' && !getStoredToken()) { redirectToLogin('/payment/recharge'); return; }
    if (!(finalAmount >= 1)) { setError('El monto mínimo es $1.00'); return; }
    setError('');
    try {
      const res = await authFetch(`${API_URL}/payments/wallet/recharge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: finalAmount, method }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.message || 'No se pudo iniciar la recarga.'); return; }
      setRef(data.ref);
      const url = data.checkoutUrl || data.paymentLink;
      if (url) window.open(url, '_blank', 'noopener');
      setPhase('paying');
    } catch {
      setError('No se pudo conectar con el servidor.');
    }
  };

  const confirm = async () => {
    if (!ref) return;
    setChecking(true);
    setError('');
    try {
      const res = await authFetch(`${API_URL}/payments/wallet/recharge/${ref}/confirm`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (data?.status === 'completed') {
        setNewBalance(typeof data.balance === 'number' ? data.balance : null);
        setPhase('done');
      } else if (data?.status === 'failed') {
        setError('El pago no se completó. Intenta de nuevo.');
        setPhase('error');
      } else {
        setError('Aún no recibimos la confirmación del pago. Si ya pagaste, espera unos segundos y vuelve a intentar.');
      }
    } catch {
      setError('No se pudo verificar el pago.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/payment/wallet" className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">←</Link>
          <h1 className="text-xl font-bold text-gray-900">Recargar Wallet</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {phase === 'done' ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-5xl mb-3">✅</p>
            <p className="text-xl font-black text-gray-900">¡Recarga exitosa!</p>
            {newBalance !== null && (
              <p className="text-gray-600 mt-1">Nuevo saldo: <span className="font-bold">${newBalance.toFixed(2)}</span></p>
            )}
            <Link href="/payment/wallet" className="inline-block mt-5 px-6 py-3 rounded-2xl text-white font-bold text-sm" style={{ backgroundColor: '#ff4c41' }}>
              Volver al Wallet
            </Link>
          </div>
        ) : (
          <>
            {/* Monto */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-bold text-gray-700 mb-3">¿Cuánto quieres recargar?</p>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {AMOUNTS.map(a => {
                  const active = !custom && amount === a;
                  return (
                    <button key={a} type="button" onClick={() => { setAmount(a); setCustom(''); }}
                      className="py-3 rounded-xl text-sm font-black border-2 transition-all"
                      style={active ? { borderColor: '#0033A0', backgroundColor: '#EEF2FF', color: '#0033A0' } : { borderColor: '#E5E7EB', color: '#374151' }}>
                      ${a}
                    </button>
                  );
                })}
              </div>
              <input type="number" inputMode="decimal" min={1} placeholder="Otro monto (USD)"
                value={custom} onChange={e => setCustom(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0033A0]" />
            </div>

            {/* Método */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-bold text-gray-700 mb-3">Método de pago</p>
              <div className="space-y-2">
                {([
                  { id: 'datafast' as Method, label: 'Tarjeta (Datafast)', sub: 'Crédito/débito Visa, Mastercard, Amex' },
                  { id: 'deuna' as Method, label: 'DeUna', sub: 'Billetera digital · paga con QR' },
                ]).map(m => {
                  const active = method === m.id;
                  return (
                    <button key={m.id} type="button" onClick={() => setMethod(m.id)}
                      className="w-full flex items-center gap-3 rounded-xl px-4 py-3 border-2 text-left transition-all"
                      style={active ? { borderColor: '#0033A0', backgroundColor: '#EEF2FF' } : { borderColor: '#E5E7EB' }}>
                      <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: active ? '#0033A0' : '#D1D5DB' }}>
                        {active && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#0033A0' }} />}
                      </span>
                      <span>
                        <span className="block text-sm font-bold text-gray-900">{m.label}</span>
                        <span className="block text-xs text-gray-500">{m.sub}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">{error}</div>}

            {phase === 'paying' ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <p className="text-sm text-gray-600">Abrimos el pago en otra pestaña. Cuando termines, confirma aquí:</p>
                <button onClick={confirm} disabled={checking}
                  className="w-full py-4 rounded-2xl font-black text-white text-sm disabled:opacity-60" style={{ backgroundColor: '#0033A0' }}>
                  {checking ? 'Verificando…' : 'Ya completé el pago'}
                </button>
              </div>
            ) : (
              <button onClick={start} disabled={!(finalAmount >= 1)}
                className="w-full py-4 rounded-2xl font-black text-white text-base disabled:opacity-50" style={{ backgroundColor: '#ff4c41' }}>
                Recargar ${finalAmount.toFixed(2)}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
