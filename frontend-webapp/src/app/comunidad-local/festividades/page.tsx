'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function FadeIn({ children, delay = 0, direction = 'up' }: { children: React.ReactNode; delay?: number; direction?: 'up' | 'left' | 'right' | 'none' }) {
  const { ref, inView } = useInView();
  const translate = direction === 'up' ? 'translateY(32px)' : direction === 'left' ? 'translateX(-32px)' : direction === 'right' ? 'translateX(32px)' : 'none';
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? 'none' : translate, transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

const festivities = [
  {
    month: 'Enero',
    emoji: '🌊',
    title: 'Año Nuevo en las playas',
    locations: 'Salinas · Montañita · Atacames',
    desc: 'Año nuevo en las playas ecuatorianas. Transporte desde Quito y Guayaquil con precios fijados por anticipado. Alojamientos Going disponibles a metros del mar.',
    color: '#3b82f6',
  },
  {
    month: 'Febrero',
    emoji: '🎭',
    title: 'Carnaval de Guaranda y Ambato',
    locations: 'Guaranda · Ambato · Riobamba',
    desc: 'El carnaval más auténtico del Ecuador. Viajes especiales con conductores locales que conocen los mejores miradores y eventos. Paquetes con alojamiento incluido.',
    color: '#ec4899',
  },
  {
    month: 'Abril',
    emoji: '✝️',
    title: 'Semana Santa en Quito',
    locations: 'Quito · Centro Histórico',
    desc: 'Las procesiones más imponentes de Latinoamérica. Conductores Going especializados en turismo religioso. Tours del Centro Histórico con guías certificados.',
    color: '#8b5cf6',
  },
  {
    month: 'Junio',
    emoji: '☀️',
    title: 'Inti Raymi — Fiesta del Sol',
    locations: 'Otavalo · Cotacachi · Sierra Norte',
    desc: 'La festividad indígena más importante del Ecuador. Going conecta a viajeros con comunidades locales, guías kichwa y alojamientos comunitarios auténticos.',
    color: '#f59e0b',
  },
  {
    month: 'Agosto',
    emoji: '🏔️',
    title: 'Fiestas de Quito — preparación',
    locations: 'Quito y alrededores',
    desc: 'La ciudad se prepara para sus fiestas más importantes. Pre-reserva tu transporte y alojamiento en agosto para garantizar disponibilidad en diciembre.',
    color: '#10b981',
  },
  {
    month: 'Noviembre',
    emoji: '🕯️',
    title: 'Día de Difuntos',
    locations: 'Tungurahua · Chimborazo · Sierra',
    desc: 'Una de las tradiciones más profundas de Ecuador. Transporte a los mercados tradicionales de colada morada y guaguas de pan. Cementerios patrimoniales.',
    color: '#6366f1',
  },
  {
    month: 'Diciembre',
    emoji: '🎆',
    title: 'Fiestas de Quito y Navidad',
    locations: 'Quito · Todo Ecuador',
    desc: 'El mes más festivo del año. Chivas, desfiles, conciertos, mercados navideños. Going opera en modo festividad: más conductores, tarifas congeladas, disponibilidad garantizada.',
    color: '#ff4c41',
  },
];

const benefits = [
  { emoji: '🔒', title: 'Tarifas congeladas en temporada alta', desc: 'Going congela las tarifas durante las festividades para que puedas planificar sin miedo a sobrecostos de última hora.' },
  { emoji: '📅', title: 'Reserva con 15 días de anticipación', desc: 'Abre reservas de transporte y alojamiento hasta 15 días antes de cada festividad. Primero en reservar, primero en salir.' },
  { emoji: '📦', title: 'Paquetes festividad completos', desc: 'Transporte de ida y vuelta + alojamiento + tour opcional. Un solo pago, cero complicaciones logísticas.' },
  { emoji: '⭐', title: 'Conductor de confianza por festividad', desc: 'Solicita el mismo conductor para toda la festividad. Alguien que ya conoce tus necesidades y tu destino.' },
];

export default function FestividadesPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
'#ff4c41' }}>Unirse</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #ff4c41 0%, #c0392b 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-20 w-80 h-80 rounded-full bg-red-200 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-24 text-center relative z-10">
          <FadeIn>
            <span className="inline-block text-red-100 text-sm font-semibold tracking-widest uppercase mb-4">Festividades Ecuatorianas</span>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              Vive las fiestas de Ecuador<br />con Going
            </h1>
            <p className="text-xl text-red-100 max-w-2xl mx-auto mb-10">
              Transporte seguro, alojamiento especial y tours exclusivos en cada festividad
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register" className="inline-block bg-white font-bold px-8 py-4 rounded-2xl text-lg shadow-lg hover:scale-105 transition-transform" style={{ color: '#ff4c41' }}>
                Reservar para próxima festividad
              </Link>
              <Link href="#calendario" className="inline-block border-2 border-white/50 text-white font-bold px-8 py-4 rounded-2xl text-lg hover:bg-white/10 transition-colors">
                Ver calendario 2026
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Calendar */}
      <section id="calendario" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Calendario de festividades 2026</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">Going opera en modo especial durante cada festividad del Ecuador</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {festivities.map((fest, i) => (
              <FadeIn key={fest.month} delay={i * 70}>
                <div className="rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: fest.color + '20' }}>
                      {fest.emoji}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg text-white" style={{ backgroundColor: fest.color }}>
                      {fest.month}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">{fest.title}</h3>
                  <p className="text-xs font-medium mb-3" style={{ color: fest.color }}>📍 {fest.locations}</p>
                  <p className="text-sm text-gray-500 leading-relaxed flex-1">{fest.desc}</p>
                  <Link href="/auth/register" className="mt-4 inline-block text-xs font-bold text-center py-2 px-4 rounded-xl text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: fest.color }}>
                    Pre-reservar →
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Beneficios especiales por festividad</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">Diseñados para que disfrutes cada celebración sin preocupaciones logísticas</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <FadeIn key={b.title} delay={i * 80}>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-4">{b.emoji}</div>
                  <h3 className="text-base font-bold text-gray-900 mb-3">{b.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <FadeIn>
            <div className="rounded-3xl border border-gray-100 p-10 md:p-14 text-center shadow-sm" style={{ background: 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)' }}>
              <div className="text-6xl mb-6">👨‍👩‍👧‍👦</div>
              <blockquote className="text-xl md:text-2xl text-gray-700 font-medium leading-relaxed mb-8 italic">
                &ldquo;Para el Carnaval del año pasado, reservamos con Going 12 días antes. Nos asignaron a Don Luis como conductor para todo el fin de semana en Guaranda. Él nos llevó a la Mama Negra, al desfile y hasta a una hacienda privada que nosotros nunca hubiéramos encontrado solos. Y el precio fue el mismo que reservamos desde el principio, sin sorpresas.&rdquo;
              </blockquote>
              <div>
                <div className="font-bold text-gray-900 text-lg">Familia Vásquez-Herrera</div>
                <div className="text-gray-400 text-sm mt-1">Quito · Carnaval 2025 en Guaranda</div>
                <div className="flex justify-center gap-1 mt-3">
                  {[1,2,3,4,5].map((star) => (
                    <span key={star} className="text-amber-400 text-lg">★</span>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24" style={{ background: 'linear-gradient(135deg, #ff4c41 0%, #c0392b 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn>
            <div className="text-6xl mb-6">🎊</div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5">Reservar para próxima festividad</h2>
            <p className="text-red-100 text-lg mb-4">Crea tu cuenta, elige la festividad y reserva con 15 días de anticipación</p>
            <p className="text-red-200 text-sm mb-10">Tarifas congeladas · Sin cargos ocultos · Conductor verificado</p>
            <Link href="/auth/register" className="inline-block bg-white font-bold px-10 py-4 rounded-2xl text-lg shadow-xl hover:scale-105 transition-transform" style={{ color: '#ff4c41' }}>
              Crear mi cuenta gratis
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
