'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

function parseJwt(token: string) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch { return null; }
}

export default function WalletPage() {
  const [balance] = useState<number | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { window.location.href = '/auth/login?from=/payment/wallet'; return; }
    const p = parseJwt(token);
    if (p) setName(p.firstName || 'Usuario');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard/pasajero"
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            ←
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Going Wallet</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Saldo */}
        <div className="rounded-3xl p-6 text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg, #0033A0, #001f6b)' }}>
          <p className="text-white/60 text-sm mb-1">Saldo disponible</p>
          <p className="text-5xl font-black mb-1">
            {balance !== null ? `$${balance.toFixed(2)}` : '$0.00'}
          </p>
          <p className="text-white/50 text-xs">Going Wallet · {name}</p>
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '➕', label: 'Recargar', desc: 'Agrega saldo a tu wallet' },
            { icon: '💸', label: 'Transferir', desc: 'Envía saldo a otro usuario' },
          ].map(a => (
            <button key={a.label}
              className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-md transition-all">
              <span className="text-2xl">{a.icon}</span>
              <p className="font-bold text-gray-900 mt-2 text-sm">{a.label}</p>
              <p className="text-xs text-gray-400">{a.desc}</p>
            </button>
          ))}
        </div>

        {/* Próximamente */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center">
          <p className="text-3xl mb-2">🚀</p>
          <p className="font-bold text-[#0033A0]">Próximamente</p>
          <p className="text-sm text-gray-400 mt-1">
            Recarga, historial de transacciones y más están en camino.
          </p>
        </div>
      </div>
    </div>
  );
}
