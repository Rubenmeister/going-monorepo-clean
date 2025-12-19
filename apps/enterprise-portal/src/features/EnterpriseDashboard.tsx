import { EnterpriseLayout } from '../components/EnterpriseLayout';

// Mock data
const recentTrips = [
  { id: 'ENT-001', user: 'Juan Pérez', from: 'Oficina Central', to: 'Aeropuerto', status: 'completed', amount: 45.00, date: '2024-12-13' },
  { id: 'ENT-002', user: 'María López', from: 'Hotel Marriott', to: 'Centro Convenciones', status: 'active', amount: 22.50, date: '2024-12-13' },
  { id: 'ENT-003', user: 'Carlos Ruiz', from: 'Zona Franca', to: 'Oficina Norte', status: 'pending', amount: 35.00, date: '2024-12-12' },
];

export default function EnterpriseDashboard() {
  return (
    <EnterpriseLayout activeItem="dashboard">
      {/* Header */}
      <header className="top-header">
        <h1 className="page-title">Dashboard</h1>
        <div className="header-actions">
          <button className="btn btn-secondary btn-sm">📥 Exportar</button>
          <a href="/e/request/ride" className="btn btn-primary btn-sm">+ Solicitar viaje</a>
        </div>
      </header>

      {/* Page Content */}
      <div className="page-content">
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Viajes este mes</div>
            <div className="stat-value">127</div>
            <div className="stat-change up">↑ 12% vs mes anterior</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Gasto mensual</div>
            <div className="stat-value">$4,580</div>
            <div className="stat-change down">↓ 5% vs mes anterior</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Usuarios activos</div>
            <div className="stat-value">23</div>
            <div className="stat-change up">↑ 3 nuevos</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ahorro estimado</div>
            <div className="stat-value">$890</div>
            <div className="stat-change up">↑ vs taxis tradicionales</div>
          </div>
        </div>

        <div className="grid-2">
          {/* Recent Trips */}
          <div className="data-card">
            <div className="card-header">
              <h3 className="card-title">Viajes recientes</h3>
              <a href="/trips" className="btn btn-secondary btn-sm">Ver todos</a>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ruta</th>
                  <th>Estado</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.map((trip) => (
                  <tr key={trip.id}>
                    <td style={{ fontFamily: 'monospace', color: '#1e40af' }}>{trip.id}</td>
                    <td>{trip.from} → {trip.to}</td>
                    <td>
                      <span className={`badge badge-${
                        trip.status === 'completed' ? 'success' : 
                        trip.status === 'active' ? 'info' : 'warning'
                      }`}>
                        {trip.status === 'completed' ? 'Completado' : 
                         trip.status === 'active' ? 'En curso' : 'Pendiente'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>${trip.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Tracking Placeholder */}
          <div className="data-card">
            <div className="card-header">
              <h3 className="card-title">Flota en tiempo real</h3>
              <span className="badge badge-info">2 Activos</span>
            </div>
            <div className="card-body">
              <div className="bg-slate-100 rounded-lg aspect-video flex flex-col items-center justify-center border-2 border-dashed border-slate-300">
                <div className="text-4xl mb-2">🗺️</div>
                <p className="text-slate-500 text-sm font-medium">Mapa de seguimiento activo</p>
                <p className="text-xs text-slate-400 mt-1">Conectando con Tracking Service...</p>
                <div className="mt-4 flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                    <span className="text-xs font-medium">Camión #102</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></span>
                    <span className="text-xs font-medium">Van #045</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EnterpriseLayout>
  );
}
