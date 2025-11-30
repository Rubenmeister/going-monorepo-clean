import React, { useState } from 'react';
import { 
  LayoutDashboard, Car, Hotel, Map, Ticket, 
  CreditCard, GraduationCap, Navigation, User, Menu, X 
} from 'lucide-react';

// DEFINICIÓN DE LOS 9 SERVICIOS (Menú Principal)
const services = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={24} /> },
  { id: 'transport', label: 'Transporte', icon: <Car size={24} /> },
  { id: 'accommodation', label: 'Alojamiento', icon: <Hotel size={24} /> },
  { id: 'tours', label: 'Tours & Viajes', icon: <Map size={24} /> },
  { id: 'activities', label: 'Actividades', icon: <Ticket size={24} /> },
  { id: 'tracking', label: 'Seguimiento', icon: <Navigation size={24} /> },
  { id: 'wallet', label: 'Pagos', icon: <CreditCard size={24} /> },
  { id: 'academy', label: 'Going Academy', icon: <GraduationCap size={24} /> },
  { id: 'profile', label: 'Perfil', icon: <User size={24} /> },
];

export const DashboardLayout = ({ children, activeModule, setActiveModule }: any) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* 1. SIDEBAR (Solo Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-full shadow-sm z-20">
        <div className="p-6 flex items-center justify-center border-b border-gray-100">
          <h1 className="text-3xl font-black text-[#ff4c41] tracking-tight">Going.</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {services.map((service) => (
              <li key={service.id}>
                <button
                  onClick={() => setActiveModule(service.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeModule === service.id 
                      ? 'bg-[#ff4c41] text-white shadow-md shadow-red-100 font-bold' 
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {service.icon}
                  <span className="text-sm">{service.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">U</div>
            <div>
              <p className="text-sm font-bold text-gray-800">Usuario Demo</p>
              <p className="text-xs text-gray-400">Turista</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header Móvil */}
        <header className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-20">
          <span className="text-2xl font-black text-[#ff4c41]">Going.</span>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600">
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </header>

        {/* Menú Móvil Desplegable (Overlay) */}
        {isMobileMenuOpen && (
          <div className="absolute inset-0 bg-white z-50 flex flex-col p-4 md:hidden animate-in slide-in-from-top-10">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xl font-bold text-gray-800">Menú</span>
              <button onClick={() => setIsMobileMenuOpen(false)}><X /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 overflow-y-auto">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => { setActiveModule(service.id); setIsMobileMenuOpen(false); }}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border ${
                    activeModule === service.id ? 'border-[#ff4c41] bg-red-50 text-[#ff4c41]' : 'border-gray-100 bg-gray-50 text-gray-600'
                  }`}
                >
                  {service.icon}
                  <span className="mt-2 text-xs font-bold">{service.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* El contenido real inyectado aquí */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>

        {/* 3. BOTTOM BAR (Navegación Rápida Móvil) */}
        <div className="md:hidden h-16 bg-white border-t border-gray-200 flex justify-around items-center px-2 z-10 shrink-0">
          {services.slice(0, 5).map((service) => ( // Mostramos solo los 5 principales abajo
            <button 
              key={service.id}
              onClick={() => setActiveModule(service.id)}
              className={`flex flex-col items-center justify-center w-full h-full ${
                activeModule === service.id ? 'text-[#ff4c41]' : 'text-gray-400'
              }`}
            >
              {React.cloneElement(service.icon as any, { size: 20 })}
              <span className="text-[10px] mt-1 font-medium truncate w-14 text-center">{service.label}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};
