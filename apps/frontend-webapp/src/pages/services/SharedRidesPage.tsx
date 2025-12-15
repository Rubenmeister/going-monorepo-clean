'use client';

import React from 'react';
import { Link } from 'react-router-dom';

export function SharedRidesPage() {
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
              <div className="inline-block px-4 py-1 bg-blue-500 text-white border-2 border-black shadow-neo mb-6 transform -rotate-1">
                <span className="font-bold font-mono text-xs uppercase tracking-wider">VIAJES COMPARTIDOS</span>
              </div>
              <h1 className="font-spaceGrotesk text-5xl font-black leading-none tracking-tighter md:text-7xl mb-6 uppercase">
                VIAJA MÁS <br/> POR MENOS
              </h1>
              <p className="text-lg font-medium border-l-4 border-black pl-4 mb-8 max-w-md">
                Rutas establecidas, horarios fijos y precios increíbles. Comparte el viaje y ahorra.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <a href="#rutas" className="px-8 py-4 bg-black text-white font-black text-lg border-2 border-black shadow-neo hover:translate-y-1 hover:shadow-none transition-all text-center">
                  VER RUTAS
                </a>
              </div>
            </div>
            
            {/* Route Card Mockup / Graphic */}
            <div className="relative flex justify-center">
               <div className="relative w-80 bg-white rounded-3xl border-4 border-black shadow-neo overflow-hidden z-10">
                  <div className="p-4 bg-blue-500 border-b-2 border-black text-white text-center">
                     <span className="font-black text-xl uppercase">RUTA POPULAR</span>
                  </div>
                  <div className="p-6">
                     <div className="flex items-center justify-between mb-6">
                        <div className="text-center">
                           <div className="font-black text-4xl">UIO</div>
                           <div className="text-xs font-mono uppercase">Quito</div>
                        </div>
                        <div className="flex-1 mx-4 border-t-4 border-dashed border-black relative">
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-2xl">🚐</div>
                        </div>
                        <div className="text-center">
                           <div className="font-black text-4xl">CUE</div>
                           <div className="text-xs font-mono uppercase">Cuenca</div>
                        </div>
                     </div>
                     <div className="grid grid-cols-3 gap-2 text-center mb-6">
                        <div className="bg-brand-gray border-2 border-black p-2 rounded-xl">
                           <div className="font-black text-going-red">$18</div>
                           <div className="text-[10px] font-bold uppercase">Precio</div>
                        </div>
                        <div className="bg-brand-gray border-2 border-black p-2 rounded-xl">
                           <div className="font-black">4h</div>
                           <div className="text-[10px] font-bold uppercase">Tiempo</div>
                        </div>
                        <div className="bg-brand-gray border-2 border-black p-2 rounded-xl">
                           <div className="font-black">3/8</div>
                           <div className="text-[10px] font-bold uppercase">Cupos</div>
                        </div>
                     </div>
                     <button className="w-full py-3 bg-going-red text-white font-black uppercase border-2 border-black shadow-sm hover:shadow-none hover:translate-y-0.5 transition-all rounded-xl">
                        Reservar Cupo
                     </button>
                  </div>
               </div>
               {/* Decorative Element */}
               <div className="absolute -left-4 -top-4 w-full h-full bg-going-yellow border-2 border-black rounded-3xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section id="rutas" className="py-20 bg-brand-gray border-b-2 border-black">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-spaceGrotesk text-4xl font-black uppercase text-center mb-16">
            RUTAS DISPONIBLES
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <RouteCard from="Quito" to="Cuenca" price="$18" duration="4h" seats="8" />
            <RouteCard from="Quito" to="Guayaquil" price="$15" duration="5h" seats="8" />
            <RouteCard from="Guayaquil" to="Salinas" price="$8" duration="2h" seats="6" />
            <RouteCard from="Quito" to="Baños" price="$12" duration="3h" seats="6" />
            <RouteCard from="Cuenca" to="Loja" price="$10" duration="3h" seats="6" />
            <RouteCard from="Guayaquil" to="Cuenca" price="$14" duration="4h" seats="8" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white border-b-2 border-black">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-spaceGrotesk text-4xl font-black uppercase text-center mb-16">
            VENTAJAS
          </h2>
          
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard icon="💰" title="AHORRO REAL" description="Paga solo tu asiento. Viaja cómodo por una fracción del precio." />
            <FeatureCard icon="📅" title="SALIDAS FIJAS" description="Sin sorpresas. Sabes exactamente cuándo sales y cuándo llegas." />
            <FeatureCard icon="🛡️" title="SEGURIDAD" description="Conductores verificados y monitoreo GPS en todos los trayectos." />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-going-yellow border-b-2 border-black">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-spaceGrotesk text-4xl font-black uppercase text-center mb-12">
            ¿CÓMO FUNCIONA?
          </h2>
          
          <div className="grid gap-8 md:grid-cols-4">
            <StepCard n={1} title="ELIGE RUTA" description="Selecciona origen, destino y la fecha de tu viaje." />
            <StepCard n={2} title="SELECCIONA" description="Escoge el horario que más te convenga." />
            <StepCard n={3} title="RESERVA" description="Confirma tus asientos y realiza el pago seguro." />
            <StepCard n={4} title="VIAJA" description="Llega al punto de encuentro y disfruta el camino." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="download" className="py-24 bg-brand-gray text-center border-t-2 border-black">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="font-spaceGrotesk text-5xl font-black mb-8 uppercase">VIAJA MÁS, GASTA MENOS</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <a className="px-8 py-4 bg-going-black text-white border-2 border-black font-bold shadow-neo hover:translate-y-1 hover:shadow-none transition-all uppercase" href="#">
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
    <div className="p-8 bg-white border-2 border-black shadow-neo hover:-translate-y-1 hover:shadow-lg transition-transform h-full">
      <div className="text-4xl mb-4">{icon}</div>
      <div className="font-spaceGrotesk text-xl font-black uppercase mb-2">{title}</div>
      <div className="text-sm font-medium text-gray-600">{description}</div>
    </div>
  );
}

function StepCard({ n, title, description }: { n: number; title: string; description: string }) {
  return (
    <div className="text-center bg-white p-6 border-2 border-black shadow-sm">
      <div className="mx-auto w-14 h-14 rounded-full bg-black text-white flex items-center justify-center text-xl font-black mb-4">{n}</div>
      <div className="font-spaceGrotesk text-lg font-black uppercase mb-2">{title}</div>
      <div className="text-sm font-medium text-gray-600">{description}</div>
    </div>
  );
}

function RouteCard({ from, to, price, duration, seats }: { from: string; to: string; price: string; duration: string; seats: string }) {
  return (
    <div className="group relative bg-white border-2 border-black p-5 shadow-neo hover:translate-y-1 hover:shadow-none transition-all cursor-pointer">
      <div className="flex items-center justify-between mb-4 border-b-2 border-black/10 pb-4">
        <div className="font-spaceGrotesk font-black text-lg uppercase">{from} <span className="text-gray-400 mx-2">→</span> {to}</div>
        <span className="text-2xl font-black text-going-red bg-going-red/10 px-2 py-1 transform rotate-2">{price}</span>
      </div>
      <div className="flex gap-4 text-sm font-bold uppercase">
        <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded border border-black"><span className="text-lg">⏱️</span> {duration}</span>
        <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded border border-black"><span className="text-lg">👥</span> {seats} Cupos</span>
      </div>
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 border border-black animate-pulse"></div>
    </div>
  );
}

export default SharedRidesPage;
