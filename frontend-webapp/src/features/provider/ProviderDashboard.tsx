import { useAuth } from '../../contexts';

export default function ProviderDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Panel de Proveedor</h1>
          <p className="text-gray-600">Bienvenido, {user?.name}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm uppercase">Tours Activos</h3>
            <p className="text-3xl font-bold text-brand-red">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm uppercase">Reservas Hoy</h3>
            <p className="text-3xl font-bold text-gray-800">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm uppercase">Ganancias Mes</h3>
            <p className="text-3xl font-bold text-green-600">$0</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Acciones</h2>
            <div className="space-y-3">
              <a href="/p/tours" className="block p-3 bg-brand-red text-white rounded-lg hover:bg-red-600 transition text-center">
                Gestionar Tours
              </a>
              <a href="/p/earnings" className="block p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition text-center">
                Ver Ganancias
              </a>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Reservas Recientes</h2>
            <div className="space-y-3 text-gray-600">
              <p className="p-3 bg-gray-50 rounded">No hay reservas recientes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
