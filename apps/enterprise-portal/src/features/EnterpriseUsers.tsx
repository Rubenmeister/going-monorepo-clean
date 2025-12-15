import { useEnterpriseAuth } from '../app/EnterpriseAuthContext';

export default function EnterpriseUsers() {
  const { user } = useEnterpriseAuth();

  return (
    <div className="min-h-screen bg-slate-100">
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
            <a href="/reports" className="py-3 border-b-2 border-transparent hover:border-slate-400">Reportes</a>
            <a href="/users" className="py-3 border-b-2 border-blue-400">Usuarios</a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Usuarios de la Empresa</h2>
          {user?.role === 'enterprise_admin' && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              + Agregar Usuario
            </button>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-slate-600">Nombre</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600">Email</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600">Rol</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="p-4">{user?.name}</td>
                <td className="p-4">{user?.email}</td>
                <td className="p-4">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    {user?.role === 'enterprise_admin' ? 'Administrador' : 'Usuario'}
                  </span>
                </td>
                <td className="p-4 text-slate-400">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
