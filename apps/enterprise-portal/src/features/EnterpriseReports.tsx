import { useEnterpriseAuth } from '../app/EnterpriseAuthContext';

export default function EnterpriseReports() {
  const { user } = useEnterpriseAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Same header as dashboard */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-slate-800">Going Enterprise</h1>
          <p className="text-sm text-slate-500">{user?.tenantName}</p>
        </div>
      </header>

      <nav className="bg-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            <a href="/" className="py-3 border-b-2 border-transparent hover:border-slate-400">Dashboard</a>
            <a href="/reports" className="py-3 border-b-2 border-blue-400">Reportes</a>
            <a href="/users" className="py-3 border-b-2 border-transparent hover:border-slate-400">Usuarios</a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Reportes</h2>
        
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">Reportes de {user?.tenantName}</h3>
          </div>
          <div className="p-6">
            <p className="text-slate-500 text-center py-8">
              No hay reportes disponibles para tu empresa
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
