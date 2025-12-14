import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Carousel } from '../../components/ui/Carousel';
import { motion } from 'framer-motion';
import suvImage from '/suv_black_right_v2.png';
import { Sidebar } from '../../components/ui/Sidebar';

// Featured destinations for the carousel
const featuredPlaces = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1200&q=80',
    title: 'Cartagena',
    subtitle: 'Ciudad amurallada, playas del Caribe',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1583531172005-763a424f0d9c?w=1200&q=80',
    title: 'Medellín',
    subtitle: 'La ciudad de la eterna primavera',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1577587230708-187fdbef4d91?w=1200&q=80',
    title: 'Bogotá',
    subtitle: 'Capital vibrante y cultural',
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1569161031678-f49b4b9ca1c2?w=1200&q=80',
    title: 'Santa Marta',
    subtitle: 'Playa, sierra y naturaleza',
  },
];

export const HomeScreen: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 border-2 border-black">
      <div className="animate-marquee bg-brand-red text-white whitespace-nowrap overflow-hidden">
        <div className="animate-marquee inline-block px-4">
          MOVE NOW • JOIN THE RIDE • NOS MOVEMOS CONTIGO
        </div>
      </div>
      {/* SUV Animation */}
      <motion.img
        src={suvImage as unknown as string}
        alt="SUV"
        className="absolute inset-y-1/2 left-0 w-48 h-auto object-contain"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Menu Button */}
          <button 
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-xl font-bold text-brand-black">Going</span>
          </div>

          {/* Profile Button */}
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            aria-label="Profile"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Welcome Section */}
        <section className="text-center py-6">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-black mb-2">
            ¿A dónde vamos hoy?
          </h1>
          <p className="text-gray-500">
            Nos movemos contigo
          </p>
        </section>

        {/* Action Buttons - Main CTAs */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Trip */}
          <button 
            onClick={() => navigate('/trips/new')}
            className="group relative bg-gradient-to-br from-brand-red to-red-600 rounded-2xl p-6 text-white shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 transition-all duration-300 hover:-translate-y-1 border-2 border-black"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold">Iniciar Viaje</h2>
                <p className="text-white/80 text-sm">Solicita un conductor ahora</p>
              </div>
            </div>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </button>

          {/* Send Package */}
          <button 
            onClick={() => navigate('/packages/new')}
            className="group relative bg-gradient-to-br from-brand-black to-gray-800 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-black"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold">Enviar Paquete</h2>
                <p className="text-white/80 text-sm">Entrega rápida y segura</p>
              </div>
            </div>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </button>
        </section>

        {/* Featured Destinations Carousel */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-brand-black">Destinos Populares</h2>
            <button 
              onClick={() => navigate('/explore')}
              className="text-brand-red hover:text-red-600 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              Ver todos
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <Carousel items={featuredPlaces} />
        </section>

        {/* Quick Actions Grid */}
        <section>
          <h2 className="text-xl font-bold text-brand-black mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: 'clock', label: 'Historial', path: '/history' },
              { icon: 'heart', label: 'Favoritos', path: '/favorites' },
              { icon: 'wallet', label: 'Pagos', path: '/payments' },
              { icon: 'gift', label: 'Promociones', path: '/promotions' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col items-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-brand-red/10 flex items-center justify-center">
                  {item.icon === 'clock' && (
                    <svg className="w-5 h-5 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {item.icon === 'heart' && (
                    <svg className="w-5 h-5 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                  {item.icon === 'wallet' && (
                    <svg className="w-5 h-5 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  )}
                  {item.icon === 'gift' && (
                    <svg className="w-5 h-5 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
