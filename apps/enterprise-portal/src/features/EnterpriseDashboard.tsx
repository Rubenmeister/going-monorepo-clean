import { useEnterpriseAuth } from '../app/EnterpriseAuthContext';

// Icons
const Icons = {
  dashboard: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  trips: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  reports: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  users: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  billing: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  settings: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

const navItems = [
  { section: 'General', items: [
    { icon: Icons.dashboard, label: 'Dashboard', href: '/', active: true },
    { icon: Icons.trips, label: 'Viajes', href: '/trips' },
  ]},
  { section: 'Finanzas', items: [
    { icon: Icons.reports, label: 'Reportes', href: '/reports' },
    { icon: Icons.billing, label: 'Facturación', href: '/billing' },
  ]},
  { section: 'Administración', items: [
    { icon: Icons.users, label: 'Usuarios', href: '/users' },
    { icon: Icons.settings, label: 'Configuración', href: '/settings' },
  ]},
];

// Mock data
const recentTrips = [
  { id: 'ENT-001', user: 'Juan Pérez', from: 'Oficina Central', to: 'Aeropuerto', status: 'completed', amount: 45.00, date: '2024-12-13' },
  { id: 'ENT-002', user: 'María López', from: 'Hotel Marriott', to: 'Centro Convenciones', status: 'active', amount: 22.50, date: '2024-12-13' },
  { id: 'ENT-003', user: 'Carlos Ruiz', from: 'Zona Franca', to: 'Oficina Norte', status: 'pending', amount: 35.00, date: '2024-12-12' },
];

export default function EnterpriseDashboard() {
  const { user, logout } = useEnterpriseAuth();

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="red">Going</span> Enterprise
          </div>
          <div className="sidebar-tenant">{user?.tenantName}</div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((section, i) => (
            <div key={i} className="nav-section">
              <div className="nav-section-title">{section.section}</div>
              {section.items.map((item, j) => (
                <a key={j} href={item.href} className={`nav-item ${item.active ? 'active' : ''}`}>
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{user?.email}</div>
          <button 
            onClick={logout}
            style={{ 
              color: '#ef4444', 
              fontSize: '0.875rem', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="top-header">
          <h1 className="page-title">Dashboard</h1>
          <div className="header-actions">
            <button className="btn btn-secondary btn-sm">
              📥 Exportar
            </button>
            <button className="btn btn-primary btn-sm">
              + Solicitar viaje
            </button>
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
                  <th>Usuario</th>
                  <th>Ruta</th>
                  <th>Estado</th>
                  <th>Monto</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.map((trip) => (
                  <tr key={trip.id}>
                    <td style={{ fontFamily: 'monospace', color: '#1e40af' }}>{trip.id}</td>
                    <td style={{ fontWeight: 500, color: '#0f172a' }}>{trip.user}</td>
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
                    <td className="text-muted">{trip.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
