'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDriver } from '../store';
import AppShell from '../components/AppShell';

type Period = 'hoy' | 'semana' | 'mes';

const DATA: Record<Period, { total: number; trips: number; history: any[] }> = {
  hoy: {
    total: 87.5,
    trips: 5,
    history: [
      {
        id: 1,
        from: 'Av. Amazonas',
        to: 'Aeropuerto',
        time: '14:30',
        fare: 12.5,
        status: 'completed',
      },
      {
        id: 2,
        from: 'El Ejido',
        to: 'La Mariscal',
        time: '12:10',
        fare: 8.0,
        status: 'completed',
      },
      {
        id: 3,
        from: 'CCI Mall',
        to: 'Cumbayá',
        time: '10:45',
        fare: 22.0,
        status: 'completed',
      },
      {
        id: 4,
        from: 'El Batán',
        to: 'Cotocollao',
        time: '09:20',
        fare: 15.0,
        status: 'completed',
      },
      {
        id: 5,
        from: 'La Floresta',
        to: 'Guápulo',
        time: '08:05',
        fare: 30.0,
        status: 'completed',
      },
    ],
  },
  semana: {
    total: 423.75,
    trips: 27,
    history: [
      {
        id: 6,
        from: 'Viernes',
        to: '',
        time: 'Mar 7',
        fare: 87.5,
        status: 'day',
      },
      {
        id: 7,
        from: 'Jueves',
        to: '',
        time: 'Mar 6',
        fare: 95.25,
        status: 'day',
      },
      {
        id: 8,
        from: 'Miércoles',
        to: '',
        time: 'Mar 5',
        fare: 72.0,
        status: 'day',
      },
      {
        id: 9,
        from: 'Martes',
        to: '',
        time: 'Mar 4',
        fare: 88.0,
        status: 'day',
      },
      {
        id: 10,
        from: 'Lunes',
        to: '',
        time: 'Mar 3',
        fare: 81.0,
        status: 'day',
      },
    ],
  },
  mes: {
    total: 1850.0,
    trips: 112,
    history: [
      {
        id: 11,
        from: 'Semana 1',
        to: '',
        time: 'Mar 1–7',
        fare: 423.75,
        status: 'week',
      },
      {
        id: 12,
        from: 'Semana 2',
        to: '',
        time: 'Feb 22–28',
        fare: 398.5,
        status: 'week',
      },
      {
        id: 13,
        from: 'Semana 3',
        to: '',
        time: 'Feb 15–21',
        fare: 512.25,
        status: 'week',
      },
      {
        id: 14,
        from: 'Semana 4',
        to: '',
        time: 'Feb 8–14',
        fare: 515.5,
        status: 'week',
      },
    ],
  },
};

export default function EarningsPage() {
  const { token, isReady, init } = useDriver();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('hoy');

  useEffect(() => {
    init();
  }, [init]);
  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  const d = DATA[period];
  const maxFare = Math.max(...d.history.map((h) => h.fare));

  return (
    <AppShell title="Ganancias">
      <div className="p-4">
        {/* Period selector */}
        <div className="flex gap-2 mb-5">
          {(['hoy', 'semana', 'mes'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="flex-1 py-2 rounded-xl text-sm font-bold capitalize transition-colors"
              style={
                period === p
                  ? { backgroundColor: '#ff4c41', color: '#fff' }
                  : { backgroundColor: '#f1f5f9', color: '#6b7280' }
              }
            >
              {p}
            </button>
          ))}
        </div>

        {/* Total card */}
        <div
          className="rounded-2xl p-5 mb-4 text-white"
          style={{ backgroundColor: '#011627' }}
        >
          <p className="text-sm text-white/50 mb-1">Total ganado</p>
          <p className="text-4xl font-black" style={{ color: '#ff4c41' }}>
            ${d.total.toFixed(2)}
          </p>
          <p className="text-sm text-white/50 mt-2">
            {d.trips} viajes completados
          </p>
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-sm font-bold text-gray-700 mb-3">Distribución</p>
          <div className="flex items-end gap-2 h-20">
            {d.history.map((h, i) => (
              <div
                key={h.id}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div
                  className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${(h.fare / maxFare) * 64}px`,
                    backgroundColor: i === 0 ? '#ff4c41' : '#fecaca',
                  }}
                />
                <p className="text-xs text-gray-400 truncate w-full text-center">
                  {h.time.split(' ')[0]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* History list */}
        <h3 className="text-sm font-bold text-gray-700 mb-3">Detalle</h3>
        <div className="space-y-2">
          {d.history.map((h) => (
            <div
              key={h.id}
              className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#fff0ef' }}
              >
                <span className="text-lg">🚗</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {h.from}
                </p>
                {h.to && (
                  <p className="text-xs text-gray-400 truncate">→ {h.to}</p>
                )}
                <p className="text-xs text-gray-400">{h.time}</p>
              </div>
              <p
                className="font-bold text-sm flex-shrink-0"
                style={{ color: '#22c55e' }}
              >
                +${h.fare.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
