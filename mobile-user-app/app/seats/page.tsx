'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ─── Seat Selection ─────────────────────────────────────────────────────────
// Permite elegir asiento antes de confirmar el viaje.
// Tipo: Regular (4 asientos) o XL (6 asientos)
// Asiento del copiloto: +$3 (vista panorámica)
// ────────────────────────────────────────────────────────────────────────────

type SeatId = 'front' | 'rl' | 'rc' | 'rr' | 'xrl' | 'xrr' | 'xbl' | 'xbr';
type VehicleType = 'regular' | 'xl';

interface Seat {
  id: SeatId;
  label: string;
  premium?: boolean;
  premiumExtra?: number;
}

const SEATS_REGULAR: Seat[] = [
  { id: 'front', label: 'Copiloto', premium: true, premiumExtra: 3 },
  { id: 'rl', label: 'Izq.' },
  { id: 'rc', label: 'Centro' },
  { id: 'rr', label: 'Der.' },
];

const SEATS_XL: Seat[] = [
  { id: 'front', label: 'Copiloto', premium: true, premiumExtra: 3 },
  { id: 'rl', label: 'Fila 2 Izq.' },
  { id: 'rr', label: 'Fila 2 Der.' },
  { id: 'xrl', label: 'Fila 3 Izq.' },
  { id: 'xrr', label: 'Fila 3 Der.' },
];

const OCCUPIED: SeatId[] = ['rc'];

const BASE_PRICE = 8.0;

export default function SeatsPage() {
  const router = useRouter();
  const [vehicleType, setVehicleType] = useState<VehicleType>('regular');
  const [selected, setSelected] = useState<SeatId | null>(null);

  const seats = vehicleType === 'regular' ? SEATS_REGULAR : SEATS_XL;
  const selectedSeat = seats.find(s => s.id === selected);
  const total = BASE_PRICE + (selectedSeat?.premiumExtra ?? 0);

  const toggle = (id: SeatId) => {
    if (OCCUPIED.includes(id)) return;
    setSelected(prev => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-[#080a0e] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 pt-12 pb-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-transform"
        >
          <span className="text-white text-lg">←</span>
        </button>
        <div>
          <h1 className="text-[18px] font-black text-white">Elige tu asiento</h1>
          <p className="text-[12px] text-white/40">Terminal Quitumbe → Centro de Baños</p>
        </div>
      </div>

      {/* Vehicle type tabs */}
      <div className="px-5 mb-6">
        <div className="bg-white/5 rounded-2xl p-1 flex gap-1">
          {(['regular', 'xl'] as VehicleType[]).map(type => (
            <button
              key={type}
              onClick={() => { setVehicleType(type); setSelected(null); }}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-black transition-all ${
                vehicleType === type
                  ? 'bg-[#ff4c41] text-white shadow-lg shadow-red-900/40'
                  : 'text-white/40'
              }`}
            >
              {type === 'regular' ? '🚗 SUV Regular' : '🚙 SUV XL'}
            </button>
          ))}
        </div>
      </div>

      {/* Car diagram */}
      <div className="flex-1 px-5">
        <div className="bg-[#0d1117] border border-white/8 rounded-3xl p-6 mb-4">
          {/* Car top illustration */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Car body */}
              <div className="w-[160px] h-[260px] bg-white/5 rounded-[40px] border border-white/10 relative flex flex-col items-center justify-start pt-4">
                {/* Windshield */}
                <div className="w-[110px] h-[50px] bg-white/8 rounded-t-[30px] rounded-b-lg border border-white/10 mb-3" />

                {/* Driver position (fixed, not selectable) */}
                <div className="w-full px-4 mb-2">
                  <div className="flex justify-between items-center">
                    {/* Steering wheel side */}
                    <div className="w-[52px] h-[48px] rounded-xl bg-[#011627]/80 border border-white/10 flex flex-col items-center justify-center gap-0.5">
                      <span className="text-[18px]">🚗</span>
                      <span className="text-[9px] text-white/30 font-bold">Driver</span>
                    </div>

                    {/* Front passenger / copiloto */}
                    <SeatButton
                      seat={seats.find(s => s.id === 'front')!}
                      isSelected={selected === 'front'}
                      isOccupied={OCCUPIED.includes('front')}
                      onToggle={toggle}
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="w-full px-4 mb-2">
                  <div className="h-px bg-white/5" />
                </div>

                {/* Rear seats */}
                {vehicleType === 'regular' ? (
                  <div className="w-full px-3">
                    <div className="flex gap-2 justify-center">
                      {(['rl', 'rc', 'rr'] as SeatId[]).map(id => {
                        const seat = seats.find(s => s.id === id);
                        if (!seat) return null;
                        return (
                          <SeatButton
                            key={id}
                            seat={seat}
                            isSelected={selected === id}
                            isOccupied={OCCUPIED.includes(id)}
                            onToggle={toggle}
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="w-full px-3 space-y-2">
                    <div className="flex gap-2 justify-center">
                      {(['rl', 'rr'] as SeatId[]).map(id => {
                        const seat = seats.find(s => s.id === id);
                        if (!seat) return null;
                        return (
                          <SeatButton key={id} seat={seat} isSelected={selected === id} isOccupied={OCCUPIED.includes(id)} onToggle={toggle} />
                        );
                      })}
                    </div>
                    <div className="flex gap-2 justify-center">
                      {(['xrl', 'xrr'] as SeatId[]).map(id => {
                        const seat = seats.find(s => s.id === id);
                        if (!seat) return null;
                        return (
                          <SeatButton key={id} seat={seat} isSelected={selected === id} isOccupied={OCCUPIED.includes(id)} onToggle={toggle} />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Rear window */}
                <div className="mt-auto w-[110px] h-[40px] bg-white/8 rounded-b-[30px] rounded-t-lg border border-white/10 mb-1" />
              </div>

              {/* Wheels */}
              <div className="absolute -left-3 top-8 w-3 h-16 bg-white/10 rounded-l-full" />
              <div className="absolute -right-3 top-8 w-3 h-16 bg-white/10 rounded-r-full" />
              <div className="absolute -left-3 bottom-8 w-3 h-16 bg-white/10 rounded-l-full" />
              <div className="absolute -right-3 bottom-8 w-3 h-16 bg-white/10 rounded-r-full" />
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#ff4c41]" />
              <span className="text-[11px] text-white/40">Seleccionado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-white/8 border border-white/15" />
              <span className="text-[11px] text-white/40">Disponible</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-white/4" />
              <span className="text-[11px] text-white/20">Ocupado</span>
            </div>
          </div>
        </div>

        {/* Selected seat info */}
        {selected && selectedSeat && (
          <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ff4c41]/15 flex items-center justify-center">
              <span className="text-lg">💺</span>
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-black text-white">{selectedSeat.label}</div>
              {selectedSeat.premium && (
                <div className="text-[11px] text-[#ff4c41] font-bold">Vista panorámica · Premium +${selectedSeat.premiumExtra}</div>
              )}
            </div>
            <div className="text-[16px] font-black text-[#ff4c41]">${total.toFixed(2)}</div>
          </div>
        )}
      </div>

      {/* Price summary + CTA */}
      <div className="px-5 pb-10 pt-2">
        <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[13px] text-white/50">Tarifa base</span>
            <span className="text-[13px] text-white font-bold">${BASE_PRICE.toFixed(2)}</span>
          </div>
          {selectedSeat?.premiumExtra ? (
            <div className="flex justify-between items-center mb-2">
              <span className="text-[13px] text-white/50">Asiento copiloto</span>
              <span className="text-[13px] text-[#ff4c41] font-bold">+${selectedSeat.premiumExtra.toFixed(2)}</span>
            </div>
          ) : null}
          <div className="h-px bg-white/5 my-2" />
          <div className="flex justify-between items-center">
            <span className="text-[14px] font-black text-white">Total</span>
            <span className="text-[20px] font-black text-[#ff4c41]">${total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={() => selected && router.push('/confirm')}
          className={`w-full py-4 rounded-2xl font-black text-[16px] transition-all active:scale-98 ${
            selected
              ? 'bg-[#ff4c41] text-white shadow-lg shadow-red-900/40 hover:bg-[#e03d32]'
              : 'bg-white/5 text-white/20 cursor-not-allowed'
          }`}
        >
          {selected ? `Confirmar asiento → $${total.toFixed(2)}` : 'Selecciona un asiento'}
        </button>
      </div>
    </div>
  );
}

// ─── Sub-component: SeatButton ───────────────────────────────────────────────
function SeatButton({
  seat,
  isSelected,
  isOccupied,
  onToggle,
}: {
  seat: Seat;
  isSelected: boolean;
  isOccupied: boolean;
  onToggle: (id: SeatId) => void;
}) {
  return (
    <button
      onClick={() => onToggle(seat.id)}
      disabled={isOccupied}
      className={`w-[52px] h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
        isOccupied
          ? 'bg-white/4 border border-white/5 cursor-not-allowed'
          : isSelected
          ? 'bg-[#ff4c41] border border-[#ff4c41] shadow-lg shadow-red-900/40'
          : 'bg-white/8 border border-white/15 hover:border-[#ff4c41]/40'
      }`}
    >
      <span className="text-[16px]">{isOccupied ? '🚫' : isSelected ? '✅' : '💺'}</span>
      <span className={`text-[8px] font-black leading-tight text-center ${isOccupied ? 'text-white/15' : isSelected ? 'text-white' : 'text-white/40'}`}>
        {seat.label}{seat.premiumExtra ? '\n+$3' : ''}
      </span>
    </button>
  );
}
