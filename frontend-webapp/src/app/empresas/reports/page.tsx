'use client';

import EmpresasLayout from '../EmpresasLayout';

const BY_SERVICE = [
  { service: 'Transporte',   amount: 1240, count: 28, pct: 44 },
  { service: 'Alojamiento',  amount: 980,  count: 8,  pct: 35 },
  { service: 'Tours',        amount: 420,  count: 12, pct: 15 },
  { service: 'Experiencias', amount: 200,  count: 5,  pct: 7  },
];

const BY_MEMBER = [
  { name: 'Carlos Rodríguez', trips: 12, amount: 680  },
  { name: 'Ana Martínez',     trips: 8,  amount: 540  },
  { name: 'Luis Pérez',       trips: 6,  amount: 420  },
  { name: 'María Torres',     trips: 5,  amount: 380  },
  { name: 'Pedro González',   trips: 4,  amount: 260  },
];

export default function ReportsPage() {
  return (
    <EmpresasLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
            <p className="text-gray-500 mt-1 text-sm">Análisis de gastos corporativos · Marzo 2026</p>
          </div>
          <button className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">
            📥 Exportar Excel
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Gasto total (mes)',   value: '$2,840', icon: '💳', color: '#ff4c41' },
            { label: 'Viajes realizados',   value: '53',     icon: '✈️', color: '#0ea5e9' },
            { label: 'Ahorro vs estimado',  value: '12%',    icon: '📈', color: '#22C55E' },
            { label: 'Miembros activos',    value: '18',     icon: '👥', color: '#8B5CF6' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <span className="text-2xl">{k.icon}</span>
              <p className="text-2xl font-bold mt-2" style={{ color: k.color }}>{k.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Por servicio */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Gasto por tipo de servicio</h2>
            <div className="space-y-4">
              {BY_SERVICE.map(s => (
                <div key={s.service}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700">{s.service}</span>
                    <span className="font-bold text-gray-900">${s.amount} <span className="text-gray-400 font-normal">({s.count} viajes)</span></span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${s.pct}%`, backgroundColor: '#ff4c41' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Por miembro */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Top viajeros del mes</h2>
            <div className="space-y-3">
              {BY_MEMBER.map((m, i) => (
                <div key={m.name} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: '#ff4c41' }}>
                    {m.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.trips} viajes</p>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">${m.amount}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </EmpresasLayout>
  );
}
