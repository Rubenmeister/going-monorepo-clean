import { useAuth } from '../../contexts';
import { Link } from 'react-router-dom';

export function CustomerDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Mobile styled */}
      <div className="bg-white p-6 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Hola, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-sm text-gray-500">¿Qué quieres hacer hoy?</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
             {/* Profile Avatar Placeholder */}
             <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
               {user?.name?.charAt(0)}
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-8">
        
        {/* Main Services Grid */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Servicios GOING</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Private Ride Card */}
            <Link to="/c/trips" className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md border border-gray-100">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                <span className="text-6xl">🚗</span>
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-brand-red/10 flex items-center justify-center text-2xl mb-4">
                  🚗
                </div>
                <h3 className="text-xl font-bold text-gray-800">Viaje Privado</h3>
                <p className="text-sm text-gray-500 mt-1">Tu conductor, tu ruta. Llega seguro y rápido.</p>
                <div className="mt-4 inline-flex items-center text-sm font-semibold text-brand-red">
                  Solicitar ahora →
                </div>
              </div>
            </Link>

            {/* Shared Ride Card */}
            <Link to="/c/bookings" className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md border border-gray-100">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                <span className="text-6xl">👥</span>
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl mb-4">
                  👥
                </div>
                <h3 className="text-xl font-bold text-gray-800">Viaje Compartido</h3>
                <p className="text-sm text-gray-500 mt-1">Ahorra en rutas entre ciudades.</p>
                <div className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600">
                  Ver rutas →
                </div>
              </div>
            </Link>

            {/* Shipping Card */}
            <Link to="/c/trips?service=shipping" className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md border border-gray-100">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                <span className="text-6xl">📦</span>
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center text-2xl mb-4">
                  📦
                </div>
                <h3 className="text-xl font-bold text-gray-800">Envíos</h3>
                <p className="text-sm text-gray-500 mt-1">Manda paquetes con rastreo en vivo.</p>
                <div className="mt-4 inline-flex items-center text-sm font-semibold text-yellow-700">
                  Enviar paquete →
                </div>
              </div>
            </Link>

          </div>
        </section>

        {/* Coming Soon Section */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
             <h2 className="text-lg font-bold text-gray-800">Descubre Ecuador 🇪🇨</h2>
             <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Próximamente</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {['🏔️ Tours', '🏠 Alojamiento', '🎯 Experiencias', '🍽️ Comida'].map((item, idx) => (
               <div key={idx} className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100 opacity-70">
                 <div className="text-2xl mb-2">{item.split(' ')[0]}</div>
                 <div className="font-semibold text-gray-700 text-sm">{item.split(' ')[1]}</div>
               </div>
             ))}
          </div>
        </section>

        {/* Active Activity */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Actividad Reciente</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="text-4xl mb-3">📭</div>
            <h3 className="text-gray-900 font-semibold">No tienes viajes activos</h3>
            <p className="text-gray-500 text-sm mt-1">Tus viajes próximos y pasados aparecerán aquí.</p>
          </div>
        </section>

      </div>
    </div>
  );
}
