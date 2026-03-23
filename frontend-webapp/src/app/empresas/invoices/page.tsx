'use client';

import EmpresasLayout from '../EmpresasLayout';

const INVOICES = [
  { id: 'INV-2026-03', date: '2026-03-01', amount: 2840, status: 'paid',    services: 18, period: 'Febrero 2026' },
  { id: 'INV-2026-02', date: '2026-02-01', amount: 3120, status: 'paid',    services: 22, period: 'Enero 2026'   },
  { id: 'INV-2026-01', date: '2026-01-01', amount: 1980, status: 'paid',    services: 14, period: 'Diciembre 2025'},
  { id: 'INV-2025-12', date: '2025-12-01', amount: 2250, status: 'overdue', services: 16, period: 'Noviembre 2025'},
];

export default function InvoicesPage() {
  return (
    <EmpresasLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
          <p className="text-gray-500 mt-1 text-sm">Historial de facturación corporativa</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total pagado (2026)', value: '$5,960', icon: '✅', color: '#22C55E' },
            { label: 'Facturas este año',   value: '3',      icon: '🧾', color: '#0ea5e9' },
            { label: 'Pendiente de pago',   value: '$2,250', icon: '⚠️', color: '#F59E0B' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Factura', 'Período', 'Servicios', 'Monto', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {INVOICES.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">{inv.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{inv.period}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{inv.services} servicios</td>
                  <td className="px-6 py-4 font-bold text-gray-900">${inv.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                      {inv.status === 'paid' ? 'Pagada' : 'Vencida'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-xs text-[#ff4c41] hover:underline font-medium">Descargar PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </EmpresasLayout>
  );
}
