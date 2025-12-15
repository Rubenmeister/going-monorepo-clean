'use client';

import React, { useState } from 'react';
import { useEnterpriseAuth } from '../app/EnterpriseAuthContext';

interface Shipment {
  id: string;
  from: string;
  to: string;
  date: string;
  status: 'delivered' | 'in_transit' | 'pending' | 'cancelled';
  user: string;
  costCenter: string;
  weight: string;
  amount: number;
}

const MOCK_SHIPMENTS: Shipment[] = [
  { id: 'S-001', from: 'Bodega Quito', to: 'Sucursal Guayaquil', date: '14 Dic', status: 'in_transit', user: 'Logística', costCenter: 'Operaciones', weight: '15 kg', amount: 45.00 },
  { id: 'S-002', from: 'Oficina Principal', to: 'Cliente XYZ', date: '14 Dic', status: 'delivered', user: 'Ana Torres', costCenter: 'Ventas', weight: '2 kg', amount: 12.50 },
  { id: 'S-003', from: 'Proveedor ABC', to: 'Bodega Central', date: '13 Dic', status: 'delivered', user: 'Compras', costCenter: 'Compras', weight: '50 kg', amount: 85.00 },
  { id: 'S-004', from: 'Oficina Norte', to: 'Cliente Beta', date: '15 Dic', status: 'pending', user: 'Carlos Ruiz', costCenter: 'Marketing', weight: '5 kg', amount: 22.00 },
];

const statusLabels = {
  delivered: { label: 'Entregado', class: 'badge-success' },
  in_transit: { label: 'En tránsito', class: 'badge-info' },
  pending: { label: 'Pendiente', class: 'badge-warning' },
  cancelled: { label: 'Cancelado', class: 'badge-error' },
};

export function EnterpriseShipments() {
  const { tenantName } = useEnterpriseAuth();
  const [filter, setFilter] = useState('all');

  const filteredShipments = filter === 'all' 
    ? MOCK_SHIPMENTS 
    : MOCK_SHIPMENTS.filter(s => s.status === filter);

  return (
    <>
      {/* Header */}
      <header className="top-header">
        <div>
          <h1 className="page-title">Envíos</h1>
          <p className="text-sm text-muted">{tenantName} • {filteredShipments.length} envíos</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary">📥 Exportar</button>
          <a href="/e/request/shipment" className="btn btn-primary">+ Nuevo Envío</a>
        </div>
      </header>

      {/* Content */}
      <div className="page-content">
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select 
            className="form-input w-auto"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="in_transit">En tránsito</option>
            <option value="delivered">Entregados</option>
          </select>
        </div>

        {/* Table */}
        <div className="data-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Origen → Destino</th>
                <th>Fecha</th>
                <th>Peso</th>
                <th>Centro</th>
                <th>Estado</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map(shipment => (
                <tr key={shipment.id} className="cursor-pointer hover:bg-slate-50">
                  <td className="font-medium">{shipment.id}</td>
                  <td>
                    <div className="text-sm">
                      📦 {shipment.from}<br />
                      <span className="text-muted">→ {shipment.to}</span>
                    </div>
                  </td>
                  <td>{shipment.date}</td>
                  <td>{shipment.weight}</td>
                  <td><span className="badge badge-info">{shipment.costCenter}</span></td>
                  <td>
                    <span className={`badge ${statusLabels[shipment.status].class}`}>
                      {statusLabels[shipment.status].label}
                    </span>
                  </td>
                  <td className="font-semibold">${shipment.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default EnterpriseShipments;
