import { useState } from 'react';
import { EnterpriseLayout } from '../components/EnterpriseLayout';

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
  const [activeSection, setActiveSection] = useState(section);

  return (
    <EnterpriseLayout activeItem="settings">
      {/* Header */}
      <header className="top-header">
        <div>
          <h1 className="page-title">
            {activeSection === 'cost-centers' ? 'Centros de Costo' : 'Políticas'}
          </h1>
          <p className="text-sm text-muted">Configuración administrativa de la empresa</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary btn-sm">
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
            📋 Políticas de Viaje
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
                  <th>Consumo</th>
                  <th>Saldo</th>
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
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-orange-400' : 'bg-green-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className={`font-semibold ${available < 1000 ? 'text-red-600' : 'text-slate-800'}`}>
                        ${available.toLocaleString()}
                      </td>
                      <td className="text-right">
                        <button className="text-blue-600 hover:underline text-sm font-medium">Editar</button>
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
          <div className="grid-2">
            {MOCK_POLICIES.map(policy => (
              <div key={policy.id} className="data-card p-6 flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">{policy.name}</h4>
                  <p className="text-sm text-slate-500 mb-4">{policy.value}</p>
                  <span className={`badge ${policy.active ? 'badge-success' : 'badge-warning'}`}>
                    {policy.active ? '● Activa' : '○ Inactiva'}
                  </span>
                </div>
                <button className="btn btn-sm btn-secondary">Ajustar</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </EnterpriseLayout>
  );
}

export default EnterpriseAdminSettings;
