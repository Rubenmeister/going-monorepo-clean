'use client';

import React from 'react';
import { useEnterpriseAuth } from '../app/EnterpriseAuthContext';

interface EnterpriseBillingProps {
  view?: 'overview' | 'invoices' | 'payments';
}

const MOCK_INVOICES = [
  { id: 'INV-2024-012', period: 'Diciembre 2024', amount: 2450.00, status: 'pending', dueDate: '15 Ene 2025' },
  { id: 'INV-2024-011', period: 'Noviembre 2024', amount: 1875.50, status: 'paid', paidDate: '10 Dic 2024' },
  { id: 'INV-2024-010', period: 'Octubre 2024', amount: 2120.75, status: 'paid', paidDate: '12 Nov 2024' },
];

const STATS = [
  { label: 'Gasto este mes', value: '$2,450.00', change: '+12%', up: true },
  { label: 'Viajes este mes', value: '87', change: '+8%', up: true },
  { label: 'Envíos este mes', value: '23', change: '-5%', up: false },
  { label: 'Promedio por viaje', value: '$18.50', change: '0%', up: true },
];

export function EnterpriseBilling({ view = 'overview' }: EnterpriseBillingProps) {
  const { tenantName } = useEnterpriseAuth();

  return (
    <>
      {/* Header */}
      <header className="top-header">
        <div>
          <h1 className="page-title">Facturación</h1>
          <p className="text-sm text-muted">{tenantName}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary">📥 Descargar Reporte</button>
        </div>
      </header>

      {/* Content */}
      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid">
          {STATS.map((stat, i) => (
            <div key={i} className="stat-card">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
              <div className={`stat-change ${stat.up ? 'up' : 'down'}`}>
                {stat.up ? '↑' : '↓'} {stat.change} vs mes anterior
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <a 
            href="/e/billing" 
            className={`px-4 py-2 rounded-lg font-medium transition ${
              view === 'overview' ? 'bg-enterprise-blue text-white' : 'bg-slate-100'
            }`}
          >
            Resumen
          </a>
          <a 
            href="/e/billing/invoices" 
            className={`px-4 py-2 rounded-lg font-medium transition ${
              view === 'invoices' ? 'bg-enterprise-blue text-white' : 'bg-slate-100'
            }`}
          >
            Facturas
          </a>
          <a 
            href="/e/billing/payments" 
            className={`px-4 py-2 rounded-lg font-medium transition ${
              view === 'payments' ? 'bg-enterprise-blue text-white' : 'bg-slate-100'
            }`}
          >
            Pagos
          </a>
        </div>

        {/* Invoices Table */}
        <div className="data-card">
          <div className="card-header">
            <h3 className="card-title">Facturas Recientes</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Factura</th>
                <th>Período</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {MOCK_INVOICES.map(inv => (
                <tr key={inv.id}>
                  <td className="font-medium">{inv.id}</td>
                  <td>{inv.period}</td>
                  <td className="font-semibold">${inv.amount.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${inv.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                      {inv.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="text-muted">
                    {inv.status === 'paid' ? inv.paidDate : `Vence: ${inv.dueDate}`}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-secondary">📄 Ver</button>
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

export default EnterpriseBilling;
