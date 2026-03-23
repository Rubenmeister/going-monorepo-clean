'use client';

import EmpresasLayout from '../EmpresasLayout';
import { useState } from 'react';

const MOCK = [
  { id: 'ap-001', traveler: 'Ana Martínez',    service: 'Alojamiento', description: 'Hotel Guayaquil · 2 noches',         amount: 240,  date: '2026-03-19', status: 'pending'  },
  { id: 'ap-002', traveler: 'Pedro González',  service: 'Transporte',  description: 'Vuelo Quito → Cuenca',              amount: 180,  date: '2026-03-20', status: 'pending'  },
  { id: 'ap-003', traveler: 'María Torres',    service: 'Tour',        description: 'City tour Quito colonial',           amount: 85,   date: '2026-03-18', status: 'approved' },
  { id: 'ap-004', traveler: 'Carlos Rodríguez',service: 'Transporte',  description: 'Transfer aeropuerto',                amount: 45,   date: '2026-03-17', status: 'approved' },
  { id: 'ap-005', traveler: 'Laura Sánchez',   service: 'Experiencia', description: 'Cena ejecutiva clientes externos',   amount: 320,  date: '2026-03-16', status: 'rejected' },
];

export default function ApprovalsPage() {
  const [items, setItems] = useState(MOCK);
  const [filter, setFilter] = useState('pending');

  const pending  = items.filter(i => i.status === 'pending').length;
  const approve  = (id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'approved' } : i));
  const reject   = (id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'rejected' } : i));
  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);

  return (
    <EmpresasLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Aprobaciones</h1>
          <p className="text-gray-500 mt-1 text-sm">{pending} solicitudes pendientes de aprobación</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pendientes', value: items.filter(i => i.status === 'pending').length,  color: '#F59E0B', status: 'pending'  },
            { label: 'Aprobadas',  value: items.filter(i => i.status === 'approved').length, color: '#22C55E', status: 'approved' },
            { label: 'Rechazadas', value: items.filter(i => i.status === 'rejected').length, color: '#EF4444', status: 'rejected' },
          ].map(s => (
            <button key={s.status} onClick={() => setFilter(s.status)}
              className={`bg-white rounded-2xl p-5 text-left shadow-sm border-2 transition ${filter === s.status ? 'border-[#ff4c41]' : 'border-transparent'}`}>
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-3xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {filtered.map(item => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{item.traveler}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.service}</span>
                </div>
                <p className="text-sm text-gray-500">{item.description}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(item.date).toLocaleDateString('es-EC')}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-gray-900">${item.amount}</p>
                {item.status === 'pending' ? (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => reject(item.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50">Rechazar</button>
                    <button onClick={() => approve(item.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: '#22C55E' }}>Aprobar</button>
                  </div>
                ) : (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${item.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {item.status === 'approved' ? '✓ Aprobado' : '✗ Rechazado'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </EmpresasLayout>
  );
}
