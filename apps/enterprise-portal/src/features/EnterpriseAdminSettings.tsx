'use client';

import React, { useState } from 'react';
import { useEnterpriseAuth } from '../app/EnterpriseAuthContext';

interface EnterpriseAdminSettingsProps {
  section?: 'cost-centers' | 'policies';
}

const MOCK_COST_CENTERS = [
  { id: '1', name: 'Gerencia General', code: 'GER-001', budget: 5000, spent: 2450 },
  { id: '2', name: 'Ventas', code: 'VEN-001', budget: 8000, spent: 6320 },
  { id: '3', name: 'Marketing', code: 'MKT-001', budget: 3000, spent: 1875 },
  { id: '4', name: 'Operaciones', code: 'OPS-001', budget: 10000, spent: 7650 },
  { id: '5', name: 'Tecnología', code: 'TEC-001', budget: 4000, spent: 890 },
];

const MOCK_POLICIES = [
  { id: '1', name: 'Horario permitido', value: '6:00 AM - 10:00 PM', active: true },
  { id: '2', name: 'Monto máximo por viaje', value: '$100.00', active: true },
  { id: '3', name: 'Requiere aprobación', value: 'Viajes > $50', active: false },
  { id: '4', name: 'Destinos permitidos', value: 'Ecuador únicamente', active: true },
];

export function EnterpriseAdminSettings({ section = 'cost-centers' }: EnterpriseAdminSettingsProps) {
  const { tenantName } = useEnterpriseAuth();
  const [activeSection, setActiveSection] = useState(section);

  return (
    <>
      {/* Header */}
      <header className="top-header">
        <div>
          <h1 className="page-title">
            {activeSection === 'cost-centers' ? 'Centros de Costo' : 'Políticas'}
          </h1>
          <p className="text-sm text-muted">{tenantName} • Administración</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary">
            + {activeSection === 'cost-centers' ? 'Nuevo Centro' : 'Nueva Política'}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="page-content">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveSection('cost-centers')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeSection === 'cost-centers' ? 'bg-enterprise-blue text-white' : 'bg-slate-100'
            }`}
          >
            🏢 Centros de Costo
          </button>
          <button
            onClick={() => setActiveSection('policies')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeSection === 'policies' ? 'bg-enterprise-blue text-white' : 'bg-slate-100'
            }`}
          >
            📋 Políticas
          </button>
        </div>

        {/* Cost Centers */}
        {activeSection === 'cost-centers' && (
          <div className="data-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Código</th>
                  <th>Presupuesto</th>
                  <th>Gastado</th>
                  <th>Disponible</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {MOCK_COST_CENTERS.map(cc => {
                  const available = cc.budget - cc.spent;
                  const pct = (cc.spent / cc.budget) * 100;
                  return (
                    <tr key={cc.id}>
                      <td className="font-medium">{cc.name}</td>
                      <td className="text-muted">{cc.code}</td>
                      <td>${cc.budget.toLocaleString()}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${pct > 80 ? 'bg-going-red' : pct > 50 ? 'bg-going-yellow' : 'bg-green-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-sm">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className={available < 1000 ? 'text-going-red font-semibold' : ''}>
                        ${available.toLocaleString()}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-secondary">Editar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Policies */}
        {activeSection === 'policies' && (
          <div className="space-y-4">
            {MOCK_POLICIES.map(policy => (
              <div 
                key={policy.id}
                className="data-card"
              >
                <div className="card-body flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">{policy.name}</h4>
                    <p className="text-sm text-muted">{policy.value}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`badge ${policy.active ? 'badge-success' : 'badge-warning'}`}>
                      {policy.active ? 'Activa' : 'Inactiva'}
                    </span>
                    <button className="btn btn-sm btn-secondary">Editar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default EnterpriseAdminSettings;
