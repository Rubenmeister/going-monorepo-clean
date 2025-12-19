import { useAuth } from '../../contexts';
import { Link } from 'react-router-dom';

export function CustomerDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header with Glassmorphism */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100/50">
        <div className="flex justify-between items-center max-w-4xl mx-auto p-6">
          <div>
             <h1 className="text-2xl font-black tracking-tight text-gray-900 animate-fade-in">
               Hola, {user?.name?.split(' ')[0]} <span className="inline-block animate-bounce">👋</span>
             </h1>
             <p className="text-sm font-medium text-gray-400">¿Listo para tu próxima aventura?</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-red to-brand-yellow p-[2px] shadow-lg">
             <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-brand-red font-bold">
               {user?.name?.charAt(0)}
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-8 animate-fade-in [animation-delay:200ms]">
        
        {/* Promo Banner - Carousel Placeholder */}
        <section className="relative overflow-hidden rounded-3xl bg-gray-900 text-white shadow-xl group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-red via-red-500 to-orange-500 opacity-90 group-hover:scale-105 transition-transform duration-700"></div>
          {/* Noise texture overlay could go here */}
          <div className="relative p-8 flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="space-y-2 z-10">
               <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold border border-white/10">NUEVO</span>
               <h2 className="text-3xl font-black italic tracking-tighter">VIAJES COMPARTIDOS</h2>
               <p className="text-white/80 max-w-sm">Ahorra hasta un 40% viajando entre ciudades en nuestras nuevas rutas premium.</p>
               <button className="mt-4 px-6 py-2 bg-white text-brand-red rounded-full font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                 Ver Rutas
               </button>
             </div>
             <div className="text-9xl opacity-20 rotate-12 absolute -right-4 -bottom-8 select-none">🚍</div>
          </div>
        </section>

        {/* Main Services Grid */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-bold text-gray-800 tracking-tight">Servicios GOING</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Private Ride Card */}
            <Link to="/c/trips" className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(255,76,65,0.15)] hover:-translate-y-1 border border-transparent hover:border-brand-red/10">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <span className="text-8xl">🚗</span>
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-red/10 to-transparent flex items-center justify-center text-3xl mb-4 group-hover:bg-brand-red group-hover:text-white transition-colors duration-300">
                  🚗
                </div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-red transition-colors">Viaje Privado</h3>
                <p className="text-sm text-gray-500 mt-2 font-medium">Conductores verificados a tu disposición 24/7.</p>
              </div>
            </Link>

            {/* Shared Ride Card */}
            <Link to="/c/bookings" className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,102,255,0.15)] hover:-translate-y-1 border border-transparent hover:border-blue-500/10">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <span className="text-8xl">👥</span>
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-transparent flex items-center justify-center text-3xl mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  👥
                </div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Compartido</h3>
                <p className="text-sm text-gray-500 mt-2 font-medium">Conecta ciudades pagando solo por tu asiento.</p>
              </div>
            </Link>

            {/* Shipping Card */}
            <Link to="/c/trips?service=shipping" className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(255,210,83,0.25)] hover:-translate-y-1 border border-transparent hover:border-yellow-500/10">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <span className="text-8xl">📦</span>
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-100 to-transparent flex items-center justify-center text-3xl mb-4 group-hover:bg-yellow-500 group-hover:text-white transition-colors duration-300">
                  📦
                </div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">Envíos</h3>
                <p className="text-sm text-gray-500 mt-2 font-medium">Logística rápida para tus paquetes.</p>
              </div>
            </Link>

          </div>
        </section>

        {/* Coming Soon Section */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
             <h2 className="text-lg font-bold text-gray-800 tracking-tight">Próximamente</h2>
             <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Explora</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {['🏔️ Tours', '🏠 Hoteles', '🎯 Eventos', '🍽️ Delivery'].map((item, idx) => (
               <div key={idx} className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow grayscale hover:grayscale-0 cursor-not-allowed opacity-60 hover:opacity-100">
                 <div className="text-3xl mb-2 filter drop-shadow-sm">{item.split(' ')[0]}</div>
                 <div className="font-bold text-gray-700 text-xs">{item.split(' ')[1]}</div>
               </div>
             ))}
          </div>
        </section>

        {/* Active Activity with "Ticket" styling */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4 px-1 tracking-tight">Actividad</h2>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-gray-200"></div>
            <div className="p-8 text-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
               <div className="inline-flex w-16 h-16 rounded-full bg-gray-50 items-center justify-center mb-4 border border-gray-100">
                 <span className="text-3xl animate-pulse">✨</span>
               </div>
               <h3 className="text-gray-900 font-bold text-lg">Todo listo para tu viaje</h3>
               <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">Cuando reserves un viaje o hagas un envío, podrás seguirlo aquí en tiempo real.</p>
               
               <div className="mt-6 flex justify-center gap-2 text-sm">
                 <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 font-bold text-xs">SIN VIAJES ACTIVOS</span>
               </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
