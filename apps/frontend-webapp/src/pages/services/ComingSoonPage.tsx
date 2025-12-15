'use client';

import React from 'react';
import { Link, useParams } from 'react-router-dom';

const services: Record<string, { icon: string; title: string; description: string }> = {
  tours: {
    icon: '🏔️',
    title: 'TOURS',
    description: 'Operadores acreditados, salidas organizadas, y experiencias únicas por todo Ecuador.',
  },
  experiences: {
    icon: '🎯',
    title: 'EXPERIENCIAS',
    description: 'Actividades locales con cupos y horarios. Conecta con guías expertos.',
  },
  accommodation: {
    icon: '🏠',
    title: 'ALOJAMIENTO',
    description: 'Espacios de anfitriones verificados. Reservas seguras con reglas claras.',
  },
};

export function ComingSoonPage() {
  const { service } = useParams<{ service: string }>();
  const info = services[service || ''] || services.tours;

  return (
    <main className="min-h-screen bg-brand-gray text-going-black font-sans selection:bg-going-yellow selection:text-black flex flex-col">
      {/* Header */}
      <header className="border-b-2 border-black bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-10 w-10 border-2 border-black bg-going-red flex items-center justify-center shadow-neo">
              <span className="text-white font-spaceGrotesk font-black text-xl italic">G</span>
            </div>
            <div className="leading-none">
              <div className="font-spaceGrotesk text-2xl font-black tracking-tighter uppercase">GOING</div>
            </div>
          </Link>
          <Link to="/" className="px-4 py-2 border-2 border-black font-bold text-sm bg-white shadow-neo hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2">
            <span>← VOLVER</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" 
          style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        <div className="relative z-10 text-center max-w-xl w-full">
          <div className="w-32 h-32 mx-auto bg-white border-4 border-black shadow-neo rounded-full flex items-center justify-center text-6xl mb-8 animate-bounce">
            {info.icon}
          </div>
          
          <div className="inline-block px-4 py-1 bg-going-yellow border-2 border-black shadow-[4px_4px_0px_0px_#000] rotate-2 mb-8">
            <span className="font-bold font-mono text-xs uppercase tracking-wider">🚀 PRÓXIMAMENTE</span>
          </div>
          
          <h1 className="font-spaceGrotesk text-6xl font-black uppercase mb-6 bg-white border-2 border-black p-4 shadow-neo inline-block">
            {info.title}
          </h1>
          
          <p className="text-xl font-medium border-2 border-black bg-white p-6 shadow-neo mb-12">
            {info.description}
          </p>
          
          <div className="bg-going-black text-white p-8 border-2 border-black shadow-neo rotate-1 transform hover:rotate-0 transition-all">
            <p className="font-bold uppercase mb-6 text-going-yellow">
              ¿Quieres exclusividad?
            </p>
            <p className="text-sm opacity-80 mb-6">
              Estamos cocinando algo increíble. Déjanos tu correo y sé el primero en probar.
            </p>
            
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); alert('¡Gracias! Te notificaremos.'); }}>
              <input 
                type="email" 
                placeholder="TU@EMAIL.COM"
                className="flex-1 bg-white text-black border-2 border-white px-4 py-3 font-mono font-bold outline-none focus:bg-going-yellow focus:border-going-yellow transition-colors placeholder:text-gray-500"
                required
              />
              <button 
                type="submit"
                className="bg-going-red text-white border-2 border-white px-6 py-3 font-black uppercase hover:bg-white hover:text-going-red transition-all"
              >
                AVISAR
              </button>
            </form>
          </div>
          
          <div className="mt-16 border-t-2 border-black pt-8">
            <p className="font-bold uppercase text-xs text-gray-500 mb-6">SERVICIOS ACTIVOS</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/services/private" className="px-4 py-2 bg-white border-2 border-black font-bold text-sm shadow-sm hover:translate-y-1 hover:shadow-none transition-all uppercase">
                🚗 Privados
              </Link>
              <Link to="/services/shared" className="px-4 py-2 bg-white border-2 border-black font-bold text-sm shadow-sm hover:translate-y-1 hover:shadow-none transition-all uppercase">
                👥 Compartidos
              </Link>
              <Link to="/services/shipments" className="px-4 py-2 bg-white border-2 border-black font-bold text-sm shadow-sm hover:translate-y-1 hover:shadow-none transition-all uppercase">
                📦 Envíos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ComingSoonPage;
