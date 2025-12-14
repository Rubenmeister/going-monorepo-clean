import { useAuth } from '../../contexts';

export default function CustomerDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Mi Panel</h1>
          <p className="text-gray-600">Bienvenido, {user?.name}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
            <div className="space-y-3">
              <a href="/c/trips" className="block p-3 bg-brand-red text-white rounded-lg hover:bg-red-600 transition text-center">
                Solicitar Viaje
              </a>
              <a href="/c/bookings" className="block p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition text-center">
                Reservar Tour
              </a>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Actividad Reciente</h2>
            <div className="space-y-3 text-gray-600">
              <p className="p-3 bg-gray-50 rounded">No hay actividad reciente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
