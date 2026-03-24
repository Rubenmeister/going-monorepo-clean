'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

/* ── useInView ─────────────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ── FadeIn ─────────────────────────────────────────────────── */
function FadeIn({ children, delay = 0, direction = 'up', className = '' }: {
  children: React.ReactNode; delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none'; className?: string;
}) {
  const { ref, inView } = useInView();
  const t: Record<string, string> = { up: 'translateY(28px)', left: 'translateX(-28px)', right: 'translateX(28px)', none: 'none' };
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'none' : t[direction],
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

const REGIONS = {
  Sierra: {
    color: '#6366f1',
    destinations: [
      { name: 'Quito',      desc: 'Capital histórica',         img: '/images/calle venezuela quito.jpg' },
      { name: 'Baños',      desc: 'Aventura & termas',          img: '/images/baños 7.jpg' },
      { name: 'Riobamba',   desc: 'Puerta del Chimborazo',      img: '/images/chimborazo desde riobamba.jpg' },
      { name: 'Cotacachi',  desc: 'Lago Cuicocha & artesanías', img: '/images/cuicocha.jpg' },
    ],
  },
  Costa: {
    color: '#0ea5e9',
    destinations: [
      { name: 'Guayaquil',  desc: 'Puerto principal',           img: '/images/GUAYAQUIL DE NOCHE.jpg' },
      { name: 'Manta',      desc: 'Cruceros del Pacífico',       img: '/images/CRUCEROS MANTA.jpg' },
      { name: 'Salinas',    desc: 'Balneario ecuatoriano',       img: '/images/Salinas.png' },
      { name: 'Montañita',  desc: 'Surf & bohemia',              img: '/images/Montañita.png' },
    ],
  },
  Amazonía: {
    color: '#16a34a',
    destinations: [
      { name: 'Tena',       desc: 'Cascadas & rafting',          img: '/images/AR PN AMAZONÍA19 TENA CASCADAS SAN RAFAEL_0502.JPG' },
      { name: 'Cuyabeno',   desc: 'Reserva natural única',       img: '/images/Copia de AR PN AMAZONÍA18 CUYABENO CANOA foto0026.jpg' },
      { name: 'Orellana',   desc: 'Ríos & biodiversidad',        img: '/images/Orellana Pañacocha Laguna.jpg' },
      { name: 'Zamora',     desc: 'Fauna & mariposas',           img: '/images/AR PN AMAZONIA ZAMORA FAUNA mariposas 0283.JPG' },
    ],
  },
  Galápagos: {
    color: '#f59e0b',
    destinations: [
      { name: 'Santa Cruz',     desc: 'Centro de las Islas',   img: '/images/GALÁPAGOS PAISAJE  .JPG' },
      { name: 'San Cristóbal',  desc: 'La isla capital',        img: '/images/AR PN GALÁPAGOS Baquerizo Moreno San Cristóbal2.jpg' },
      { name: 'Isabela',        desc: 'Volcanes & tortugas',    img: '/images/BUCEO GALÁPAGOS 001.jpg' },
      { name: 'Buceo',          desc: 'Vida marina única',      img: '/images/GALAPAGOS FAUNA BUCEO 038.jpg' },
    ],
  },
};

/* ── Main page ─────────────────────────────────────────────── */
export default function PasajerosPage() {
  const [activeRegion, setActiveRegion] = useState<keyof typeof REGIONS>('Sierra');

  return (
    <div className="min-h-screen font-sans antialiased">

      {/* ── 4 MUNDOS ─────────────────────────────────────────── */}
      <section className="pt-12 pb-16 px-4 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-10">
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: '#ff4c41' }}>4 mundos</span>
            <h1 className="text-white font-black text-4xl mt-2">Explora Ecuador con Going</h1>
            <p className="text-gray-400 text-lg mt-3">Cada región, una experiencia única. Going te lleva a todas.</p>
          </FadeIn>

          {/* Region tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {(Object.keys(REGIONS) as (keyof typeof REGIONS)[]).map(r => (
              <button
                key={r}
                onClick={() => setActiveRegion(r)}
                className="px-6 py-2.5 rounded-full font-bold text-sm transition-all"
                style={{
                  backgroundColor: activeRegion === r ? REGIONS[r].color : 'transparent',
                  color: activeRegion === r ? '#fff' : '#9ca3af',
                  border: `2px solid ${activeRegion === r ? REGIONS[r].color : '#374151'}`,
                }}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Destination cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
            {REGIONS[activeRegion].destinations.map((d, i) => (
              <FadeIn key={d.name} delay={i * 0.08}>
                <div className="group relative rounded-2xl overflow-hidden cursor-pointer" style={{ height: 240 }}>
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url('${d.img}')` }} />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
                  <div className="absolute bottom-0 p-4">
                    <h4 className="text-white font-black text-lg">{d.name}</h4>
                    <p className="text-gray-300 text-xs">{d.desc}</p>
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all">
                    <span className="text-white text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: REGIONS[activeRegion].color }}>Ver viajes</span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="flex justify-center">
            <Link href="/auth/login?from=/ride" className="px-8 py-4 rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 hover:scale-105" style={{ backgroundColor: '#ff4c41' }}>
              Buscar viaje →
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── SERVICIOS ────────────────────────────────────────── */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
            {/* Viajes Compartidos */}
            <div className="rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-5" style={{ backgroundColor: '#fff0ef' }}>🚗</div>
              <h3 className="text-gray-900 font-black text-xl mb-2">Viajes Compartidos</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">La forma más económica de viajar entre ciudades. Comparte el vehículo y el costo.</p>
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-gray-400">Desde</span>
                <span className="text-3xl font-black" style={{ color: '#ff4c41' }}>$10</span>
                <span className="text-sm text-gray-400">por trayecto</span>
              </div>
            </div>
            {/* Envíos Express */}
            <div className="rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-5" style={{ backgroundColor: '#f0f9ff' }}>📦</div>
              <h3 className="text-gray-900 font-black text-xl mb-2">Envíos Express</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">Envía paquetes a cualquier ciudad. Tracking en tiempo real incluido. Recolección y entrega en menos de 24 horas de puerta a puerta.</p>
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-gray-400">Desde</span>
                <span className="text-3xl font-black text-gray-900">$10</span>
                <span className="text-sm text-gray-400">puerta a puerta</span>
              </div>
            </div>
          </FadeIn>

          {/* Precios */}
          <FadeIn>
            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="px-8 py-5 border-b border-gray-100" style={{ background: '#f8fafc' }}>
                <h3 className="text-gray-900 font-black text-lg">Precios transparentes. Sin sorpresas.</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  { route: 'Latacunga ↔ Quito',       shared: '$12', private: '$50' },
                  { route: 'Ambato ↔ Quito',           shared: '$15', private: '$60' },
                  { route: 'Riobamba ↔ Quito',         shared: '$20', private: '$80' },
                  { route: 'Quito ↔ Aeropuerto Quito', shared: '$10', private: '$25' },
                ].map((r) => (
                  <div key={r.route} className="flex items-center justify-between px-8 py-4">
                    <span className="text-gray-700 font-semibold text-sm">{r.route}</span>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-0.5">Compartido</div>
                        <span className="font-black text-sm" style={{ color: '#ff4c41' }}>desde {r.shared}</span>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-0.5">Privado</div>
                        <span className="font-black text-sm text-gray-700">desde {r.private}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────── */}
      <section className="py-14 px-6" style={{ background: '#ff4c41' }}>
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">¿Listo para explorar Ecuador?</h2>
            <p className="text-white mb-8 text-lg" style={{ opacity: 0.88 }}>
              Crea tu cuenta gratis y reserva tu primer viaje en segundos.
            </p>
            <Link href="/auth/login?from=/ride" className="inline-block px-10 py-4 rounded-2xl font-extrabold text-base transition-all duration-200 hover:opacity-90 active:scale-95" style={{ background: '#fff', color: '#ff4c41', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
              Buscar viaje →
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
