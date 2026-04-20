'use client';

import { useState } from 'react';

type Mode = 'compartido' | 'privado' | 'envio';

const TABS: { key: Mode; label: string; icon: string }[] = [
  { key: 'compartido', label: 'Compartido', icon: '🚍' },
  { key: 'privado',    label: 'Privado',    icon: '🚗' },
  { key: 'envio',      label: 'Envío',      icon: '📦' },
];

const APP_BASE = 'https://app.goingec.com';

export function BookingWidget() {
  const [mode, setMode]           = useState<Mode>('compartido');
  const [origin, setOrigin]       = useState('');
  const [destination, setDest]    = useState('');
  const [date, setDate]           = useState('');
  const [passengers, setPass]     = useState('1');

  function buildUrl(): string {
    if (mode === 'privado') {
      const p = new URLSearchParams({ mode: 'private' });
      if (origin)      p.set('from', origin);
      if (destination) p.set('to', destination);
      if (date)        p.set('date', date);
      return `${APP_BASE}/transport?${p}`;
    }
    if (mode === 'envio') {
      const p = new URLSearchParams();
      if (origin)      p.set('from', origin);
      if (destination) p.set('to', destination);
      if (date)        p.set('date', date);
      return `${APP_BASE}/envios?${p}`;
    }
    // compartido
    const p = new URLSearchParams({ mode: 'shared' });
    if (origin)      p.set('from', origin);
    if (destination) p.set('to', destination);
    if (date)        p.set('date', date);
    if (passengers)  p.set('seats', passengers);
    return `${APP_BASE}/search?${p}`;
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    window.location.href = buildUrl();
  }

  const isEnvio = mode === 'envio';

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white rounded-3xl p-7 shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
    >
      {/* Mode tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setMode(t.key)}
            className={`flex-1 py-2.5 rounded-lg text-[12px] font-black transition-all ${
              mode === t.key
                ? 'bg-white text-[#ff4c41] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Origen */}
      <div className="mb-4">
        <div className="text-[11px] font-black text-gray-400 uppercase tracking-[1px] mb-1.5">
          📍 {isEnvio ? 'Origen del envío' : 'Origen'}
        </div>
        <input
          className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-[#ff4c41] transition-colors"
          placeholder={isEnvio ? '¿Desde dónde envías?' : '¿Desde dónde sales?'}
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        />
      </div>

      {/* Destino */}
      <div className="mb-4">
        <div className="text-[11px] font-black text-gray-400 uppercase tracking-[1px] mb-1.5">
          🏁 {isEnvio ? 'Destino del envío' : 'Destino'}
        </div>
        <input
          className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-[#ff4c41] transition-colors"
          placeholder={isEnvio ? '¿A dónde va el paquete?' : '¿A dónde vas?'}
          value={destination}
          onChange={(e) => setDest(e.target.value)}
        />
      </div>

      {/* Fecha + Pasajeros (pasajeros se oculta en envío) */}
      <div className={`grid gap-3 mb-4 ${isEnvio ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <div>
          <div className="text-[11px] font-black text-gray-400 uppercase tracking-[1px] mb-1.5">
            📅 {isEnvio ? 'Fecha de envío' : 'Fecha'}
          </div>
          <input
            type="date"
            className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-[#ff4c41] transition-colors"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        {!isEnvio && (
          <div>
            <div className="text-[11px] font-black text-gray-400 uppercase tracking-[1px] mb-1.5">
              👥 Pasajeros
            </div>
            <select
              className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-[#ff4c41] transition-colors bg-white"
              value={passengers}
              onChange={(e) => setPass(e.target.value)}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'pasajero' : 'pasajeros'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="block w-full py-3.5 rounded-xl bg-[#ff4c41] text-white text-center font-black text-[15px] shadow-[0_4px_16px_rgba(255,76,65,0.35)] hover:bg-[#e03d32] hover:-translate-y-0.5 transition-all"
      >
        {isEnvio ? 'Cotizar envío →' : 'Buscar viajes →'}
      </button>

      <p className="text-center text-[11px] text-gray-400 font-semibold mt-3">
        🔒 Pago seguro · Sin comisiones ocultas
      </p>
    </form>
  );
}
