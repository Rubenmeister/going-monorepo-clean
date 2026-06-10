'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch, getStoredToken, parseJwtPayload, redirectToLogin } from '@/lib/providers/auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.goingec.com';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'credit' | 'debit';
}

export default function WalletPage() {
  const [balance, setBalance]   = useState<number | null>(null);
  const [name, setName]         = useState('');
  const [txs, setTxs]           = useState<Transaction[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) { redirectToLogin('/payment/wallet'); return; }
    const p = parseJwtPayload<{ firstName?: string; name?: string; id?: string; sub?: string; userId?: string }>(token);
    if (p) setName(p.firstName || p.name || 'Usuario');

    const userId = (p?.id || p?.sub || p?.userId || '') as string;
    Promise.allSettled([
      authFetch(`${API_URL}/payments/wallet/${userId}/balance`).then(r => r.ok ? r.json() : null),
      authFetch(`${API_URL}/payments/wallet/${userId}/transactions?limit=10`).then(r => r.ok ? r.json() : null),
    ]).then(([balRes, txRes]) => {
      if (balRes.status === 'fulfilled' && balRes.value) {
        setBalance(balRes.value.balance ?? balRes.value.amount ?? 0);
      } else {
        setBalance(0);
      }
      if (txRes.status === 'fulfilled' && txRes.value) {
        const list = txRes.value.transactions ?? txRes.value.data ?? txRes.value ?? [];
        setTxs(Array.isArray(list) ? list : []);
      }
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard/pasajero"
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            ←
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Going App Wallet</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Saldo */}
        <div className="rounded-3xl p-6 text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg, #0033A0, #001f6b)' }}>
          <p className="text-white/60 text-sm mb-1">Saldo disponible</p>
          {loading ? (
            <div className="h-14 w-36 bg-white/20 rounded-2xl animate-pulse mb-1" />
          ) : (
            <p className="text-5xl font-black mb-1">
              {balance !== null ? `$${balance.toFixed(2)}` : '$0.00'}
            </p>
          )}
          <p className="text-white/50 text-xs">Going App Wallet · {name}</p>
        </div>

        {/* Recargar y Transferir ocultos hasta integrar la pasarela de pago
            (Datafast/DeUna). Por ahora el wallet es de solo consulta. */}
        <div className="grid grid-cols-1 gap-3">
          <a href="#movimientos"
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
            <span className="text-2xl">🧾</span>
            <span className="text-xs font-semibold text-gray-700">Ver historial de movimientos</span>
          </a>
        </div>

        {/* Historial */}
        <div id="movimientos" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 scroll-mt-20">
          <p className="text-sm font-bold text-gray-700 mb-3">Movimientos recientes</p>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded w-16 animate-pulse" />
                </div>
              ))}
            </div>
          ) : txs.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-4xl mb-2">💳</p>
              <p className="text-sm text-gray-500">Aún no tienes movimientos</p>
              <p className="text-xs text-gray-400 mt-1">Recarga tu wallet para comenzar</p>
            </div>
          ) : (
            <div className="space-y-1">
              {txs.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-700">{tx.description}</p>
                    <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString('es-EC')}</p>
                  </div>
                  <span className={`text-sm font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.type === 'credit' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Link href="/ride"
          className="block w-full py-4 rounded-2xl text-center font-bold text-white text-sm transition-all hover:opacity-90"
          style={{ backgroundColor: '#ff4c41' }}>
          🚗 Pagar mi próximo viaje con Wallet
        </Link>
      </div>
    </div>
  );
}
