'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ─── Viaje Privado — Cotización ──────────────────────────────────────────────
// Todo el vehículo es tuyo. No hay selección de asiento.
// Se elige tipo de SUV, hora de salida, número de pasajeros.
// Precio = base + extras (hora pico, SUV XL)
// ────────────────────────────────────────────────────────────────────────────

type VehicleOption = { id: string; label: string; capacity: number; basePrice: number; icon: string; desc: string };

const VEHICLES: VehicleOption[] = [
  { id: 'suv',    label: 'SUV Regular', capacity: 4, basePrice: 45,  icon: '🚗', desc: 'Toyota RAV4 · Nissan X-Trail' },
  { id: 'suv_xl', label: 'SUV XL',      capacity: 7, basePrice: 65,  icon: '🚙', desc: 'Toyota Fortuner · Ford Expedition' },
  { id: 'van',    label: 'Van',          capacity: 12, basePrice: 90, icon: '🚐', desc: 'Toyota HiAce · Hyundai H1' },
];

const ROUTES = [
  { id: 'qb',  from: 'Quito', to: 'Baños',       km: 182, hours: 3.5 },
  { id: 'qc',  from: 'Quito', to: 'Cuenca',      km: 456, hours: 9   },
  { id: 'qg',  from: 'Quito', to: 'Guayaquil',   km: 410, hours: 8   },
  { id: 'qa',  from: 'Quito', to: 'Ambato',       km: 140, hours: 2.5 },
  { id: 'qot', from: 'Quito', to: 'Otavalo',      km: 94,  hours: 1.8 },
  { id: 'custom', from: '',   to: '',             km: 0,   hours: 0   },
];

const EXTRAS = [
  { id: 'airport',   label: 'Recogida en aeropuerto', price: 5, icon: '✈️' },
  { id: 'luggage',   label: 'Maletero extra grande',  price: 5, icon: '🧳' },
  { id: 'pet',       label: 'Mascota a bordo',        price: 8, icon: '🐾' },
  { id: 'night',     label: 'Viaje nocturno (>10pm)', price: 10, icon: '🌙' },
];

function calcPrice(vehicle: VehicleOption, routeKm: number, selectedExtras: string[]): number {
  const kmFee = routeKm > 0 ? routeKm * 0.12 : 0;
  const extrasFee = EXTRAS.filter(e => selectedExtras.includes(e.id)).reduce((a, e) => a + e.price, 0);
  return Math.round((vehicle.basePrice + kmFee + extrasFee) * 100) / 100;
}

export default function PrivatePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [vehicle, setVehicle] = useState<VehicleOption>(VEHICLES[0]);
  const [routeId, setRouteId] = useState('qb');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [departTime, setDepartTime] = useState('');
  const [pax, setPax] = useState(2);
  const [extras, setExtras] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const route = ROUTES.find(r => r.id === routeId) ?? ROUTES[0];
  const isCustom = routeId === 'custom';
  const total = calcPrice(vehicle, route.km, extras);

  const toggleExtra = (id: string) =>
    setExtras(p => p.includes(id) ? p.filter(e => e !== id) : [...p, id]);

  const handleConfirm = () => {
    const params = new URLSearchParams({
      amount: total.toFixed(2),
      bookingId: `GP-${Date.now().toString(36).toUpperCase()}`,
      description: `Privado: ${isCustom ? customFrom : route.from} → ${isCustom ? customTo : route.to}`,
    });
    router.push(`/payment?${params}`);
  };

  return (
    <div className="min-h-screen bg-[#080a0e] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 pt-12 pb-4">
        <button onClick={() => step > 1 ? setStep(s => (s - 1) as 1|2|3) : router.back()}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95">
          <span className="text-lg">←</span>
        </button>
        <div>
          <h1 className="text-[18px] font-black">Viaje Privado</h1>
          <p className="text-[12px] text-white/40">Todo el vehículo para ti · Paso {step} de 3</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="px-5 mb-5">
        <div className="flex gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s <= step ? 'bg-[#ff4c41]' : 'bg-white/10'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 overflow-y-auto pb-32">

        {/* ── STEP 1: Ruta + Fecha ──────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-[11px] font-black tracking-[2px] text-white/30 uppercase mb-2">Elige tu ruta</div>
            <div className="space-y-2">
              {ROUTES.filter(r => r.id !== 'custom').map(r => (
                <button key={r.id} onClick={() => setRouteId(r.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                    routeId === r.id ? 'border-[#ff4c41]/60 bg-white/5' : 'border-white/8 bg-[#0d1117]'
                  }`}>
                  <div>
                    <div className="text-[14px] font-black text-white">{r.from} → {r.to}</div>
                    <div className="text-[12px] text-white/40 mt-0.5">{r.km} km · ~{r.hours}h</div>
                  </div>
                  {routeId === r.id && <span className="text-[#ff4c41]">●</span>}
                </button>
              ))}
              <button onClick={() => setRouteId('custom')}
                className={`w-full p-4 rounded-2xl border transition-all text-left ${
                  isCustom ? 'border-[#ff4c41]/60 bg-white/5' : 'border-dashed border-white/15 bg-transparent'
                }`}>
                <div className="text-[13px] font-bold text-white/60">+ Ruta personalizada</div>
              </button>
            </div>

            {isCustom && (
              <div className="space-y-3">
                <input value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                  placeholder="📍 Ciudad de origen"
                  className="w-full bg-[#0d1117] border border-white/10 rounded-2xl px-4 py-3 text-[14px] text-white placeholder-white/25 focus:outline-none focus:border-[#ff4c41]/40" />
                <input value={customTo} onChange={e => setCustomTo(e.target.value)}
                  placeholder="🏁 Ciudad de destino"
                  className="w-full bg-[#0d1117] border border-white/10 rounded-2xl px-4 py-3 text-[14px] text-white placeholder-white/25 focus:outline-none focus:border-[#ff4c41]/40" />
              </div>
            )}

            {/* Fecha y hora */}
            <div className="text-[11px] font-black tracking-[2px] text-white/30 uppercase mt-4 mb-2">Fecha y hora de salida</div>
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={departDate} onChange={e => setDepartDate(e.target.value)}
                className="bg-[#0d1117] border border-white/10 rounded-2xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-[#ff4c41]/40" />
              <input type="time" value={departTime} onChange={e => setDepartTime(e.target.value)}
                className="bg-[#0d1117] border border-white/10 rounded-2xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-[#ff4c41]/40" />
            </div>
          </div>
        )}

        {/* ── STEP 2: Vehículo + Pasajeros ──────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-[11px] font-black tracking-[2px] text-white/30 uppercase mb-2">Tipo de vehículo</div>
            <div className="space-y-3">
              {VEHICLES.map(v => (
                <button key={v.id} onClick={() => setVehicle(v)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                    vehicle.id === v.id ? 'border-[#ff4c41]/60 bg-white/5' : 'border-white/8 bg-[#0d1117]'
                  }`}>
                  <div className="text-3xl">{v.icon}</div>
                  <div className="flex-1">
                    <div className="text-[14px] font-black text-white">{v.label}</div>
                    <div className="text-[12px] text-white/40 mt-0.5">{v.desc} · hasta {v.capacity} personas</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[15px] font-black text-[#ff4c41]">desde ${v.basePrice}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Número de pasajeros */}
            <div className="text-[11px] font-black tracking-[2px] text-white/30 uppercase mt-4 mb-2">Número de pasajeros</div>
            <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-4 flex items-center justify-between">
              <span className="text-[14px] font-bold text-white">Pasajeros</span>
              <div className="flex items-center gap-4">
                <button onClick={() => setPax(p => Math.max(1, p - 1))}
                  className="w-9 h-9 rounded-full bg-white/8 text-white text-xl font-black flex items-center justify-center active:scale-95">−</button>
                <span className="text-[20px] font-black text-white w-6 text-center">{pax}</span>
                <button onClick={() => setPax(p => Math.min(vehicle.capacity, p + 1))}
                  className="w-9 h-9 rounded-full bg-[#ff4c41] text-white text-xl font-black flex items-center justify-center active:scale-95">+</button>
              </div>
            </div>
            {pax > vehicle.capacity && (
              <p className="text-[12px] text-[#ff4c41]">⚠️ Este vehículo tiene capacidad para {vehicle.capacity} personas</p>
            )}
          </div>
        )}

        {/* ── STEP 3: Extras + Resumen ──────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-[11px] font-black tracking-[2px] text-white/30 uppercase mb-2">Servicios adicionales</div>
            <div className="space-y-2">
              {EXTRAS.map(e => (
                <button key={e.id} onClick={() => toggleExtra(e.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                    extras.includes(e.id) ? 'border-[#ff4c41]/60 bg-white/5' : 'border-white/8 bg-[#0d1117]'
                  }`}>
                  <span className="text-xl">{e.icon}</span>
                  <span className="flex-1 text-[14px] font-bold text-white">{e.label}</span>
                  <span className={`text-[13px] font-black ${extras.includes(e.id) ? 'text-[#ff4c41]' : 'text-white/40'}`}>+${e.price}</span>
                </button>
              ))}
            </div>

            {/* Notas especiales */}
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Notas especiales para el conductor (opcional)..."
              className="w-full bg-[#0d1117] border border-white/10 rounded-2xl px-4 py-3 text-[13px] text-white placeholder-white/25 resize-none focus:outline-none focus:border-[#ff4c41]/40 mt-2"
              rows={3} />

            {/* Resumen */}
            <div className="bg-[#0d1117] border border-white/8 rounded-3xl p-5 mt-2">
              <div className="text-[11px] font-black tracking-[2px] text-white/30 uppercase mb-4">Resumen de cotización</div>
              <div className="space-y-2">
                <SummaryRow label="Ruta" value={isCustom ? `${customFrom} → ${customTo}` : `${route.from} → ${route.to}`} />
                <SummaryRow label="Vehículo" value={vehicle.label} />
                <SummaryRow label="Pasajeros" value={`${pax} personas`} />
                <SummaryRow label="Fecha" value={departDate || '—'} />
                <SummaryRow label="Hora" value={departTime || '—'} />
                {extras.length > 0 && (
                  <SummaryRow label="Extras" value={EXTRAS.filter(e => extras.includes(e.id)).map(e => e.label).join(', ')} />
                )}
              </div>
              <div className="h-px bg-white/8 my-4" />
              <div className="flex justify-between items-center">
                <span className="text-[14px] font-black text-white">Total estimado</span>
                <span className="text-[26px] font-black text-[#ff4c41]">${total.toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-white/25 mt-2">Precio final puede variar según disponibilidad y condiciones del viaje.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="px-5 pb-10 pt-3 border-t border-white/5 bg-[#080a0e]">
        {step < 3 ? (
          <button
            onClick={() => setStep(s => (s + 1) as 1|2|3)}
            disabled={step === 1 && !departDate}
            className={`w-full py-4 rounded-2xl font-black text-[16px] transition-all active:scale-98 ${
              step === 1 && !departDate ? 'bg-white/5 text-white/20' : 'bg-[#ff4c41] text-white shadow-lg shadow-red-900/40'
            }`}
          >
            Continuar →
          </button>
        ) : (
          <button onClick={handleConfirm}
            className="w-full py-4 rounded-2xl font-black text-[16px] bg-[#ff4c41] text-white shadow-lg shadow-red-900/40 active:scale-98 transition-all">
            Solicitar viaje · ${total.toFixed(2)} →
          </button>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-[12px] text-white/40 flex-shrink-0">{label}</span>
      <span className="text-[12px] text-white font-bold text-right">{value}</span>
    </div>
  );
}
