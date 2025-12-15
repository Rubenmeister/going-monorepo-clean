'use client';

import React from 'react';
import { Link } from 'react-router-dom';

export function ShipmentsPage() {
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
              <div className="inline-block px-4 py-1 bg-amber-500 text-white border-2 border-black shadow-neo mb-6 transform -rotate-1">
                <span className="font-bold font-mono text-xs uppercase tracking-wider">ENCOMIENDAS</span>
              </div>
              <h1 className="font-spaceGrotesk text-5xl font-black leading-none tracking-tighter md:text-7xl mb-6 uppercase">
                ENVÍA FÁCIL <br/> Y RÁPIDO
              </h1>
              <p className="text-lg font-medium border-l-4 border-black pl-4 mb-8 max-w-md">
                Rastreo en tiempo real, confirmación fotográfica y entregas el mismo día. Tus paquetes en buenas manos.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <a href="#precios" className="px-8 py-4 bg-black text-white font-black text-lg border-2 border-black shadow-neo hover:translate-y-1 hover:shadow-none transition-all text-center">
                  COTIZAR ENVÍO
                </a>
              </div>
            </div>
            
            {/* Package Tracking Mockup / Graphic */}
            <div className="relative flex justify-center">
               <div className="relative w-80 bg-white rounded-3xl border-4 border-black shadow-neo overflow-hidden z-10">
                  <div className="p-4 bg-amber-500 border-b-2 border-black text-white flex justify-between items-center">
                     <span className="font-black text-lg uppercase">#G-4521</span>
                     <span className="px-2 py-1 bg-black text-white text-[10px] uppercase font-bold rounded-md">EN RUTA</span>
                  </div>
                  <div className="p-6">
                     {/* Timeline */}
                     <div className="relative flex justify-between mb-8">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
                        <div className="absolute top-1/2 left-0 w-2/3 h-1 bg-going-red border-y border-black -translate-y-1/2 z-0"></div>
                        
                        <div className="relative z-10 w-6 h-6 bg-green-500 border-2 border-black rounded-full text-white text-[10px] flex items-center justify-center">✓</div>
                        <div className="relative z-10 w-6 h-6 bg-green-500 border-2 border-black rounded-full text-white text-[10px] flex items-center justify-center">✓</div>
                        <div className="relative z-10 w-8 h-8 bg-going-red border-2 border-black rounded-full text-white flex items-center justify-center animate-bounce">📦</div>
                        <div className="relative z-10 w-6 h-6 bg-white border-2 border-black rounded-full"></div>
                     </div>
                     
                     <div className="bg-brand-gray border-2 border-black p-4 rounded-xl mb-4">
                        <div className="flex items-center gap-3">
                           <div className="text-3xl">📦</div>
                           <div>
                              <div className="font-black text-sm uppercase">Paquete Mediano</div>
                              <div className="text-xs font-mono">5kg • Entrega: Hoy 18:00</div>
                           </div>
                        </div>
                     </div>
                     <div className="text-center">
                        <div className="text-xs font-bold uppercase text-gray-400 mb-1">CONDUCTOR</div>
                        <div className="font-spaceGrotesk font-black text-lg">LUIS P.</div>
                        <div className="text-xs font-mono">PLACA: TBB-4856</div>
                     </div>
                  </div>
               </div>
               {/* Decorative Element */}
               <div className="absolute -right-4 -bottom-4 w-full h-full bg-going-yellow border-2 border-black rounded-3xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* What can you send */}
      <section className="py-20 bg-brand-gray border-b-2 border-black">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-spaceGrotesk text-4xl font-black uppercase text-center mb-16">
            ¿QUÉ PUEDES ENVIAR?
          </h2>
          
          <div className="grid gap-6 md:grid-cols-4">
            <PackageTypeCard icon="📄" title="DOCUMENTOS" description="Sobres y contratos importantes." />
            <PackageTypeCard icon="📦" title="PEQUEÑOS" description="Ropa, regalos, electrónicos. (Hasta 5kg)" />
            <PackageTypeCard icon="🎁" title="MEDIANOS" description="Cajas de mudanza ligeras. (5-10kg)" />
            <PackageTypeCard icon="📋" title="PRODUCTOS" description="Mercadería para tu negocio. (10-20kg)" />
          </div>
          
          <div className="mt-8 text-center">
            <div className="inline-block px-6 py-2 bg-yellow-100 border-2 border-amber-500 text-amber-900 text-sm font-bold rounded-full">
              ⚠️ Máximo 20kg por envío · Prohibido materiales peligrosos
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white border-b-2 border-black">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-spaceGrotesk text-4xl font-black uppercase text-center mb-16">
            GARANTÍA GOING
          </h2>
          
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard icon="📍" title="TRACKING GPS" description="Mira cómo se mueve tu paquete en el mapa." />
            <FeatureCard icon="⚡" title="MISMO DÍA" description="Entregas express en rutas seleccionadas." />
            <FeatureCard icon="📸" title="FOTO EVIDENCIA" description="Te enviamos foto al recoger y al entregar." />
            <FeatureCard icon="💬" title="CHAT DIRECTO" description="Habla con el conductor si necesitas." />
            <FeatureCard icon="🔐" title="ASEGURADO" description="Cobertura básica incluida en cada tarifa." />
            <FeatureCard icon="🧾" title="FACTURACIÓN" description="Ideal para emprendedores y empresas." />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 bg-going-yellow border-b-2 border-black">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-spaceGrotesk text-4xl font-black uppercase text-center mb-12">
            PASO A PASO
          </h2>
          
          <div className="grid gap-8 md:grid-cols-4">
            <StepCard n={1} title="ORIGEN/DESTINO" description="Dinos dónde recoger y entregar." />
            <StepCard n={2} title="DESCRIBE" description="Tamaño, peso y cuidados." />
            <StepCard n={3} title="COTIZA" description="Confirma el precio fijo." />
            <StepCard n={4} title="RASTREA" description="Sigue tu envío hasta la entrega." />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-20 bg-white border-b-2 border-black">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-spaceGrotesk text-4xl font-black uppercase text-center mb-16">
            TARIFAS LOCALES
          </h2>
          
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            <PriceCard title="SOBRES" price="$3" subtitle="Hasta 1kg" />
            <PriceCard title="ESTÁNDAR" price="$5" subtitle="1-5kg" featured />
            <PriceCard title="MEDIANO" price="$8" subtitle="5-10kg" />
          </div>
          
          <p className="mt-8 text-center font-bold text-sm text-gray-500 uppercase">
            * Precios referenciales par Quito Urbano. Rutas interprovinciales varían.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section id="download" className="py-24 bg-brand-gray text-center border-t-2 border-black">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="font-spaceGrotesk text-5xl font-black mb-8 uppercase">ENVÍA TU PRIMER PAQUETE</h2>
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
    <div className="p-6 bg-white border-2 border-black shadow-neo hover:-translate-y-1 hover:shadow-lg transition-transform h-full">
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

function PackageTypeCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white border-2 border-black p-6 text-center shadow-neo hover:translate-y-1 hover:shadow-none transition-all cursor-pointer">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="font-spaceGrotesk font-black uppercase mb-1">{title}</div>
      <div className="text-xs font-bold text-gray-500 uppercase">{description}</div>
    </div>
  );
}

function PriceCard({ title, price, subtitle, featured }: { title: string; price: string; subtitle: string; featured?: boolean }) {
  return (
    <div className={`relative p-8 text-center border-2 border-black transition-transform hover:scale-105 ${featured ? 'bg-amber-100 shadow-neo scale-105 z-10' : 'bg-white shadow-sm'}`}>
      {featured && (
         <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-going-black text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest border border-black">
            Popular
         </div>
      )}
      <div className="font-spaceGrotesk font-black text-xl uppercase mb-2">{title}</div>
      <div className="text-5xl font-black text-going-red mb-2">{price}</div>
      <div className="font-mono text-xs font-bold text-gray-500 uppercase border-t-2 border-black pt-4 inline-block w-full">{subtitle}</div>
    </div>
  );
}

export default ShipmentsPage;
