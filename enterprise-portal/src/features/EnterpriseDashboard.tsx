import { useEnterpriseAuth } from '../app/EnterpriseAuthContext';

export default function EnterpriseDashboard() {
  const { user, logout } = useEnterpriseAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Going Enterprise</h1>
            <p className="text-sm text-slate-500">{user?.tenantName}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user?.email}</span>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            <a href="/" className="py-3 border-b-2 border-blue-400">Dashboard</a>
            <a href="/reports" className="py-3 border-b-2 border-transparent hover:border-slate-400">Reportes</a>
            <a href="/users" className="py-3 border-b-2 border-transparent hover:border-slate-400">Usuarios</a>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Panel de Control</h2>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-slate-500 text-sm uppercase">Viajes Activos</h3>
            <p className="text-3xl font-bold text-slate-800">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-slate-500 text-sm uppercase">Conductores</h3>
            <p className="text-3xl font-bold text-slate-800">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-slate-500 text-sm uppercase">Gasto Mensual</h3>
            <p className="text-3xl font-bold text-green-600">$0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-slate-500 text-sm uppercase">Usuarios</h3>
            <p className="text-3xl font-bold text-slate-800">1</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">Actividad Reciente</h3>
          </div>
          <div className="p-6">
            <p className="text-slate-500 text-center py-8">
              No hay actividad reciente en tu empresa
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
