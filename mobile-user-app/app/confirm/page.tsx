'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ─── Trip Confirmation — QR Boarding Pass ────────────────────────────────────
// Ticket de abordaje digital con código QR.
// El conductor escanea este QR al momento de subir al vehículo.
// ────────────────────────────────────────────────────────────────────────────

const BOOKING_CODE = 'G-2024-X1';
const SECURITY_PIN = '4829';

// Simple inline QR-like grid for visual representation
function QRGrid() {
  // 9x9 pattern — purely decorative aesthetic
  const pattern = [
    [1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0],
    [1,0,1,1,1,0,1,0,1],
    [1,0,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,0],
    [1,1,1,1,1,1,1,0,1],
    [0,0,0,0,0,0,0,0,0],
    [1,0,1,0,1,1,0,1,0],
    [0,1,0,1,0,1,0,0,1],
  ];
  return (
    <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(9, 1fr)', width: 120, height: 120 }}>
      {pattern.flat().map((cell, i) => (
        <div key={i} className={`rounded-[2px] ${cell ? 'bg-[#011627]' : 'bg-transparent'}`} />
      ))}
    </div>
  );
}

export default function ConfirmPage() {
  const router = useRouter();
  const [pinVisible, setPinVisible] = useState(false);

  return (
    <div className="min-h-screen bg-[#080a0e] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 pt-12 pb-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95"
        >
          <span className="text-white text-lg">←</span>
        </button>
        <div>
          <h1 className="text-[18px] font-black text-white">Tu reservación</h1>
          <p className="text-[12px] text-white/40">Confirmada · {BOOKING_CODE}</p>
        </div>
        <div className="ml-auto">
          <div className="px-3 py-1 rounded-full bg-green-500/15 border border-green-500/20">
            <span className="text-[11px] text-green-400 font-black">● CONFIRMADO</span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 overflow-y-auto pb-10">

        {/* BOARDING PASS TICKET */}
        <div className="relative mb-5">
          {/* Main ticket body */}
          <div className="bg-[#011627] rounded-3xl overflow-hidden">
            {/* Top: route header */}
            <div className="bg-[#ff4c41] px-6 py-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] font-black tracking-[2px] text-white/70 uppercase">Going Ecuador</div>
                <div className="text-[11px] font-black tracking-[2px] text-white/70 uppercase">Pase de Abordar</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-[22px] font-black text-white leading-tight">Terminal<br />Quitumbe</div>
                  <div className="text-[11px] text-white/60 font-bold mt-1">Quito, Ecuador</div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="text-2xl">→</div>
                  <div className="text-[10px] text-white/60">182 km</div>
                </div>
                <div className="flex-1 text-right">
                  <div className="text-[22px] font-black text-white leading-tight">Centro de<br />Baños</div>
                  <div className="text-[11px] text-white/60 font-bold mt-1">Tungurahua, EC</div>
                </div>
              </div>
            </div>

            {/* Dashed perforated separator */}
            <div className="relative py-0">
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-[#080a0e] -ml-3" />
                <div className="flex-1 border-t-2 border-dashed border-white/10" />
                <div className="w-6 h-6 rounded-full bg-[#080a0e] -mr-3" />
              </div>
            </div>

            {/* Middle: QR + trip details */}
            <div className="px-6 py-5 flex gap-5 items-start">
              {/* QR Code */}
              <div className="bg-white rounded-2xl p-3 flex-shrink-0">
                <QRGrid />
                <div className="text-center mt-2">
                  <span className="text-[9px] font-black text-[#011627] tracking-widest">{BOOKING_CODE}</span>
                </div>
              </div>

              {/* Trip details */}
              <div className="flex-1 space-y-3">
                <InfoRow icon="📅" label="Fecha" value="Sáb, 12 Abr 2026" />
                <InfoRow icon="🕐" label="Salida" value="07:30 AM" />
                <InfoRow icon="⏱️" label="Duración" value="3h 20min" />
                <InfoRow icon="💺" label="Asiento" value="Der. fila trasera" />
                <InfoRow icon="🚗" label="Vehículo" value="Toyota RAV4 · PBK-3847" />
              </div>
            </div>

            {/* Dashed perforated separator */}
            <div className="relative">
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-[#080a0e] -ml-3" />
                <div className="flex-1 border-t-2 border-dashed border-white/10" />
                <div className="w-6 h-6 rounded-full bg-[#080a0e] -mr-3" />
              </div>
            </div>

            {/* Bottom: PIN de seguridad */}
            <div className="px-6 py-5">
              <div className="text-[11px] font-black tracking-[2px] text-white/30 uppercase mb-3">PIN de Seguridad</div>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {(pinVisible ? SECURITY_PIN : '••••').split('').map((c, i) => (
                    <div key={i} className="w-11 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <span className="text-[20px] font-black text-[#ff4c41]">{c}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setPinVisible(p => !p)}
                  className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center ml-auto"
                >
                  <span className="text-[16px]">{pinVisible ? '🙈' : '👁️'}</span>
                </button>
              </div>
              <p className="text-[11px] text-white/30 mt-2 leading-relaxed">
                Muestra este PIN a tu conductor antes de abordar. No compartas este código con nadie más.
              </p>
            </div>
          </div>
        </div>

        {/* Driver info */}
        <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-4 mb-4">
          <div className="text-[11px] font-black tracking-[2px] text-white/30 uppercase mb-3">Tu Conductor</div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff4c41] to-[#011627] flex items-center justify-center">
                <span className="text-[20px]">👨</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-[#0d1117] flex items-center justify-center">
                <span className="text-[8px]">✓</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-black text-white">Carlos Mendoza</div>
              <div className="text-[12px] text-white/40">4.92 ★ · 847 viajes · Verificado</div>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center">
                <span className="text-[16px]">📞</span>
              </button>
              <button className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center">
                <span className="text-[16px]">💬</span>
              </button>
            </div>
          </div>
        </div>

        {/* Companions */}
        <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-4 mb-4">
          <div className="text-[11px] font-black tracking-[2px] text-white/30 uppercase mb-3">Viajeros en este viaje</div>
          <div className="flex gap-3">
            {['Ana', 'Miguel', 'Tú'].map((name, i) => (
              <div key={name} className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[16px] ${i === 2 ? 'bg-[#ff4c41]' : 'bg-white/8'}`}>
                  {i === 2 ? '🙋' : ['👩', '👨'][i]}
                </div>
                <span className="text-[10px] text-white/40 font-bold">{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment summary */}
        <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-4 mb-6">
          <div className="text-[11px] font-black tracking-[2px] text-white/30 uppercase mb-3">Resumen de pago</div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[13px] text-white/50">Tarifa base</span>
              <span className="text-[13px] text-white font-bold">$8.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[13px] text-white/50">Going Rewards aplicados</span>
              <span className="text-[13px] text-green-400 font-bold">-$0.50</span>
            </div>
            <div className="h-px bg-white/5 my-1" />
            <div className="flex justify-between">
              <span className="text-[14px] font-black text-white">Total pagado</span>
              <span className="text-[16px] font-black text-[#ff4c41]">$7.50</span>
            </div>
            <div className="text-[11px] text-white/30">Visa ···· 4242</div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-5 pb-10 pt-2 space-y-3">
        <button
          onClick={() => router.push('/live')}
          className="w-full py-4 rounded-2xl font-black text-[16px] bg-[#ff4c41] text-white shadow-lg shadow-red-900/40 active:scale-98 transition-all"
        >
          Seguir viaje en tiempo real →
        </button>
        <button className="w-full py-3 rounded-2xl font-bold text-[14px] bg-white/5 text-white/50">
          Compartir pase de abordar
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[14px] w-5 flex-shrink-0">{icon}</span>
      <div>
        <div className="text-[10px] text-white/30 font-bold uppercase tracking-wide">{label}</div>
        <div className="text-[13px] text-white font-bold">{value}</div>
      </div>
    </div>
  );
}
