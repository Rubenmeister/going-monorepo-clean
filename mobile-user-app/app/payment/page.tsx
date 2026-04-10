'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ─── Payment Screen ──────────────────────────────────────────────────────────
// Conecta con el payment-service backend.
// Métodos: Datafast (tarjeta), DeUna (Banco Pichincha), Efectivo
//
// Parámetros de URL:
//   ?amount=8.00&bookingId=G-2024-X1&description=Terminal+Quitumbe+→+Baños
//
// Backend: POST /api/payments/intent
//   → { redirectUrl } para Datafast y DeUna (redirige al SDK de pago)
//   → Al retornar: /payment/result?status=success|failed&bookingId=...
// ────────────────────────────────────────────────────────────────────────────

type Method = 'datafast' | 'deuna' | 'cash';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.goingec.com';

export default function PaymentPage() {
  const router = useRouter();
  const params = useSearchParams();

  const amount      = parseFloat(params.get('amount') ?? '8.00');
  const bookingId   = params.get('bookingId') ?? 'G-2024-X1';
  const description = params.get('description') ?? 'Terminal Quitumbe → Centro de Baños';

  const [method, setMethod]   = useState<Method>('datafast');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const pay = async () => {
    setLoading(true);
    setError('');

    if (method === 'cash') {
      // Efectivo: confirmar y pasar directo al boarding pass
      router.push(`/confirm?bookingId=${bookingId}&amount=${amount}&method=cash`);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/payments/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // centavos
          currency: 'USD',
          provider: method,
          referenceId: bookingId,
        }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();

      const redirectUrl: string = data?.redirectUrl ?? data?.clientSecret;
      if (!redirectUrl) throw new Error('No se recibió URL de pago.');

      // Redirigir al SDK de Datafast / DeUna en el browser
      window.location.href = redirectUrl;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Intenta de nuevo.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080a0e] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 pt-12 pb-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95"
        >
          <span className="text-lg">←</span>
        </button>
        <div>
          <h1 className="text-[18px] font-black">Pago Seguro</h1>
          <p className="text-[12px] text-white/40">Going protege tu transacción</p>
        </div>
        <div className="ml-auto text-xl">🔒</div>
      </div>

      <div className="flex-1 px-5 overflow-y-auto pb-10">
        {/* Amount card */}
        <div className="rounded-3xl p-6 mb-6 text-center" style={{
          background: 'linear-gradient(135deg, #011627 0%, #0a2540 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div className="text-[13px] text-white/50 font-bold uppercase tracking-wide mb-2">Total a pagar</div>
          <div className="text-[46px] font-black text-white leading-none mb-2">${amount.toFixed(2)}</div>
          <div className="text-[13px] text-white/40">{description}</div>
          <div className="mt-3 text-[11px] text-white/25">Ref: {bookingId}</div>
        </div>

        {/* Method selector */}
        <div className="text-[11px] font-black tracking-[2px] text-white/30 uppercase mb-3">Método de pago</div>
        <div className="space-y-3 mb-6">
          <MethodCard
            id="datafast"
            selected={method}
            onSelect={setMethod}
            icon="💳"
            iconBg="#1a3a6b"
            name="Tarjeta de crédito / débito"
            desc="Visa · Mastercard · Diners · American Express"
            badge="Datafast Ecuador"
          />
          <MethodCard
            id="deuna"
            selected={method}
            onSelect={setMethod}
            icon="🏦"
            iconBg="#e63946"
            name="De Una · Banco Pichincha"
            desc="Transferencia bancaria instantánea"
            badge="DeUna"
          />
          <MethodCard
            id="cash"
            selected={method}
            onSelect={setMethod}
            icon="💵"
            iconBg="#059669"
            name="Efectivo"
            desc="Pago directo al conductor al llegar"
          />
        </div>

        {/* Selected method info */}
        {method === 'datafast' && (
          <div className="bg-blue-900/10 border border-blue-500/15 rounded-2xl p-4 mb-4">
            <div className="text-[12px] text-blue-300/80 leading-relaxed">
              Serás redirigido al portal seguro de <strong>Datafast</strong> para ingresar tu tarjeta. Going nunca almacena tus datos.
            </div>
          </div>
        )}
        {method === 'deuna' && (
          <div className="bg-red-900/10 border border-red-500/15 rounded-2xl p-4 mb-4">
            <div className="text-[12px] text-red-300/80 leading-relaxed">
              Pago mediante <strong>Banco Pichincha</strong>. Necesitas tener DeUna activo en tu cuenta Pichincha.
            </div>
          </div>
        )}
        {method === 'cash' && (
          <div className="bg-green-900/10 border border-green-500/15 rounded-2xl p-4 mb-4">
            <div className="text-[12px] text-green-300/80 leading-relaxed">
              Paga <strong>${amount.toFixed(2)}</strong> directamente a tu conductor al finalizar el viaje. Lleva el monto exacto.
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/25 rounded-2xl p-4 mb-4">
            <div className="text-[13px] text-red-400">⚠️ {error}</div>
          </div>
        )}

        {/* Going Rewards notice */}
        <div className="bg-[#ff4c41]/8 border border-[#ff4c41]/15 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">🎁</span>
          <div>
            <div className="text-[13px] font-black text-[#ff4c41]">Ganarás +{Math.round(amount * 10)} Rewards</div>
            <div className="text-[11px] text-white/30">Se acreditan al completar el viaje</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-10 pt-2">
        <button
          onClick={pay}
          disabled={loading}
          className={`w-full py-4 rounded-2xl font-black text-[17px] transition-all active:scale-98 flex items-center justify-center gap-2 ${
            loading
              ? 'bg-white/10 text-white/30'
              : 'bg-[#ff4c41] text-white shadow-lg shadow-red-900/40'
          }`}
        >
          {loading ? (
            <span className="animate-spin text-2xl">⟳</span>
          ) : (
            <>
              <span>🔒</span>
              <span>
                {method === 'cash'
                  ? 'Confirmar · Pago en efectivo'
                  : method === 'deuna'
                  ? `Transferir $${amount.toFixed(2)} · De Una`
                  : `Pagar $${amount.toFixed(2)}`}
              </span>
            </>
          )}
        </button>
        <p className="text-center text-[11px] text-white/20 mt-3">
          Pagos encriptados con TLS · Going nunca almacena tu tarjeta
        </p>
      </div>
    </div>
  );
}

// ─── MethodCard ───────────────────────────────────────────────────────────────
function MethodCard({
  id, selected, onSelect, icon, iconBg, name, desc, badge,
}: {
  id: Method; selected: Method; onSelect: (m: Method) => void;
  icon: string; iconBg: string; name: string; desc: string; badge?: string;
}) {
  const isSelected = selected === id;
  return (
    <button
      onClick={() => onSelect(id)}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left active:scale-98 ${
        isSelected
          ? 'bg-white/5 border-[#ff4c41]/60 shadow-sm shadow-red-900/20'
          : 'bg-[#0d1117] border-white/8 hover:border-white/15'
      }`}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0" style={{ backgroundColor: iconBg }}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[14px] font-black text-white">{name}</div>
        <div className="text-[12px] text-white/40 mt-0.5">{desc}</div>
        {badge && (
          <div className="inline-block mt-1 px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/30 font-bold">{badge}</div>
        )}
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        isSelected ? 'border-[#ff4c41]' : 'border-white/20'
      }`}>
        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#ff4c41]" />}
      </div>
    </button>
  );
}
