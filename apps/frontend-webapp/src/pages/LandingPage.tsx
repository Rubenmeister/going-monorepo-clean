'use client';

import React, { useState, useEffect } from 'react';

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
    { id: 'enterprise', label: 'EMPRESAS' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b-2 border-black bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 border-2 border-black bg-going-red flex items-center justify-center shadow-neo">
            <span className="text-white font-spaceGrotesk font-black text-xl italic">G</span>
          </div>
          <div className="leading-none">
            <div className="font-spaceGrotesk text-2xl font-black tracking-tighter uppercase">GOING</div>
          </div>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a key={l.id} href={`#${l.id}`} className="text-sm font-bold border-b-2 border-transparent hover:border-going-red transition-all">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            className="h-10 w-10 flex items-center justify-center border-2 border-black bg-white shadow-neo hover:translate-y-1 hover:shadow-none transition-all rounded-none"
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <a href="#download" className="hidden md:flex px-4 py-2 bg-going-black text-white font-bold border-2 border-black shadow-neo hover:translate-y-1 hover:shadow-none transition-all items-center gap-2">
            <span>APP</span>
            <span className="text-going-yellow text-xs">▼</span>
          </a>
        </div>
      </div>
    </header>
  );
}

/* ====== HERO ====== */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-white border-b-2 border-black">
      {/* Decorative Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:grid-cols-2">
        <div className="relative z-10">
          <div className="inline-block px-4 py-1 bg-going-yellow border-2 border-black shadow-neo mb-6 transform -rotate-2">
            <span className="font-bold font-mono text-xs uppercase tracking-wider">Lanzamiento Oficial</span>
          </div>
          
          <h1 className="font-spaceGrotesk text-5xl font-black leading-none tracking-tighter md:text-7xl mb-6">
            MUEVETE <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-going-red to-orange-600">SIN LÍMITES.</span>
          </h1>
          
          <p className="text-lg font-medium border-l-4 border-going-black pl-4 mb-8 max-w-md">
            Viajes privados, compartidos y envíos. Una sola app para dominar la ciudad.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <a href="#download" className="px-8 py-4 bg-going-red text-white font-black text-lg border-2 border-black shadow-neo hover:translate-y-1 hover:shadow-none transition-all text-center">
              DESCARGAR APP
            </a>
            <a href="#how" className="px-8 py-4 bg-white text-black font-bold text-lg border-2 border-black shadow-neo hover:translate-y-1 hover:shadow-none transition-all text-center">
              EXPLORAR
            </a>
          </div>

          <div className="mt-10 flex gap-4">
             <div className="flex -space-x-3">
               {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full bg-gray-300 border-2 border-black"></div>)}
             </div>
             <div className="flex flex-col justify-center">
               <span className="font-bold text-sm">+2k Usuarios</span>
               <span className="text-xs text-gray-500">Confían en nosotros</span>
             </div>
          </div>
        </div>

        <div className="relative h-[400px] flex items-center justify-center">
          {/* Background Blob */}
          <div className="absolute w-[400px] h-[400px] bg-going-yellow rounded-full border-2 border-black opacity-20 blur-3xl animate-pulse"></div>
          
          {/* SUV Animation */}
          <div className="relative w-full max-w-lg z-20 animate-drive-arrive">
             <img 
               src="/suv_black_right_v2.png" 
               alt="Going SUV" 
               className="w-full drop-shadow-2xl transform hover:scale-105 transition-transform duration-500"
             />
             {/* Map Marker Floating */}
             <div className="absolute -top-10 right-20 bg-white px-4 py-2 border-2 border-black shadow-neo animate-bounce">
               <span className="font-bold">📍 Tu destino</span>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ====== SERVICES ====== */
function Services() {
  return (
    <section id="services" className="bg-brand-gray py-20 border-b-2 border-black">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
           <div>
             <h2 className="font-spaceGrotesk text-4xl font-black uppercase mb-2">Nuestros Servicios</h2>
             <p className="font-medium text-gray-600">Todo lo que necesitas en una sola plataforma.</p>
           </div>
           <a href="#" className="font-bold underline decoration-2 decoration-going-red underline-offset-4 hover:text-going-red">Ver todo →</a>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <ServiceCard 
            title="VIAJES PRIVADOS" 
            desc="Tu chofer personal. Coches premium y estándar para moverte con estilo." 
            icon="🚗" 
            href="/services/private" 
            active 
          />
          <ServiceCard 
            title="COMPARTIDOS" 
            desc="Rutas inteligentes. Comparte gastos y conoce gente en tu camino." 
            icon="👥" 
            href="/services/shared" 
            active 
            accent="yellow"
          />
          <ServiceCard 
            title="ENVÍOS FLASH" 
            desc="Paquetería express. Rastreo en tiempo real y entregas seguras." 
            icon="📦" 
            href="/services/shipments" 
            active 
            accent="blue"
          />
        </div>
        
        <div className="mt-8 p-4 border-2 border-dashed border-black/30 rounded-lg text-center">
            <span className="font-medium text-gray-500">Próximamente: Tours 🏔️ · Experiencias 🎯 · Alojamiento 🏠</span>
        </div>
      </div>
    </section>
  );
}

/* ====== HOW IT WORKS ====== */
function HowItWorks() {
  const [tab, setTab] = useState<HowTab>('privado');

  const content: Record<HowTab, { steps: string[]; color: string }> = {
    privado: { steps: ['Elige tu destino', 'Selecciona "Privado"', 'Disfruta el confort'], color: 'bg-going-red' },
    compartido: { steps: ['Busca tu ruta', 'Reserva tu asiento', 'Ahorra viajando'], color: 'bg-going-yellow' },
    envios: { steps: ['Detalla el paquete', 'Solicita recolector', 'Entrega confirmada'], color: 'bg-blue-500' },
  };

  return (
    <section id="how" className="py-20 bg-white border-b-2 border-black">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-12">
           <h2 className="font-spaceGrotesk text-4xl font-black uppercase">¿CÓMO FUNCIONA?</h2>
           <div className="flex justify-center gap-4 mt-6">
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
           <div className="inline-block px-3 py-1 border border-going-red text-going-red font-mono text-xs mb-4">LIVE TRACKING</div>
           <h2 className="font-spaceGrotesk text-5xl font-black leading-tight mb-6">
             CONTROL TOTAL <br/>
             <span className="text-going-red">EN TUS MANOS.</span>
           </h2>
           <p className="text-gray-400 text-lg mb-8">
             Olvídate de la incertidumbre. Rastrea tu conductor, tu paquete o tu viaje compartido segundo a segundo.
           </p>
           <ul className="space-y-4 font-bold">
             <li className="flex items-center gap-3">
               <span className="w-2 h-2 bg-going-red rounded-full animate-ping"></span>
               Ubicación GPS Exacta
             </li>
             <li className="flex items-center gap-3">
               <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
               Chat con el Conductor
             </li>
             <li className="flex items-center gap-3">
               <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
               Botón de Seguridad
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
                   <div className="absolute top-1/4 left-1/4 w-8 h-8 text-2xl animate-bounce">🚗</div>
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

/* ====== ECUADOR SECTION ====== */
function Ecuador() {
  return (
    <section className="py-20 bg-going-yellow border-b-2 border-black">
       <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="font-spaceGrotesk text-4xl font-black uppercase mb-8">ORGULLOSAMENTE ECUATORIANOS 🇪🇨</h2>
          <div className="flex flex-wrap justify-center gap-4">
             {['COSTA', 'SIERRA', 'ORIENTE', 'GALÁPAGOS'].map(region => (
               <span key={region} className="px-6 py-2 bg-white border-2 border-black font-bold shadow-neo transform hover:-rotate-2 transition-transform cursor-default">
                 {region}
               </span>
             ))}
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
         <h2 className="font-spaceGrotesk text-3xl font-black mb-4">SEGURIDAD PRIMERO</h2>
         <p className="text-gray-600 mb-8 max-w-xl mx-auto">
           Monitoreo 24/7, conductores verificados y seguro de viaje en cada trayecto. Tu tranquilidad no es negociable.
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
            <h2 className="font-spaceGrotesk text-4xl font-black mb-4">GOING PARA EMPRESAS</h2>
            <p className="mb-6 font-medium">Gestiona la movilidad de tu equipo con facturación mensual y control total.</p>
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

/* ====== FAQ ====== */
function FAQ() {
  return (
    <section className="py-20 bg-white border-b-2 border-black">
       <div className="mx-auto max-w-3xl px-4">
         <h2 className="font-spaceGrotesk text-3xl font-black mb-8 text-center">PREGUNTAS FRECUENTES</h2>
         <div className="space-y-4">
            <details className="border-2 border-black p-4 shadow-[4px_4px_0px_0px_#ddd] open:shadow-none open:translate-y-1 transition-all">
               <summary className="font-bold cursor-pointer list-none flex justify-between">
                 ¿Cómo me registro como conductor? <span>+</span>
               </summary>
               <p className="mt-4 text-gray-600">Descarga la app de conductores, sube tus documentos y en 24h te contactaremos.</p>
            </details>
            <details className="border-2 border-black p-4 shadow-[4px_4px_0px_0px_#ddd] open:shadow-none open:translate-y-1 transition-all">
               <summary className="font-bold cursor-pointer list-none flex justify-between">
                 ¿Aceptan efectivo? <span>+</span>
               </summary>
               <p className="mt-4 text-gray-600">Sí, aceptamos efectivo, tarjetas y transferencias directas.</p>
            </details>
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
         <h2 className="font-spaceGrotesk text-5xl font-black mb-8">¿LISTO PARA IR?</h2>
         <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="px-8 py-4 bg-black text-white border-2 border-white font-bold shadow-[4px_4px_0px_0px_#fff] hover:translate-y-1 hover:shadow-none transition-all">
              DESCARGAR EN ANDROID
            </button>
            <button className="px-8 py-4 bg-white text-black border-2 border-black font-bold shadow-[4px_4px_0px_0px_#000] hover:translate-y-1 hover:shadow-none transition-all">
              DESCARGAR EN IOS
            </button>
         </div>
       </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="font-spaceGrotesk text-2xl font-black">GOING</div>
         <div className="text-sm text-gray-400">© 2024 Going Ecuador. Todos los derechos reservados.</div>
         <div className="flex gap-6 font-bold text-sm">
            <a href="#" className="hover:text-going-red">Legal</a>
            <a href="#" className="hover:text-going-red">Privacidad</a>
            <a href="#" className="hover:text-going-red">Soporte</a>
         </div>
      </div>
    </footer>
  );
}

/* ====== COMPONENTS ====== */

function ServiceCard({ title, desc, icon, href, active, accent = 'red' }: any) {
  const borderColor = active ? 'border-black' : 'border-dashed border-gray-400';
  const shadowClass = active ? 'shadow-neo hover:translate-y-1 hover:shadow-none' : '';
  const bgColor = active ? 'bg-white' : 'bg-gray-50';
  
  return (
    <a href={href} className={`block p-6 ${bgColor} border-2 ${borderColor} ${shadowClass} transition-all rounded-none group`}>
       <div className="flex justify-between items-start mb-4">
          <span className="text-4xl filter grayscale group-hover:grayscale-0 transition-all">{icon}</span>
          <span className={`w-3 h-3 rounded-full ${active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
       </div>
       <h3 className="font-black text-xl mb-2 group-hover:text-going-red transition-colors">{title}</h3>
       <p className="text-sm text-gray-600 font-medium">{desc}</p>
    </a>
  );
}

