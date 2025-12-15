'use client';

import React, { useState } from 'react';
import { useEnterpriseAuth } from '../app/EnterpriseAuthContext';

interface Trip {
  id: string;
  type: 'private' | 'shared';
  from: string;
  to: string;
  date: string;
  time: string;
  status: 'completed' | 'in_progress' | 'cancelled' | 'scheduled';
  user: string;
  costCenter: string;
  amount: number;
}

const MOCK_TRIPS: Trip[] = [
  { id: 'T-001', type: 'private', from: 'Oficina Principal', to: 'Aeropuerto', date: '14 Dic', time: '08:30', status: 'completed', user: 'Juan García', costCenter: 'Gerencia', amount: 25.50 },
  { id: 'T-002', type: 'shared', from: 'Aeropuerto', to: 'Hotel Marriott', date: '14 Dic', time: '14:00', status: 'in_progress', user: 'María López', costCenter: 'Ventas', amount: 18.75 },
  { id: 'T-003', type: 'private', from: 'Hotel Marriott', to: 'Centro de Convenciones', date: '15 Dic', time: '09:00', status: 'scheduled', user: 'Carlos Rodríguez', costCenter: 'Marketing', amount: 12.00 },
  { id: 'T-004', type: 'private', from: 'Oficina Norte', to: 'Cliente ABC', date: '13 Dic', time: '11:00', status: 'completed', user: 'Ana Martínez', costCenter: 'Ventas', amount: 22.25 },
  { id: 'T-005', type: 'shared', from: 'Bodega Central', to: 'Oficina Principal', date: '13 Dic', time: '16:30', status: 'cancelled', user: 'Pedro Sánchez', costCenter: 'Operaciones', amount: 0 },
];

const statusLabels = {
  completed: { label: 'Completado', class: 'badge-success' },
  in_progress: { label: 'En curso', class: 'badge-info' },
  cancelled: { label: 'Cancelado', class: 'badge-error' },
  scheduled: { label: 'Programado', class: 'badge-warning' },
};

export function EnterpriseTrips() {
  const { tenantName } = useEnterpriseAuth();
  const [filter, setFilter] = useState({ status: 'all', costCenter: 'all' });

  const filteredTrips = MOCK_TRIPS.filter(trip => {
    if (filter.status !== 'all' && trip.status !== filter.status) return false;
    if (filter.costCenter !== 'all' && trip.costCenter !== filter.costCenter) return false;
    return true;
  });

  const costCenters = [...new Set(MOCK_TRIPS.map(t => t.costCenter))];

  return (
    <>
      {/* Header */}
      <header className="top-header">
        <div>
          <h1 className="page-title">Viajes</h1>
          <p className="text-sm text-muted">{tenantName} • {filteredTrips.length} viajes</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary">
            📥 Exportar CSV
          </button>
          <a href="/e/request/ride" className="btn btn-primary">
            + Nuevo Viaje
          </a>
        </div>
      </header>

      {/* Content */}
      <div className="page-content">
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select 
            className="form-input w-auto"
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          >
            <option value="all">Todos los estados</option>
            <option value="completed">Completados</option>
            <option value="in_progress">En curso</option>
            <option value="scheduled">Programados</option>
            <option value="cancelled">Cancelados</option>
          </select>
          <select 
            className="form-input w-auto"
            value={filter.costCenter}
            onChange={(e) => setFilter({ ...filter, costCenter: e.target.value })}
          >
            <option value="all">Todos los centros</option>
            {costCenters.map(cc => (
              <option key={cc} value={cc}>{cc}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="data-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ruta</th>
                <th>Fecha/Hora</th>
                <th>Usuario</th>
                <th>Centro</th>
                <th>Estado</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.map(trip => (
                <tr key={trip.id} className="cursor-pointer hover:bg-slate-50">
                  <td className="font-medium">{trip.id}</td>
                  <td>
                    <div className="text-sm">
                      <span className="text-going-red">●</span> {trip.from}
                      <br />
                      <span className="text-going-yellow">●</span> {trip.to}
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">
                      {trip.date}<br />
                      <span className="text-muted">{trip.time}</span>
                    </div>
                  </td>
                  <td>{trip.user}</td>
                  <td>
                    <span className="badge badge-info">{trip.costCenter}</span>
                  </td>
                  <td>
                    <span className={`badge ${statusLabels[trip.status].class}`}>
                      {statusLabels[trip.status].label}
                    </span>
                  </td>
                  <td className="font-semibold">
                    {trip.amount > 0 ? `$${trip.amount.toFixed(2)}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default EnterpriseTrips;
