'use client';

/**
 * DateTimePicker — selector gráfico de fecha y hora para el flujo de viaje.
 *
 * Reemplaza los <input type="date"> / <input type="time"> nativos (que se
 * podían tipear y eran poco visibles) por:
 *   · un calendario de mes navegable (tap en el día), con atajos Hoy/Mañana
 *   · un selector de hora por franjas (Mañana/Tarde/Noche) en chips tappables
 *
 * Controlado: el padre mantiene `date` ('YYYY-MM-DD') y `time` ('HH:MM').
 */

import { useMemo, useState } from 'react';

const ACCENT = '#0033A0'; // azul del flujo de viaje (consistente con RideRequestForm)

interface Props {
  date: string;            // 'YYYY-MM-DD' | ''
  time: string;            // 'HH:MM' | ''
  minDate?: string;        // 'YYYY-MM-DD' — no se permiten días anteriores
  onChange: (date: string, time: string) => void;
}

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseISO(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** '14:30' → '2:30 PM' para lectura humana. */
function label12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

// Franjas horarias: slots cada 30 min, agrupados.
const TIME_GROUPS: { label: string; from: number; to: number }[] = [
  { label: 'Mañana', from: 5, to: 11 },   // 05:00–11:30
  { label: 'Tarde', from: 12, to: 17 },   // 12:00–17:30
  { label: 'Noche', from: 18, to: 23 },   // 18:00–23:30
];

function slotsFor(group: { from: number; to: number }): string[] {
  const out: string[] = [];
  for (let h = group.from; h <= group.to; h++) {
    out.push(`${String(h).padStart(2, '0')}:00`);
    out.push(`${String(h).padStart(2, '0')}:30`);
  }
  return out;
}

export function DateTimePicker({ date, time, minDate, onChange }: Props) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const min = useMemo(() => parseISO(minDate ?? toISO(today)) ?? today, [minDate, today]);
  const selected = parseISO(date);

  // Mes visible: el del día seleccionado, o el actual.
  const [view, setView] = useState(() => {
    const base = selected ?? today;
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  const tomorrow = useMemo(() => new Date(today.getTime() + 86400000), [today]);

  // Construye la grilla del mes (con huecos iniciales según día de semana, L=0).
  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const startWeekday = (first.getDay() + 6) % 7; // domingo=0 → 6
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(view.year, view.month, d));
    return arr;
  }, [view]);

  const canGoPrev = view.year > min.getFullYear() ||
    (view.year === min.getFullYear() && view.month > min.getMonth());

  const goPrev = () => setView(v => {
    const m = v.month - 1;
    return m < 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: m };
  });
  const goNext = () => setView(v => {
    const m = v.month + 1;
    return m > 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: m };
  });

  const pickDay = (d: Date) => onChange(toISO(d), time);
  const pickQuick = (d: Date) => {
    setView({ year: d.getFullYear(), month: d.getMonth() });
    onChange(toISO(d), time);
  };

  return (
    <div className="space-y-4">
      {/* ── Atajos rápidos ── */}
      <div className="flex gap-2">
        {([
          { label: 'Hoy', value: today },
          { label: 'Mañana', value: tomorrow },
        ] as const).map(opt => {
          const active = date === toISO(opt.value);
          return (
            <button key={opt.label} type="button" onClick={() => pickQuick(opt.value)}
              className="flex-1 px-3 py-2 rounded-xl text-sm font-bold transition-all"
              style={active
                ? { backgroundColor: ACCENT, color: '#fff' }
                : { backgroundColor: '#F3F4F6', color: '#4B5563' }}>
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* ── Calendario ── */}
      <div className="rounded-2xl border border-gray-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <button type="button" onClick={goPrev} disabled={!canGoPrev}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
            ‹
          </button>
          <span className="text-sm font-black text-gray-800">{MONTHS[view.month]} {view.year}</span>
          <button type="button" onClick={goNext}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100">
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((w, i) => (
            <span key={i} className="text-center text-[11px] font-bold text-gray-400 py-1">{w}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <span key={i} />;
            const iso = toISO(d);
            const isPast = d < min;
            const isSelected = iso === date;
            const isToday = iso === toISO(today);
            return (
              <button key={i} type="button" disabled={isPast} onClick={() => pickDay(d)}
                className={`aspect-square rounded-lg text-sm font-bold flex items-center justify-center transition-all ${
                  isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-700'
                }`}
                style={isSelected
                  ? { backgroundColor: ACCENT, color: '#fff' }
                  : isToday ? { boxShadow: `inset 0 0 0 1.5px ${ACCENT}`, color: ACCENT } : undefined}>
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Hora (franjas) ── */}
      <div>
        <p className="text-xs font-bold text-gray-500 mb-2">
          Hora {time && <span className="text-[#0033A0]">· {label12h(time)}</span>}
        </p>
        <div className="space-y-2.5">
          {TIME_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">{group.label}</p>
              <div className="grid grid-cols-4 gap-1.5">
                {slotsFor(group).map(slot => {
                  const active = time === slot;
                  return (
                    <button key={slot} type="button" onClick={() => onChange(date, slot)}
                      className="px-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={active
                        ? { backgroundColor: ACCENT, color: '#fff' }
                        : { backgroundColor: '#F9FAFB', color: '#4B5563', border: '1px solid #F3F4F6' }}>
                      {label12h(slot)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
