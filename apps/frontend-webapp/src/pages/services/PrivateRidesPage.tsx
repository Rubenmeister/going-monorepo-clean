'use client';

import React from 'react';
import { Link } from 'react-router-dom';

export function PrivateRidesPage() {
  return (
    <main className="min-h-screen bg-brand-gray text-going-black font-sans selection:bg-going-yellow selection:text-black">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b-2 border-black bg-white/80 backdrop-blur-md">
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

      {/* Hero */}
      <section className="relative overflow-hidden bg-white border-b-2 border-black">
        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" 
          style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div className="relative z-10">
              <div className="inline-block px-4 py-1 bg-going-red text-white border-2 border-black shadow-neo mb-6 transform -rotate-1">
                <span className="font-bold font-mono text-xs uppercase tracking-wider">SERVICIO PREMIUM</span>
              </div>
              <h1 className="font-spaceGrotesk text-5xl font-black leading-none tracking-tighter md:text-7xl mb-6 uppercase">
                VIAJES <br/> PRIVADOS
              </h1>
              <p className="text-lg font-medium border-l-4 border-black pl-4 mb-8 max-w-md">
                Tu chofer personal, cuando lo necesitas. Sin esperas, sin desvíos y con seguridad total.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <a href="#download" className="px-8 py-4 bg-black text-white font-black text-lg border-2 border-black shadow-neo hover:translate-y-1 hover:shadow-none transition-all text-center">
                  SOLICITAR VIAJE
                </a>
              </div>
            </div>
            
            {/* Phone Mockup / Graphic */}
            <div className="relative flex justify-center">
               <div className="relative w-72 bg-white rounded-3xl border-4 border-black shadow-neo overflow-hidden z-10">
                  <div className="p-4 bg-going-red border-b-2 border-black text-white text-center">
                     <span className="font-black text-xl uppercase">EN CURSO</span>
                     <div className="text-xs font-mono mt-1">ETA: 12 MIN</div>
                  </div>
                  <div className="p-6 space-y-6">
                     <div className="space-y-2">
                        <div className="flex items-center gap-3">
                           <div className="w-4 h-4 bg-black rounded-full"></div>
                           <div className="font-bold">Av. Amazonas</div>
                        </div>
                        <div className="h-8 border-l-2 border-dashed border-black ml-2"></div>
                        <div className="flex items-center gap-3">
                           <div className="w-4 h-4 bg-going-red border-2 border-black rounded-full"></div>
                           <div className="font-bold">Quicentro Shopping</div>
                        </div>
                     </div>
                     <div className="p-4 bg-gray-100 border-2 border-black rounded-xl">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white">👤</div>
                           <div>
                              <div className="font-black">CARLOS M.</div>
                              <div className="text-xs uppercase">Toyota Corolla</div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
               {/* Decorative Element */}
               <div className="absolute -right-4 -bottom-4 w-full h-full bg-going-yellow border-2 border-black rounded-3xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-brand-gray border-b-2 border-black">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-spaceGrotesk text-4xl font-black uppercase text-center mb-16">
            ¿POR QUÉ ELEGIR PRIVADO?
          </h2>
          
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard 
              icon="🎯" 
              title="RUTA DIRECTA" 
              description="Sin paradas intermedias. Tu tiempo es valioso, nosotros lo respetamos."
            />
            <FeatureCard 
              icon="⏱️" 
              title="24/7 DISPONIBLE" 
              description="Madrugada o feriado, siempre habrá un conductor listo para ti."
            />
            <FeatureCard 
              icon="🛡️" 
              title="SEGURO TOTAL" 
              description="Cada kilómetro recorrido está asegurado. Viaja con respaldo."
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-20 bg-white border-b-2 border-black">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-spaceGrotesk text-4xl font-black uppercase text-center mb-12">
            3 PASOS SIMPLES
          </h2>
          
          <div className="grid gap-8 md:grid-cols-3">
            <StepCard n={1} title="ELIGE DESTINO" description="Ingresa punto A y punto B. Verás el precio final al instante." />
            <StepCard n={2} title="CONFIRMA" description="Selecciona pago (Efectivo/Tarjeta) y solicita. Asignación en segundos." />
            <StepCard n={3} title="VIAJA SEGURO" description="Comparte tu ubicación en vivo y califica a tu conductor al llegar." />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-going-yellow border-b-2 border-black">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="font-spaceGrotesk text-4xl font-black uppercase mb-4">
            TARIFAS TRANSPARENTES
          </h2>
          <p className="font-bold mb-12">Sin sorpresas. Lo que ves es lo que pagas.</p>
          
          <div className="bg-white border-4 border-black p-8 shadow-neo max-w-md mx-auto transform hover:scale-105 transition-transform">
             <div className="text-sm font-bold uppercase text-gray-500 mb-2">TARIFA BASE DESDE</div>
             <div className="text-6xl font-black text-going-red mb-2">$2.50</div>
             <div className="font-mono text-sm border-t-2 border-black pt-4 mt-4">
                + $0.35 POR KM RECORRIDO
             </div>
             <div className="mt-6 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold"><span className="text-green-500">✔</span> Precio Fijo</div>
                <div className="flex items-center gap-2 font-bold"><span className="text-green-500">✔</span> Sin Tarifa Dinámica Oculta</div>
             </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white border-b-2 border-black">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="font-spaceGrotesk text-3xl font-black text-center mb-12 uppercase">PREGUNTAS FRECUENTES</h2>
          <div className="space-y-4">
            <FAQItem q="¿Cuánto tiempo tarda en llegar?" a="Generalmente entre 3-10 minutos dependiendo del tráfico y ubicación." />
            <FAQItem q="¿Puedo pagar en efectivo?" a="Sí, aceptamos efectivo y tarjetas. Tú eliges antes de confirmar." />
            <FAQItem q="¿Puedo cancelar sin costo?" a="Sí, si cancelas antes de que el conductor llegue a tu ubicación." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="download" className="py-24 bg-going-black text-white text-center">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="font-spaceGrotesk text-5xl font-black mb-8">¿LISTO PARA MOVERTE?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <a className="px-8 py-4 bg-going-red text-white border-2 border-white font-bold shadow-[4px_4px_0px_0px_#fff] hover:translate-y-1 hover:shadow-none transition-all uppercase" href="#">
               Descargar App
             </a>
          </div>
        </div>
      </section>
    </main>
  );
}

/* Components */
function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="p-8 bg-white border-2 border-black shadow-neo hover:-translate-y-1 hover:shadow-lg transition-transform">
      <div className="text-4xl mb-4">{icon}</div>
      <div className="font-spaceGrotesk text-xl font-black uppercase mb-2">{title}</div>
      <div className="text-sm font-medium text-gray-600">{description}</div>
    </div>
  );
}

function StepCard({ n, title, description }: { n: number; title: string; description: string }) {
  return (
    <div className="relative group p-6 bg-white border-2 border-black text-center transition-all hover:bg-gray-50">
      <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl mx-auto mb-4 border-2 border-transparent group-hover:bg-going-red group-hover:scale-110 transition-all">
        {n}
      </div>
      <div className="font-spaceGrotesk text-xl font-black uppercase mb-2">{title}</div>
      <div className="text-sm font-medium text-gray-600">{description}</div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-2 border-black bg-white transition-all">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50">
        <span className="font-bold uppercase font-spaceGrotesk">{q}</span>
        <span className={`text-xl font-black transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm font-medium text-gray-600 border-t-2 border-black pt-4">
          {a}
        </div>
      )}
    </div>
  );
}

export default PrivateRidesPage;
