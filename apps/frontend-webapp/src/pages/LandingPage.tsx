'use client';

import React, { useState, useEffect } from 'react';
import { ECUADOR_REGIONS, EcuadorRegion } from '../constants/ecuador-regions';
// Adjust import based on your absolute path or alias configuration
// If alias isn't working in this environment, we might need relative path or ensure tsconfig is right.
// Assuming standard Nx alias:
import { RegionBadge } from '../components/ui/RegionBadge';

type HowTab = 'privado' | 'compartido' | 'envios';

export function LandingPage() {
  return (
    <main className="min-h-screen bg-brand-gray text-going-black font-sans selection:bg-going-yellow selection:text-black">
      <Header />
      <Hero />
      <Services />
      <HowItWorks />
      <Realtime />
      <Ecuador />
      <Academy />
      <EventsCalendar />
      <Ecosystem />
      <Safety />
      <Enterprise />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}

/* ====== THEME HOOK ====== */
function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('going_theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const initial = stored ?? (prefersDark ? 'dark' : 'light');
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('going_theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return { theme, toggle };
}

/* ====== HEADER ====== */
function Header() {
  const { theme, toggle } = useTheme();
  
  const links = [
    { id: 'how', label: 'CÓMO FUNCIONA' },
    { id: 'services', label: 'SERVICIOS' },
    { id: 'ecuador', label: 'DESTINOS' }, // Updated label
    { id: 'enterprise', label: 'EMPRESAS' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/10 backdrop-blur-xl border-b border-white/20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <img src="/assets/logo.png" alt="Going" className="h-10 w-auto brightness-0 invert" />
        </div>

        <nav className="hidden items-center gap-10 md:flex">
          {links.map((l) => (
            <a key={l.id} href={`#${l.id}`} className="text-sm font-black text-white/80 hover:text-white tracking-widest transition-all">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggle}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all font-bold"
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <a href="/login" className="px-6 py-2 bg-brand-red text-white font-black text-sm rounded-full shadow-lg hover:scale-105 transition-all uppercase tracking-widest">
            ACCESO
          </a>
        </div>
      </div>
    </header>
  );
}

/* ====== HERO ====== */
function Hero() {
  const [serviceType, setServiceType] = useState<'privado' | 'compartido' | 'envios'>('privado');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleSearch = () => {
    // Build query params with booking intent
    const params = new URLSearchParams({
      service: serviceType,
      ...(origin && { origin }),
      ...(destination && { destination }),
      ...(date && { date }),
      ...(time && { time }),
    });
    // Navigate to register with booking intent
    window.location.href = `/register?${params.toString()}`;
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-going-black">
      {/* Simple gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-going-black via-gray-900 to-going-black" />
      
      {/* Subtle decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-brand-red/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-going-yellow/10 rounded-full blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl w-full px-6 py-20 flex flex-col lg:flex-row items-center gap-16">
        {/* Left side - Text */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-block px-4 py-1.5 bg-brand-red text-white text-xs font-black tracking-[0.3em] uppercase mb-8 shadow-2xl">
            Ecuador en Movimiento
          </div>
          
          <h1 className="font-spaceGrotesk text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-8 drop-shadow-2xl">
            ECUADOR <br/>
            <span className="text-brand-red">AL MÁXIMO.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 font-medium mb-10 max-w-xl leading-relaxed">
             Conectamos cada rincón del Ecuador con estilo, seguridad y movilidad sustentable.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <a href="/register" className="px-8 py-4 bg-white text-black font-black text-lg rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all">
              EMPEZAR AHORA
            </a>
            <a href="#download" className="px-8 py-4 bg-brand-red text-white font-black text-lg rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all">
              DESCARGAR APP
            </a>
          </div>
        </div>

        {/* Right side - Booking Card */}
        <div className="flex-1 w-full max-w-md">
          <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-black">
            <h2 className="font-spaceGrotesk text-2xl font-black mb-6 text-center">
              Empieza tu viaje
            </h2>

            {/* Service Type Buttons */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setServiceType('privado')}
                className={`flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all ${
                  serviceType === 'privado' 
                    ? 'bg-brand-red text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Viaje Privado
              </button>
              <button
                onClick={() => setServiceType('compartido')}
                className={`flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all ${
                  serviceType === 'compartido' 
                    ? 'bg-going-yellow text-black shadow-lg' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Viaje Compartido
              </button>
              <button
                onClick={() => setServiceType('envios')}
                className={`flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all ${
                  serviceType === 'envios' 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Envíos
              </button>
            </div>

            {/* Departure */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Lugar de salida</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">📍</span>
                <input 
                  type="text" 
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="¿Desde dónde sales?"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl font-medium focus:border-brand-red focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Arrival */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Lugar de llegada</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🎯</span>
                <input 
                  type="text" 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="¿A dónde vas?"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl font-medium focus:border-brand-red focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Día</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-medium focus:border-brand-red focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Hora</label>
                <input 
                  type="time" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-medium focus:border-brand-red focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              onClick={handleSearch}
              className="w-full py-4 bg-going-black text-white font-black text-lg rounded-xl hover:bg-gray-800 transition-colors shadow-lg"
            >
              BUSCAR OPCIONES
            </button>

            {/* Info text */}
            <p className="text-center text-xs text-gray-500 mt-4">
              Regístrate gratis para ver opciones disponibles
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ====== SERVICES ====== */
function Services() {
  const services = [
    { 
      title: 'VIAJES PRIVADOS', 
      desc: 'Chofer personal. Ideal para moverte seguro en la ciudad.', 
      image: '/assets/services/private-ride.png',
      href: '/services/private',
      color: 'going-red'
    },
    { 
      title: 'RUTAS COMPARTIDAS', 
      desc: 'Conecta ciudades. Ahorra viajando de terminal a terminal.', 
      image: '/assets/services/shared-ride.png',
      href: '/services/shared',
      color: 'going-yellow'
    },
    { 
      title: 'ENCOMIENDAS', 
      desc: 'Envíos rápidos entre provincias. Rastreo 24/7.', 
      image: '/assets/services/parcels.png',
      href: '/services/shipments',
      color: 'blue-500'
    },
  ];

  return (
    <section id="services" className="bg-brand-gray py-20 border-b-2 border-black">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
           <div>
             <h2 className="font-spaceGrotesk text-4xl font-black uppercase mb-2">Servicios Integrados</h2>
             <p className="font-medium text-gray-600">Movilidad inteligente para cada necesidad.</p>
           </div>
           <a href="#" className="font-bold underline decoration-2 decoration-going-red underline-offset-4 hover:text-going-red">Ver todo →</a>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {services.map((service) => (
            <a 
              key={service.title}
              href={service.href}
              className="group bg-white border-2 border-black shadow-neo hover:-translate-y-2 transition-all overflow-hidden"
            >
              {/* Photo */}
              <div className="relative h-48 overflow-hidden border-b-2 border-black">
                <img 
                  src={service.image} 
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className={`absolute bottom-3 left-3 px-3 py-1 bg-${service.color} text-white font-bold text-xs uppercase`}>
                  {service.title}
                </div>
              </div>
              {/* Content */}
              <div className="p-6">
                <p className="text-sm text-gray-600 font-medium leading-relaxed">{service.desc}</p>
              </div>
            </a>
          ))}
        </div>
        
        <div className="mt-8 p-4 border-2 border-dashed border-black/30 rounded-lg text-center bg-white/50 backdrop-blur-sm">
            <span className="font-medium text-gray-500">Próximamente: Tours 🏔️ · Experiencias Locales 🥘 · Hospedaje 🏠</span>
        </div>
      </div>
    </section>
  );
}

/* ====== HOW IT WORKS ====== */
function HowItWorks() {
  const [tab, setTab] = useState<HowTab>('privado');

  const content: Record<HowTab, { steps: string[]; color: string }> = {
    privado: { steps: ['Elige origen y destino', 'Selecciona "Auto Privado"', 'Viaja seguro'], color: 'bg-going-red' },
    compartido: { steps: ['Busca tu ruta (ej. UIO-GYE)', 'Reserva tu asiento', 'Viaja cómodo y barato'], color: 'bg-going-yellow' },
    envios: { steps: ['Detalla el paquete', 'Entrega al conductor', 'Rastrea hasta entrega'], color: 'bg-blue-500' },
  };

  return (
    <section id="how" className="py-20 bg-white border-b-2 border-black">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-12">
           <h2 className="font-spaceGrotesk text-4xl font-black uppercase">¿CÓMO USAR GOING?</h2>
           <div className="flex justify-center gap-4 mt-6 flex-wrap">
             {(['privado', 'compartido', 'envios'] as HowTab[]).map((t) => (
                <button 
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-6 py-2 border-2 border-black font-bold uppercase transition-all ${
                    tab === t ? 'bg-black text-white shadow-neo' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {t}
                </button>
             ))}
           </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {content[tab].steps.map((text, idx) => (
            <div key={idx} className="relative group">
              <div className={`absolute inset-0 border-2 border-black translate-x-2 translate-y-2 ${content[tab].color}`}></div>
              <div className="relative bg-white border-2 border-black p-8 h-full flex flex-col items-center text-center transition-transform group-hover:-translate-y-1">
                 <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl mb-4 border-2 border-transparent">
                   {idx + 1}
                 </div>
                 <h3 className="font-bold text-lg">{text}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ====== REALTIME ====== */
function Realtime() {
  return (
    <section className="bg-going-black text-white py-24 border-b-2 border-black overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gray-900 skew-x-12 transform translate-x-20 opacity-50"></div>

      <div className="mx-auto max-w-7xl px-4 relative z-10 grid md:grid-cols-2 gap-16 items-center">
        <div>
           <div className="inline-block px-3 py-1 border border-going-red text-going-red font-mono text-xs mb-4">LIVE OPS</div>
           <h2 className="font-spaceGrotesk text-5xl font-black leading-tight mb-6">
             TU VIAJE <br/>
             <span className="text-going-red">EN TIEMPO REAL.</span>
           </h2>
           <p className="text-gray-400 text-lg mb-8">
             Seguridad y control total. Comparte tu ubicación, chatea con el conductor y recibe notificaciones de estado.
           </p>
           <ul className="space-y-4 font-bold">
             <li className="flex items-center gap-3">
               <span className="w-2 h-2 bg-going-red rounded-full animate-ping"></span>
               Rastreo Satelital Continuo
             </li>
             <li className="flex items-center gap-3">
               <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
               Conexión Directa Conductor
             </li>
             <li className="flex items-center gap-3">
               <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
               Botón de Pánico Integrado
             </li>
           </ul>
        </div>
        
        {/* Mock Phone UI */}
        <div className="relative mx-auto w-64 md:w-80">
          <div className="absolute inset-0 bg-going-red blur-3xl opacity-20"></div>
          <div className="relative bg-white rounded-3xl border-4 border-gray-800 overflow-hidden shadow-2xl">
             <div className="h-full bg-gray-100 p-4">
                {/* Mock Map */}
                <div className="w-full h-40 bg-blue-100 rounded-xl mb-4 relative overflow-hidden">
                   <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px'}}></div>
                   <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-going-black border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg z-10"></div>
                   <div className="absolute top-1/4 left-1/4 w-8 h-8 text-2xl animate-bounce">🚙</div>
                </div>
                <div className="space-y-3">
                   <div className="h-4 bg-gray-300 w-3/4 rounded"></div>
                   <div className="h-3 bg-gray-200 w-1/2 rounded"></div>
                   <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div>
                         <div className="h-3 bg-gray-800 w-20 rounded mb-1"></div>
                         <div className="h-2 bg-gray-400 w-12 rounded"></div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ====== ECUADOR SECTION / TOURISM EXPO ====== */
function Ecuador() {
  // Map region labels to their photo paths
  const regionImages: Record<string, string> = {
    Costa: '/assets/regions/costa.png',
    Sierra: '/assets/regions/sierra.png',
    Amazonía: '/assets/regions/amazonia.png',
    Galápagos: '/assets/regions/galapagos.png',
  };

  return (
    <section id="ecuador" className="py-24 bg-gray-100 border-b-2 border-black relative overflow-hidden">
       <div className="mx-auto max-w-7xl px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16">
            <div className="max-w-2xl">
              <h2 className="font-spaceGrotesk text-5xl font-black uppercase mb-4 leading-tight">EXPLORA <br/><span className="text-brand-red">EL ECUADOR.</span></h2>
              <p className="text-xl text-gray-600 font-medium">
                Una vitrina completa de experiencias, destinos y cultura. Desde los Andes hasta Galápagos.
              </p>
            </div>
            <div className="hidden md:block w-32 h-32 bg-brand-red rounded-full flex items-center justify-center text-white font-black text-xs text-center border-2 border-black shadow-neo -rotate-12">
              TURISMO<br/>SOSTENIBLE
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-20">
             {Object.values(ECUADOR_REGIONS).map((region: typeof ECUADOR_REGIONS[keyof typeof ECUADOR_REGIONS]) => (
               <div key={region.label} className="bg-white border-2 border-black shadow-neo hover:-translate-y-2 transition-all group overflow-hidden">
                 {/* Real Photo */}
                 <div className="relative w-full h-48 overflow-hidden border-b-2 border-black">
                    <img 
                      src={regionImages[region.label]} 
                      alt={`${region.label} - ${region.slogan}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <RegionBadge region={region.label.toUpperCase() as EcuadorRegion} />
                    </div>
                 </div>
                 {/* Content */}
                 <div className="p-6">
                    <h3 className="font-black text-2xl mb-2" style={{color: region.colorHex}}>{region.slogan}</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">{region.description}</p>
                 </div>
               </div>
             ))}
          </div>

          <div className="bg-black text-white p-12 rounded-[40px] border-4 border-brand-red shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-1/2 h-full opacity-20">
               <img src="/assets/regions/galapagos.png" alt="" className="w-full h-full object-cover" />
             </div>
             <div className="relative z-10">
               <h3 className="font-spaceGrotesk text-3xl font-black mb-8 border-b border-white/20 pb-4">SERVICIOS TURÍSTICOS DESTACADOS</h3>
               <div className="grid md:grid-cols-3 gap-8">
                  <div className="group">
                    <div className="relative h-40 rounded-2xl overflow-hidden mb-4 border-2 border-white/20">
                      <img src="/assets/tours/cotopaxi.png" alt="Tours de Aventura" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/30" />
                    </div>
                    <h4 className="font-bold text-xl mb-2 text-brand-red uppercase">Tours de Aventura</h4>
                    <p className="text-gray-400 text-sm font-medium">Ascensos al Cotopaxi, Quilotoa y selva primaria.</p>
                  </div>
                  <div className="group">
                    <div className="relative h-40 rounded-2xl overflow-hidden mb-4 border-2 border-white/20">
                      <img src="/assets/tours/gastronomy.png" alt="Gastronomy Expo" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/30" />
                    </div>
                    <h4 className="font-bold text-xl mb-2 text-brand-red uppercase">Gastronomy Expo</h4>
                    <p className="text-gray-400 text-sm font-medium">Rutas del cacao, ceviches y cocina andina.</p>
                  </div>
                  <div className="group">
                    <div className="relative h-40 rounded-2xl overflow-hidden mb-4 border-2 border-white/20">
                      <img src="/assets/regions/amazonia.png" alt="Hidden Stays" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/30" />
                    </div>
                    <h4 className="font-bold text-xl mb-2 text-brand-red uppercase">Hidden Stays</h4>
                    <p className="text-gray-400 text-sm font-medium">Eco-lodges y haciendas históricas certificadas.</p>
                  </div>
               </div>
             </div>
          </div>
       </div>
    </section>
  );
}



/* ====== SAFETY & ENTERPRISE (Simplified for brevity but styled) ====== */
function Safety() {
  return (
    <section id="safety" className="py-20 bg-white border-b-2 border-black">
      <div className="mx-auto max-w-4xl px-4 text-center">
         <div className="w-16 h-16 bg-black text-white text-3xl flex items-center justify-center mx-auto mb-6">🛡️</div>
         <h2 className="font-spaceGrotesk text-3xl font-black mb-4">SEGURIDAD ANTE TODO</h2>
         <p className="text-gray-600 mb-8 max-w-xl mx-auto">
           Verificación de identidad, monitoreo de ruta y soporte 24/7. Viajar en Ecuador nunca fue tan seguro.
         </p>
         <a href="#" className="font-bold border-b-2 border-black pb-0.5 hover:text-going-red hover:border-going-red">Conoce nuestros estándares</a>
      </div>
    </section>
  );
}

function Enterprise() {
  return (
    <section id="enterprise" className="py-20 bg-brand-gray border-b-2 border-black">
       <div className="mx-auto max-w-7xl px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-spaceGrotesk text-4xl font-black mb-4">GOING CORPORATIVO</h2>
            <p className="mb-6 font-medium">Soluciones de transporte para empresas. Control de gastos, facturación centralizada y reportes detallados.</p>
            <button className="px-6 py-3 bg-black text-white font-bold border-2 border-transparent hover:bg-white hover:text-black hover:border-black transition-colors">
              CONTACTAR VENTAS
            </button>
          </div>
          <div className="p-8 bg-white border-2 border-black shadow-neo">
             <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
                <span className="font-bold">DASHBOARD CORPORATIVO</span>
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
             </div>
             <div className="space-y-4 opacity-50">
                <div className="h-4 bg-gray-200 w-full"></div>
                <div className="h-4 bg-gray-200 w-5/6"></div>
                <div className="h-4 bg-gray-200 w-4/6"></div>
             </div>
          </div>
       </div>
    </section>
  );
}

/* ====== ACADEMY SECTION ====== */
function Academy() {
  return (
    <section id="academy" className="py-24 bg-white border-b-2 border-black overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-black"></div>
      <div className="mx-auto max-w-7xl px-4 grid md:grid-cols-2 gap-16 items-center">
        <div className="order-2 md:order-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-64 bg-brand-red border-2 border-black shadow-neo flex items-center justify-center -rotate-2">
              <span className="text-white font-black text-4xl">🎓</span>
            </div>
            <div className="h-64 bg-going-yellow border-2 border-black shadow-neo flex items-center justify-center rotate-3 translate-y-8">
              <span className="text-black font-black text-4xl">🌟</span>
            </div>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div className="inline-block px-3 py-1 bg-black text-white font-mono text-xs mb-6 uppercase tracking-widest">Capacitación Premier</div>
          <h2 className="font-spaceGrotesk text-5xl font-black mb-6 leading-none">GOING <br/><span className="text-brand-red">ACADEMY.</span></h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed font-medium">
            Formamos a los mejores proveedores turísticos del Ecuador. Certifícate con nosotros y eleva tu servicio al estándar internacional.
          </p>
          <ul className="space-y-4 mb-10">
            <li className="flex items-center gap-3 font-bold">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
              Protocolos de Seguridad Vial
            </li>
            <li className="flex items-center gap-3 font-bold">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
              Guianza Turística Especializada
            </li>
            <li className="flex items-center gap-3 font-bold">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
              Atención al Cliente de Clase Mundial
            </li>
          </ul>
          <button className="px-8 py-4 bg-black text-white font-black rounded-full hover:scale-105 transition-all shadow-neo">
            ÚNETE COMO PROVEEDOR
          </button>
        </div>
      </div>
    </section>
  );
}

/* ====== EVENTS CALENDAR ====== */
function EventsCalendar() {
  const events = [
    { name: 'Fiestas de Quito', date: 'Diciembre', place: 'Pichincha', icon: '💃' },
    { name: 'Carnaval de Guaranda', date: 'Febrero', place: 'Bolívar', icon: '🎭' },
    { name: 'Inti Raymi', date: 'Junio', place: 'Sierra Norte', icon: '☀️' },
    { name: 'Mama Negra', date: 'Noviembre', place: 'Latacunga', icon: '🐎' },
  ];

  return (
    <section id="calendar" className="py-24 bg-brand-gray border-b-2 border-black">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="font-spaceGrotesk text-4xl font-black uppercase mb-2">CALENDARIO CULTURAL</h2>
            <p className="font-medium text-gray-600">No te pierdas de lo mejor del Ecuador este año.</p>
          </div>
          <div className="text-6xl opacity-20">📅</div>
        </div>
        
        <div className="grid md:grid-cols-4 gap-6">
          {events.map((ev, i) => (
            <div key={i} className="bg-white border-2 border-black p-6 hover:-translate-y-2 transition-all shadow-neo flex flex-col items-center text-center">
              <span className="text-4xl mb-4">{ev.icon}</span>
              <h3 className="font-black text-lg mb-1">{ev.name}</h3>
              <p className="text-brand-red font-bold text-sm uppercase mb-2">{ev.date}</p>
              <p className="text-gray-400 text-xs font-bold">{ev.place}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ====== FAQ ====== */
function FAQ() {
  return (
    <section className="py-20 bg-white border-b-2 border-black">
       <div className="mx-auto max-w-3xl px-4">
         <h2 className="font-spaceGrotesk text-3xl font-black mb-8 text-center">DUDAS FRECUENTES</h2>
         <div className="space-y-4">
            <details className="border-2 border-black p-4 shadow-[4px_4px_0px_0px_#ddd] open:shadow-none open:translate-y-1 transition-all">
               <summary className="font-bold cursor-pointer list-none flex justify-between">
                 ¿Cómo me registro como conductor? <span>+</span>
               </summary>
               <p className="mt-4 text-gray-600">Descarga la App Conductor, sube tu licencia, matrícula y antecedentes. Nuestro equipo validará tu perfil en 24h.</p>
            </details>
            <details className="border-2 border-black p-4 shadow-[4px_4px_0px_0px_#ddd] open:shadow-none open:translate-y-1 transition-all">
               <summary className="font-bold cursor-pointer list-none flex justify-between">
                 ¿Qué métodos de pago aceptan? <span>+</span>
               </summary>
               <p className="mt-4 text-gray-600">Aceptamos efectivo, tarjetas de crédito/débito y transferencia directa en la App.</p>
            </details>
            <details className="border-2 border-black p-4 shadow-[4px_4px_0px_0px_#ddd] open:shadow-none open:translate-y-1 transition-all">
               <summary className="font-bold cursor-pointer list-none flex justify-between">
                 ¿Cubren rutas interprovinciales? <span>+</span>
               </summary>
               <p className="mt-4 text-gray-600">Sí, cubrimos rutas populares como Quito-Cuenca, Guayaquil-Salinas, etc. en modalidad compartida y privada.</p>
            </details>
         </div>
       </div>
    </section>
  );
}

/* ====== ECOSYSTEM / APP LINKS ====== */
function Ecosystem() {
  return (
    <section id="download" className="py-24 bg-black border-b-2 border-black text-white relative">
      <div className="mx-auto max-w-7xl px-4 grid md:grid-cols-2 gap-12">
        <div className="p-10 border-4 border-brand-red rounded-[40px] shadow-neo bg-neutral-900 group hover:scale-[1.02] transition-transform">
          <div className="text-6xl mb-6">📱</div>
          <h3 className="font-spaceGrotesk text-3xl font-black mb-4">GOING PARA USUARIOS</h3>
          <p className="text-gray-400 mb-8 font-medium">La SuperApp para moverte, enviar paquetes y descubrir el Ecuador.</p>
          <div className="flex gap-4">
            <button className="px-6 py-3 bg-white text-black font-black rounded-full hover:bg-brand-red hover:text-white transition-colors">STORE</button>
            <button className="px-6 py-3 border-2 border-white text-white font-black rounded-full">PLAY STORE</button>
          </div>
        </div>
        
        <div className="p-10 border-4 border-white rounded-[40px] shadow-neo bg-neutral-800 group hover:scale-[1.02] transition-transform">
          <div className="text-6xl mb-6">🚕</div>
          <h3 className="font-spaceGrotesk text-3xl font-black mb-4">GOING PARA SOCIOS</h3>
          <p className="text-gray-400 mb-8 font-medium">Genera ingresos, certifícate en la Academy y sé parte del cambio en la movilidad.</p>
          <div className="flex gap-4">
            <button className="px-6 py-3 bg-white text-black font-black rounded-full">DRIVER STORE</button>
            <button className="px-6 py-3 border-2 border-white text-white font-black rounded-full hover:bg-white hover:text-black transition-colors">DRIVER PLAY</button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ====== FINAL CTA & FOOTER ====== */
function FinalCTA() {
  return (
    <section className="py-24 bg-going-red text-white text-center">
       <div className="mx-auto max-w-4xl px-4">
         <h2 className="font-spaceGrotesk text-5xl font-black mb-8">¿LISTO PARA PARTIR?</h2>
         <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="px-10 py-5 bg-black text-white font-black text-xl rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all">
              DESCARGAR EN ANDROID
            </button>
            <button className="px-10 py-5 bg-white text-brand-red font-black text-xl rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all">
              DESCARGAR EN IOS
            </button>
          </div>
       </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-16 bg-black text-white border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-10">
         <div className="font-spaceGrotesk text-3xl font-black italic tracking-tighter">GOING</div>
         <div className="text-sm text-gray-500 font-medium">© 2024 Going Ecuador. Hecho con ❤️ para mover al país.</div>
         <div className="flex gap-10 font-black text-xs tracking-widest uppercase">
            <a href="#" className="text-white/60 hover:text-brand-red transition-colors">Términos</a>
            <a href="#" className="text-white/60 hover:text-brand-red transition-colors">Privacidad</a>
            <a href="#" className="text-white/60 hover:text-brand-red transition-colors">Soporte</a>
         </div>
      </div>
    </footer>
  );
}
