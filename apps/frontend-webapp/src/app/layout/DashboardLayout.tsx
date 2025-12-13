import React, { useState } from 'react';
import { LayoutDashboard, Car, Hotel, Map, Ticket, CreditCard, GraduationCap, Navigation, User, Menu, X } from 'lucide-react';
import { FloatingCTA } from '../components/FloatingCTA';

const services = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'transport', label: 'Transporte', icon: <Car size={20} /> },
  { id: 'accommodation', label: 'Alojamiento', icon: <Hotel size={20} /> },
  { id: 'tours', label: 'Tours', icon: <Map size={20} /> },
  { id: 'activities', label: 'Actividades', icon: <Ticket size={20} /> },
  { id: 'tracking', label: 'Seguimiento', icon: <Navigation size={20} /> },
  { id: 'wallet', label: 'Pagos', icon: <CreditCard size={20} /> },
  { id: 'academy', label: 'Academy', icon: <GraduationCap size={20} /> },
  { id: 'profile', label: 'Perfil', icon: <User size={20} /> },
];

export const DashboardLayout = ({ children, activeModule, setActiveModule }: any) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r h-full shadow-sm">
        <div className="p-6 text-center"><h1 className="text-3xl font-black text-[#ff4c41]">Going.</h1></div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {services.map((s) => (
            <button key={s.id} onClick={() => setActiveModule(s.id)}
              className={w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all }>
              {s.icon} <span className="text-sm font-medium">{s.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col h-full relative">
        <header className="md:hidden h-16 bg-white border-b flex items-center justify-between px-4">
          <span className="text-2xl font-black text-[#ff4c41]">Going.</span>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600"><Menu /></button>
        </header>
        {isMobileMenuOpen && (
          <div className="absolute inset-0 bg-white z-50 p-4 md:hidden">
            <button onClick={() => setIsMobileMenuOpen(false)} className="mb-4"><X /></button>
            <div className="grid grid-cols-2 gap-4">
              {services.map((s) => (
                <button key={s.id} onClick={() => {setActiveModule(s.id); setIsMobileMenuOpen(false)}} className="flex flex-col items-center p-4 border rounded-xl">
                  {s.icon} <span className="mt-2 text-xs">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex-1 overflow-auto p-4 md:p-8 pb-32">{children}</div>
        
        {/* Floating CTA */}
        <FloatingCTA />
      </main>
    </div>
  );
};
