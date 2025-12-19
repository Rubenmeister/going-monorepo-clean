'use client';

import React, { useState, useEffect } from 'react';
import { ECUADOR_REGIONS, EcuadorRegion, POPULAR_ROUTES } from '@going-monorepo/shared';
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
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-black">
      {/* Background Layer */}
      <img 
        src="/assets/ecuador_landscape_bg.png" 
        alt="Ecuador Landscape" 
        className="absolute inset-0 w-full h-full object-cover opacity-70" 
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
      
      {/* Andean Pattern Overlay (very subtle) */}
      <div 
        className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none" 
        style={{ backgroundImage: 'url(/assets/andean_pattern.png)', backgroundSize: '400px' }}
      />

      <div className="relative z-10 mx-auto max-w-7xl w-full px-6 py-20 flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-block px-4 py-1.5 bg-brand-red text-white text-xs font-black tracking-[0.3em] uppercase mb-8 shadow-2xl">
            Ecuador en Movimiento
          </div>
          
          <h1 className="font-spaceGrotesk text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-8 drop-shadow-2xl">
            DESCUBRE <br/>
            <span className="text-brand-red">TU RUTA.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 font-medium mb-10 max-w-xl leading-relaxed">
             Únete a la plataforma de movilidad sustentable que conecta cada rincón del Ecuador con estilo y seguridad.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center md:justify-start">
            <a href="/register" className="px-10 py-5 bg-white text-black font-black text-xl rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all">
              EMPEZAR AHORA
            </a>
            <a href="#download" className="px-10 py-5 bg-brand-red text-white font-black text-xl rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all">
              DESCARGAR APP
            </a>
          </div>
        </div>

        <div className="flex-1 relative flex items-center justify-center">
          <div className="absolute w-[400px] h-[400px] bg-brand-red rounded-full opacity-20 blur-[120px] animate-pulse"></div>
          
          <div className="relative w-full max-w-lg z-20 animate-drive-arrive">
             <img 
               src="/assets/suv_black_right_v3.png" 
               alt="Going SUV" 
               className="w-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
             />
             <div className="absolute -top-12 -right-4 bg-white/10 backdrop-blur-md px-6 py-3 border border-white/20 rounded-2xl shadow-2xl animate-bounce">
               <span className="text-white font-black text-lg">UIO ➔ CUE</span>
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
             <h2 className="font-spaceGrotesk text-4xl font-black uppercase mb-2">Servicios Integrados</h2>
             <p className="font-medium text-gray-600">Movilidad inteligente para cada necesidad.</p>
           </div>
           <a href="#" className="font-bold underline decoration-2 decoration-going-red underline-offset-4 hover:text-going-red">Ver todo →</a>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <ServiceCard 
            title="VIAJES PRIVADOS" 
            desc="Chofer personal. Ideal para moverte seguro en la ciudad." 
            icon="🚗" 
            href="/services/private" 
            active 
          />
          <ServiceCard 
            title="RUTAS COMPARTIDAS" 
            desc="Conecta ciudades. Ahorra viajando de terminal a terminal." 
            icon="🚌" 
            href="/services/shared" 
            active 
            accent="yellow"
          />
          <ServiceCard 
            title="ENCOMIENDAS" 
            desc="Envíos rápidos entre provincias. Rastreo 24/7." 
            icon="📦" 
            href="/services/shipments" 
            active 
            accent="blue"
          />
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

/* ====== ECUADOR SECTION ====== */
function Ecuador() {
  return (
    <section id="ecuador" className="py-20 bg-gray-100 border-b-2 border-black relative overflow-hidden">
       {/* Background Patterns Layer */}
       <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pattern-andino"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pattern-costa"></div>
       </div>

       <div className="mx-auto max-w-7xl px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-spaceGrotesk text-4xl font-black uppercase mb-4">DESCUBRE ECUADOR 🇪🇨</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Conectamos las 4 regiones del país. Vive la diversidad de nuestros paisajes y culturas con la seguridad que mereces.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
             {Object.values(ECUADOR_REGIONS).map((region: any) => (
               <div key={region.label} className="bg-white p-6 border-2 border-black shadow-neo hover:-translate-y-2 transition-transform group">
                 <div className={`w-full h-32 mb-4 rounded-lg flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`} style={{backgroundColor: region.colorHex + '20'}}>
                    {/* Placeholder for real images later */}
                    <span className="text-4xl" style={{color: region.colorHex}}>●</span>
                 </div>
                 <div className="flex justify-between items-center mb-2">
                    <RegionBadge region={region.label.toUpperCase() as EcuadorRegion} />
                 </div>
                 <h3 className="font-bold text-xl mb-1">{region.slogan}</h3>
                 <p className="text-sm text-gray-500">{region.description}</p>
               </div>
             ))}
          </div>

          <div className="mt-16 bg-white border-2 border-black p-8 shadow-neo max-w-3xl mx-auto">
             <h3 className="font-bold text-lg mb-6 text-center uppercase border-b-2 border-gray-100 pb-2">Rutas Populares</h3>
             <div className="flex flex-wrap justify-center gap-4">
                {POPULAR_ROUTES.map((route: any, idx: number) => (
                   <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full hover:bg-gray-100 transition-colors">
                      <span className="text-xs font-bold text-gray-400">{route.region}</span>
                      <span className="font-bold text-sm">{route.label}</span>
                   </div>
                ))}
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

/* ====== COMPONENTS ====== */

function ServiceCard({ title, desc, icon, href, active, accent = 'red' }: any) {
  return (
    <a href={href} className={`block p-8 bg-white border border-gray-100 rounded-[32px] shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group`}>
       <div className="flex justify-between items-start mb-6">
          <span className="text-5xl group-hover:scale-110 transition-transform duration-300">{icon}</span>
          <div className={`w-3 h-3 rounded-full ${active ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-300'}`}></div>
       </div>
       <h3 className="font-black text-2xl mb-3 group-hover:text-brand-red transition-colors">{title}</h3>
       <p className="text-base text-gray-500 font-medium leading-relaxed">{desc}</p>
    </a>
  );
}

