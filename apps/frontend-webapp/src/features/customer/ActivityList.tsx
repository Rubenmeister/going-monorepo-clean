'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentStatusBadge, EmptyStateNoTrips, PaymentStatus } from '@going/shared-ui';

interface ActivityItem {
  id: string;
  type: 'ride' | 'shipment';
  status: 'completed' | 'cancelled' | 'in_progress';
  from: string;
  to: string;
  date: string;
  time: string;
  amount: number;
  paymentStatus: PaymentStatus;
  driver?: string;
}

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 'T-001',
    type: 'ride',
    status: 'completed',
    from: 'Aeropuerto Mariscal Sucre',
    to: 'Centro Histórico, Quito',
    date: '14 Dic 2024',
    time: '10:30 AM',
    amount: 11.25,
    paymentStatus: 'completed',
    driver: 'Carlos M.',
  },
  {
    id: 'T-002',
    type: 'ride',
    status: 'completed',
    from: 'La Carolina',
    to: 'Cumbayá',
    date: '13 Dic 2024',
    time: '6:45 PM',
    amount: 8.50,
    paymentStatus: 'completed',
    driver: 'María L.',
  },
  {
    id: 'S-001',
    type: 'shipment',
    status: 'completed',
    from: 'Quito Centro',
    to: 'Valle de los Chillos',
    date: '12 Dic 2024',
    time: '2:00 PM',
    amount: 15.00,
    paymentStatus: 'completed',
  },
  {
    id: 'T-003',
    type: 'ride',
    status: 'cancelled',
    from: 'González Suárez',
    to: 'Aeropuerto',
    date: '11 Dic 2024',
    time: '8:00 AM',
    amount: 0,
    paymentStatus: 'refunded',
  },
];

type FilterType = 'all' | 'ride' | 'shipment';
type FilterStatus = 'all' | 'completed' | 'cancelled';

export function ActivityList() {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const filteredActivity = MOCK_ACTIVITY.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    return true;
  });

  const typeIcons = { ride: '🚗', shipment: '📦' };
  const statusLabels = { completed: 'Completado', cancelled: 'Cancelado', in_progress: 'En curso' };
  const statusColors = {
    completed: 'text-green-600 bg-green-50',
    cancelled: 'text-red-600 bg-red-50',
    in_progress: 'text-blue-600 bg-blue-50',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Actividad</h1>
            <button onClick={() => navigate('/c/home')} className="text-going-red font-medium">
              Nuevo viaje
            </button>
          </div>
          
          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
            >
              <option value="all">Todos los tipos</option>
              <option value="ride">Viajes</option>
              <option value="shipment">Envíos</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
            >
              <option value="all">Todos los estados</option>
              <option value="completed">Completados</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {filteredActivity.length === 0 ? (
          <EmptyStateNoTrips />
        ) : (
          <div className="space-y-3">
            {filteredActivity.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/c/activity/${item.id}`)}
                className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md transition"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                    {typeIcons[item.type]}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 truncate">{item.from}</span>
                      <span className="text-sm text-gray-400">{item.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <span>→</span>
                      <span className="truncate">{item.to}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[item.status]}`}>
                          {statusLabels[item.status]}
                        </span>
                        {item.driver && (
                          <span className="text-xs text-gray-400">
                            con {item.driver}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {item.amount > 0 && (
                          <span className="font-semibold text-gray-900">${item.amount.toFixed(2)}</span>
                        )}
                        <PaymentStatusBadge status={item.paymentStatus} size="sm" showIcon={false} />
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


