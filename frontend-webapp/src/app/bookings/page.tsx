'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: '✓ Confirmada',
  pending: '⏳ Pendiente',
  cancelled: '✗ Cancelada',
  completed: '✓ Completada',
};

const MOCK_BOOKINGS = [
  {
    id: 'BK-001',
    type: 'ride',
    icon: '🚗',
    title: 'Transporte al Aeropuerto',
    detail: 'Quito Centro → Aeropuerto Mariscal Sucre',
    date: '15/03/2026',
    time: '06:00',
    amount: '$18.50',
    status: 'confirmed',
  },
  {
    id: 'BK-002',
    type: 'accommodation',
    icon: '🏨',
    title: 'Hotel Amazonia Lodge',
    detail: 'Tena, Ecuador · 3 noches',
    date: '20/03/2026',
    time: 'Check-in 14:00',
    amount: '$450.00',
    status: 'confirmed',
  },
  {
    id: 'BK-003',
    type: 'tour',
    icon: '🗺️',
    title: 'Tour Cotopaxi Aventura',
    detail: 'Guía local · Grupo de 8 personas',
    date: '22/03/2026',
    time: '07:30',
    amount: '$89.99',
    status: 'pending',
  },
  {
    id: 'BK-004',
    type: 'experience',
    icon: '🎭',
    title: 'Experiencia Gastronómica Quito',
    detail: 'Degustación de cocina ecuatoriana tradicional',
    date: '10/02/2026',
    time: '19:00',
    amount: '$45.00',
    status: 'completed',
  },
  {
    id: 'BK-005',
    type: 'parcel',
    icon: '📦',
    title: 'Envío Express Guayaquil',
    detail: 'Quito → Guayaquil · 2.3 kg',
    date: '05/02/2026',
    time: 'Entregado 14:23',
    amount: '$22.50',
    status: 'completed',
  },
];

type FilterType = 'all' | 'upcoming' | 'completed' | 'cancelled';

export default function BookingsPage() {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = MOCK_BOOKINGS.filter((b) => {
    if (filter === 'upcoming')
      return b.status === 'confirmed' || b.status === 'pending';
    if (filter === 'completed') return b.status === 'completed';
    if (filter === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">🎫 Mis Reservas</h1>
          <p className="text-gray-500 mt-1">
            Gestiona todos tus viajes y servicios reservados
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-fit">
          {(
            [
              ['all', 'Todas'],
              ['upcoming', 'Próximas'],
              ['completed', 'Completadas'],
              ['cancelled', 'Canceladas'],
            ] as [FilterType, string][]
          ).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === val
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Bookings list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay reservas
            </h3>
            <p className="text-gray-500">
              No tienes reservas en esta categoría aún.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start gap-4 hover:shadow-md transition-shadow"
              >
                <div className="text-3xl w-12 h-12 flex items-center justify-center bg-blue-50 rounded-xl flex-shrink-0">
                  {booking.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {booking.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {booking.detail}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                        STATUS_COLORS[booking.status]
                      }`}
                    >
                      {STATUS_LABELS[booking.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-gray-400">
                      📅 {booking.date}
                    </span>
                    <span className="text-xs text-gray-400">
                      🕐 {booking.time}
                    </span>
                    <span className="text-sm font-bold text-blue-600 ml-auto">
                      {booking.amount}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="text-xs text-blue-600 font-semibold hover:underline">
                      Ver detalles
                    </button>
                    {(booking.status === 'confirmed' ||
                      booking.status === 'pending') && (
                      <button className="text-xs text-red-500 font-semibold hover:underline ml-2">
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            {
              label: 'Total reservas',
              value: MOCK_BOOKINGS.length,
              color: 'text-gray-900',
            },
            {
              label: 'Próximas',
              value: MOCK_BOOKINGS.filter(
                (b) => b.status === 'confirmed' || b.status === 'pending'
              ).length,
              color: 'text-blue-600',
            },
            {
              label: 'Completadas',
              value: MOCK_BOOKINGS.filter((b) => b.status === 'completed')
                .length,
              color: 'text-green-600',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100"
            >
              <div className={`text-3xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
