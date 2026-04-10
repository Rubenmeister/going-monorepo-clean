'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ─── Package Tracking — Envíos ────────────────────────────────────────────────
// Seguimiento en tiempo real del paquete.
// Parámetro URL: ?trackingCode=GE-2024-PKG-001
// Conecta con tracking-service via WebSocket o polling.
// ─────────────────────────────────────────────────────────────────────────────

type PackageStatus = 'pending' | 'picked_up' | 'in_transit' | 'nearby' | 'delivered';

interface TrackingEvent {
  time: string;
  label: string;
  detail: string;
  done: boolean;
}

const STATUS_STEPS: { key: PackageStatus; label: string; icon: string }[] = [
  { key: 'pending',     label: 'Recibido',        icon: '📦' },
  { key: 'picked_up',  label: 'Recogido',         icon: '🛻' },
  { key: 'in_transit', label: 'En camino',        icon: '🛣️' },
  { key: 'nearby',     label: 'Cerca del destino',icon: '📍' },
  { key: 'delivered',  label: 'Entregado',        icon: '✅' },
];

// Datos de demo — en producción vienen de GET /api/parcels/:trackingCode
const DEMO: {
  trackingCode: string;
  status: PackageStatus;
  eta: string;
  progress: number;
  sender: { name: string; city: string };
  recipient: { name: string; city: string; address: string };
  driver: { name: string; phone: string; proxyPhone: string; rating: number };
  vehicle: { plate: string; model: string };
  description: string;
  weight: string;
  events: TrackingEvent[];
} = {
  trackingCode: 'GE-2024-PKG-001',
  status: 'in_transit',
  eta: '14:30',
  progress: 55,
  sender:    { name: 'Ruben M.',      city: 'Quito' },
  recipient: { name: 'María López',   city: 'Baños', address: 'Av. Amazonas 412, Baños' },
  driver:    { name: 'Luis Paredes',  phone: '+593987654321', proxyPhone: '+1 (555) 099-1234', rating: 4.88 },
  vehicle:   { plate: 'GBR-2241',    model: 'Toyota RAV4' },
  description: 'Documentos importantes + artículos electrónicos',
  weight: '2.3 kg',
  events: [
    { time: '08:15', label: 'Paquete registrado', detail: 'Quito, Terminal Sur', done: true },
    { time: '09:02', label: 'Recogido por el conductor', detail: 'Luis Paredes — GBR-2241', done: true },
    { time: '09:45', label: 'En ruta hacia Baños', detail: 'Via Pelileo · 182 km', done: true },
    { time: '12:00', label: 'Punto de control Ambato', detail: 'Autopista E35', done: false },
    { time: '14:30', label: 'Entrega estimada', detail: 'Av. Amazonas 412, Baños', done: false },
  ],
};

const statusIndex = (s: PackageStatus) => STATUS_STEPS.findIndex(x => x.key === s);

export default function EnviosTrackingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const trackingCode = params.get('trackingCode') ?? DEMO.trackingCode;

  const [data] = useState(DEMO);
  const [elapsed, setElapsed] = useState(0);

  // Simular actualización cada 30s
  useEffect(() => {
    const t = setInterval(() => setElapsed(p => p + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const currentStep = statusIndex(data.status);
  const isDelivered = data.status === 'delivered';

  return (
    <div className="min-h-screen bg-[#080a0e] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 pt-12 pb-4">
        <button onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95">
          <span className="text-lg">←</span>
        </button>
        <div>
          <h1 className="text-[18px] font-black">Seguimiento</h1>
          <p className="text-[12px] text-white/40 font-mono">{trackingCode}</p>
        </div>
        <div className={`ml-auto px-3 py-1 rounded-full text-[11px] font-black border ${
          isDelivered
            ? 'bg-green-500/15 border-green-500/20 text-green-400'
            : 'bg-[#ff4c41]/15 border-[#ff4c41]/20 text-[#ff4c41]'
        }`}>
          {isDelivered ? '✅ ENTREGADO' : '● EN CAMINO'}
        </div>
      </div>

      <div className="flex-1 px-5 overflow-y-auto pb-10">
        {/* Map placeholder with progress */}
        <div className="bg-[#0d1117] border border-white/8 rounded-3xl overflow-hidden mb-4">
          <div className="relative h-[160px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #011627 0%, #0a2540 100%)' }}>
            {/* Animated route line */}
            <div className="absolute inset-0 flex items-center px-8">
              <div className="flex-1 relative">
                <div className="h-1 bg-white/10 rounded-full" />
                <div className="h-1 bg-[#ff4c41] rounded-full absolute top-0 left-0 transition-all duration-1000"
                  style={{ width: `${data.progress}%` }} />
                {/* Truck icon on progress */}
                <div className="absolute -top-4 transition-all duration-1000"
                  style={{ left: `calc(${data.progress}% - 16px)` }}>
                  <div className="text-2xl animate-bounce" style={{ animationDuration: '2s' }}>🛻</div>
                </div>
                {/* Origin */}
                <div className="absolute -bottom-6 left-0 text-[10px] text-white/40 font-bold">{data.sender.city}</div>
                {/* Destination */}
                <div className="absolute -bottom-6 right-0 text-[10px] text-white/40 font-bold">{data.recipient.city}</div>
              </div>
            </div>
            {/* ETA badge */}
            <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/10">
              <div className="text-[10px] text-white/40 font-bold">ETA estimada</div>
              <div className="text-[16px] font-black text-white">{data.eta}</div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="px-5 py-3 flex items-center gap-3">
            <span className="text-[12px] text-white/30 font-bold">0%</span>
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#ff4c41] to-[#ff8c41] rounded-full transition-all"
                style={{ width: `${data.progress}%` }} />
            </div>
            <span className="text-[12px] text-[#ff4c41] font-black">{data.progress}%</span>
          </div>
        </div>

        {/* Status timeline */}
        <div className="bg-[#0d1117] border border-white/8 rounded-3xl p-5 mb-4">
          <div className="text-[11px] font-black tracking-[2px] text-white/30 uppercase mb-4">Estado del paquete</div>
          <div className="flex justify-between relative">
            {/* Connecting line */}
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-white/8" />
            <div className="absolute top-5 left-5 h-0.5 bg-[#ff4c41] transition-all"
              style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%`, right: 'auto' }} />

            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={step.key} className="flex flex-col items-center gap-2 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[18px] border-2 transition-all ${
                    active ? 'border-[#ff4c41] bg-[#ff4c41]/15 scale-110' :
                    done   ? 'border-[#ff4c41] bg-[#ff4c41]/8' :
                             'border-white/10 bg-[#0d1117]'
                  }`}>
                    {step.icon}
                  </div>
                  <div className={`text-[9px] font-black text-center leading-tight ${done ? 'text-white/70' : 'text-white/20'}`}>
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Package info */}
        <div className="bg-[#0d1117] border border-white/8 rounded-3xl p-5 mb-4">
          <div className="text-[11px] font-black tracking-[2px] text-white/30 uppercase mb-4">Detalles del envío</div>
          <div className="space-y-3">
            <InfoRow icon="📦" label="Contenido" value={data.description} />
            <InfoRow icon="⚖️" label="Peso" value={data.weight} />
            <InfoRow icon="👤" label="Remitente" value={`${data.sender.name} · ${data.sender.city}`} />
            <InfoRow icon="🏠" label="Destinatario" value={`${data.recipient.name}`} />
            <InfoRow icon="📍" label="Dirección entrega" value={data.recipient.address} />
          </div>
        </div>

        {/* Driver card */}
        <div className="bg-[#0d1117] border border-white/8 rounded-3xl p-5 mb-4">
          <div className="text-[11px] font-black tracking-[2px] text-white/30 uppercase mb-4">Conductor asignado</div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff4c41] to-[#011627] flex items-center justify-center">
              <span className="text-xl">👨</span>
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-black text-white">{data.driver.name}</div>
              <div className="text-[12px] text-white/40">{data.driver.rating} ★ · {data.vehicle.model} · {data.vehicle.plate}</div>
            </div>
            <div className="flex gap-2">
              {/* Llamada via número proxy Twilio */}
              <a href={`tel:${data.driver.proxyPhone.replace(/\s/g,'')}`}
                title={`Llamar al conductor (número seguro Going)\n${data.driver.proxyPhone}`}
                className="w-10 h-10 rounded-full bg-[#ff4c41]/10 border border-[#ff4c41]/25 flex items-center justify-center text-lg active:scale-95">
                📞
              </a>
              <a href={`https://wa.me/${data.driver.phone.replace(/[^0-9]/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-lg active:scale-95">
                💬
              </a>
            </div>
          </div>
          <div className="bg-white/4 rounded-xl px-4 py-2">
            <span className="text-[11px] text-white/30">🔒 Número enmascarado · Twilio Proxy — tu número real permanece privado</span>
          </div>
        </div>

        {/* Timeline events */}
        <div className="bg-[#0d1117] border border-white/8 rounded-3xl p-5 mb-4">
          <div className="text-[11px] font-black tracking-[2px] text-white/30 uppercase mb-4">Historial de eventos</div>
          <div className="space-y-4">
            {data.events.map((ev, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${ev.done ? 'bg-[#ff4c41] border-[#ff4c41]' : 'bg-transparent border-white/20'}`} />
                  {i < data.events.length - 1 && (
                    <div className={`w-0.5 flex-1 mt-1 ${ev.done ? 'bg-[#ff4c41]/30' : 'bg-white/8'}`} />
                  )}
                </div>
                <div className={`pb-4 ${ev.done ? '' : 'opacity-40'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-black text-white">{ev.label}</span>
                    <span className="text-[10px] text-white/30 font-mono">{ev.time}</span>
                  </div>
                  <div className="text-[12px] text-white/40 mt-0.5">{ev.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Share tracking */}
      <div className="px-5 pb-10 pt-3 border-t border-white/5">
        <button className="w-full py-3.5 rounded-2xl font-black text-[14px] bg-white/5 text-white/60 active:scale-98 transition-all">
          📤 Compartir seguimiento con destinatario
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[16px] mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <div className="text-[10px] text-white/30 font-black uppercase tracking-wide">{label}</div>
        <div className="text-[13px] text-white font-bold">{value}</div>
      </div>
    </div>
  );
}
