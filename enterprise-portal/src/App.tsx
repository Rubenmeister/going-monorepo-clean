import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { Button } from '@going-monorepo-clean/shared-ui';

export default function App() {
  const { auth, domain } = useMonorepoApp();

  // Loading state
  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0033A0] mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!auth.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#0033A0] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-[#FFCD00] text-2xl font-bold">G</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0033A0] mb-2">Going Enterprise</h1>
          <p className="text-gray-600 mb-6">Inicia sesión para acceder al portal corporativo</p>
          <Button variant="primary" className="w-full">
            Iniciar Sesión
          </Button>
        </div>
      </div>
    );
  }

  // Role check
  const hasAccess = auth.user.isAdmin() || auth.user.roles.includes('enterprise');
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-300 rounded-lg p-8 max-w-lg text-center">
          <h1 className="text-2xl font-semibold text-red-600 mb-4">ACCESO DENEGADO</h1>
          <p className="text-red-500 mb-4">
            Tu rol ({auth.user.roles.join(', ')}) no tiene permiso para acceder al portal empresarial.
          </p>
          <Button onClick={auth.logout} variant="secondary">Cerrar Sesión</Button>
        </div>
      </div>
    );
  }

  // Enterprise Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-[#0033A0] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#FFCD00] rounded-lg flex items-center justify-center">
              <span className="text-[#0033A0] text-xl font-bold">G</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Going Enterprise</h1>
              <p className="text-blue-200 text-xs">Portal Corporativo</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">{auth.user.firstName}</span>
            <button
              onClick={auth.logout}
              className="bg-blue-800 hover:bg-blue-900 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Bienvenido, {auth.user.firstName}
          </h2>
          <p className="text-gray-500">Resumen de tu cuenta empresarial</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Viajes Corporativos</p>
            <p className="text-3xl font-bold text-[#0033A0]">1,284</p>
            <p className="text-sm text-green-600 mt-1">+12% este mes</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Reservas Activas</p>
            <p className="text-3xl font-bold text-[#0033A0]">347</p>
            <p className="text-sm text-green-600 mt-1">+5% este mes</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Empleados Registrados</p>
            <p className="text-3xl font-bold text-[#0033A0]">892</p>
            <p className="text-sm text-blue-600 mt-1">+23 nuevos</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Gasto Mensual</p>
            <p className="text-3xl font-bold text-[#0033A0]">$45,230</p>
            <p className="text-sm text-red-500 mt-1">-3% vs anterior</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-[#0033A0] text-white rounded-lg p-4 text-left hover:bg-blue-800 transition-colors">
              <p className="font-semibold">Solicitar Viaje Corporativo</p>
              <p className="text-blue-200 text-sm mt-1">Nuevo viaje para empleados</p>
            </button>
            <button className="bg-[#FFCD00] text-[#0033A0] rounded-lg p-4 text-left hover:bg-yellow-400 transition-colors">
              <p className="font-semibold">Reservar Alojamiento</p>
              <p className="text-blue-800 text-sm mt-1">Hospedaje corporativo</p>
            </button>
            <button className="border-2 border-[#0033A0] text-[#0033A0] rounded-lg p-4 text-left hover:bg-blue-50 transition-colors">
              <p className="font-semibold">Ver Reportes</p>
              <p className="text-gray-500 text-sm mt-1">Análisis y estadísticas</p>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="font-medium text-gray-900">Viaje corporativo completado</p>
                <p className="text-sm text-gray-500">Quito → Guayaquil · 3 empleados</p>
              </div>
              <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">Completado</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="font-medium text-gray-900">Reserva de alojamiento pendiente</p>
                <p className="text-sm text-gray-500">Hotel Colón, Cuenca · 2 noches</p>
              </div>
              <span className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full">Pendiente</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="font-medium text-gray-900">Nuevos empleados registrados</p>
                <p className="text-sm text-gray-500">5 empleados agregados al sistema</p>
              </div>
              <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">Nuevo</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Reporte mensual generado</p>
                <p className="text-sm text-gray-500">Enero 2026 · Gasto total: $42,150</p>
              </div>
              <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">Reporte</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center text-sm text-gray-400">
          © 2026 Going Ecuador · Portal Empresarial
        </div>
      </footer>
    </div>
  );
}
