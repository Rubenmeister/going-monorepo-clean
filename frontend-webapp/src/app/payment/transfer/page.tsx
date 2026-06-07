'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authFetch, getStoredToken, redirectToLogin } from '@/lib/providers/auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.goingec.com';

export default function TransferPage() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ recipientName: string; balance: number | null } | null>(null);

  const isEmail = recipient.includes('@');
  const value = Number(amount) || 0;

  const submit = async () => {
    if (typeof window !== 'undefined' && !getStoredToken()) { redirectToLogin('/payment/transfer'); return; }
    if (!recipient.trim()) { setError('Ingresa el correo o teléfono del destinatario'); return; }
    if (!(value > 0)) { setError('Ingresa un monto válido'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/payments/wallet/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [isEmail ? 'toEmail' : 'toPhone']: recipient.trim(),
          amount: value,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.message || 'No se pudo completar la transferencia.'); return; }
      setDone({ recipientName: data?.recipientName || 'el destinatario', balance: typeof data?.balance === 'number' ? data.balance : null });
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/payment/wallet" className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">←</Link>
          <h1 className="text-xl font-bold text-gray-900">Transferir saldo</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {done ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-5xl mb-3">✅</p>
            <p className="text-xl font-black text-gray-900">¡Transferencia enviada!</p>
            <p className="text-gray-600 mt-1">Enviaste <strong>${value.toFixed(2)}</strong> a <strong>{done.recipientName}</strong>.</p>
            {done.balance !== null && (
              <p className="text-gray-500 text-sm mt-1">Tu nuevo saldo: <span className="font-bold">${done.balance.toFixed(2)}</span></p>
            )}
            <Link href="/payment/wallet" className="inline-block mt-5 px-6 py-3 rounded-2xl text-white font-bold text-sm" style={{ backgroundColor: '#ff4c41' }}>
              Volver al Wallet
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Destinatario</label>
                <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)}
                  placeholder="Correo o teléfono"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0033A0]" />
                <p className="text-xs text-gray-400 mt-1">Debe ser un usuario de Going App.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Monto (USD)</label>
                <input type="number" inputMode="decimal" min={0.01} step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0033A0]" />
              </div>
            </div>

            {error && <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">{error}</div>}

            <button onClick={submit} disabled={loading || !recipient.trim() || !(value > 0)}
              className="w-full py-4 rounded-2xl font-black text-white text-base disabled:opacity-50" style={{ backgroundColor: '#ff4c41' }}>
              {loading ? 'Enviando…' : `Transferir${value > 0 ? ` $${value.toFixed(2)}` : ''}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
