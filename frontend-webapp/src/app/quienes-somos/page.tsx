'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

function useInView(threshold = 0.12) {
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

function FadeIn({ children, delay = 0, direction = 'up', className = '' }: {
  children: React.ReactNode; delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none'; className?: string;
}) {
  const { ref, inView } = useInView();
  const translate = direction === 'up' ? 'translateY(28px)' : direction === 'left' ? 'translateX(-28px)' : direction === 'right' ? 'translateX(28px)' : 'none';
  return (
    <div ref={ref} className={className} style={{ opacity: inView ? 1 : 0, transform: inView ? 'none' : translate, transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

const VALUES = [
  { icon: '💡', title: 'Innovación', desc: 'Impulsamos la transformación del sector turístico mediante tecnología moderna: sistemas de seguimiento, respuesta inmediata y capacitación continua.' },
  { icon: '🤝', title: 'Colaboración', desc: 'Fomentamos relaciones horizontales entre personas usuarias, prestadoras de servicios y anfitrionas locales. Todos en igualdad.' },
  { icon: '⭐', title: 'Calidad', desc: 'Ofrecemos un servicio de excelencia que supera las expectativas. Cada experiencia Going está pensada para el detalle.' },
  { icon: '🌱', title: 'Sostenibilidad', desc: 'Protegemos el medio ambiente con prácticas eco-responsables, reducción de la huella de carbono y opciones de movilidad compartida.' },
  { icon: '🌍', title: 'Inclusión', desc: 'Generamos oportunidades para todas las personas, sin importar su origen o condición social. El turismo justo es posible.' },
  { icon: '🔍', title: 'Transparencia', desc: 'Garantizamos visibilidad plena de las operaciones y decisiones dentro de la plataforma para construir confianza real.' },
  { icon: '🛡️', title: 'Seguridad', desc: 'Nuestra máxima prioridad. Seguimiento en tiempo real, vehículos en excelente estado y conductoras y conductores experimentados y bien evaluados.' },
];

const DIFFERENTIATORS = [
  {
    icon: '🔄',
    title: 'Economía colaborativa',
    desc: 'Conectamos viajeros con anfitrionas y anfitriones locales, generando beneficios reales para toda la comunidad. Precios competitivos y oportunidades para todos.',
  },
  {
    icon: '📱',
    title: 'Innovación tecnológica',
    desc: 'Plataforma intuitiva con seguimiento en tiempo real, respuesta inmediata y gestión integral del viaje. Tecnología al servicio de las personas.',
  },
  {
    icon: '↔️',
    title: 'Conexión horizontal',
    desc: 'Comunicación directa entre viajeros, anfitriones, conductoras y conductores, y proveedores. Una comunidad sin jerarquías donde todos se cuidan.',
  },
  {
    icon: '🛡️',
    title: 'Seguridad integral',
    desc: 'Seguimiento GPS, dispositivos de seguridad, vehículos verificados y conductoras y conductores con evaluaciones reales. Viaja sin preocupaciones.',
  },
  {
    icon: '🌿',
    title: 'Sostenibilidad ambiental',
    desc: 'Cada viaje compartido reduce emisiones. Promovemos prácticas eco-responsables y la reducción activa de la huella de carbono.',
  },
  {
    icon: '🤲',
    title: 'Inclusión social',
    desc: 'Creamos oportunidades de trabajo e ingresos para todas las personas. Conductoras y conductores, anfitrionas y anfitriones, proveedores locales.',
  },
];

function ServiceCard({ icon, title, desc, price, highlight }: { icon: string; title: string; desc: string; price?: string; highlight?: boolean }) {
  return (
    <div
      className="rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1"
      style={{
        background: highlight ? '#ff4c41' : '#fff',
        color: highlight ? '#fff' : '#1a1a1a',
        boxShadow: highlight ? '0 8px 40px rgba(255,76,65,0.32)' : '0 2px 16px rgba(0,0,0,0.07)',
        border: highlight ? 'none' : '1px solid #f0f0f0',
      }}
    >
      <div className="text-3xl mb-4">{icon}</div>
      <div className="font-extrabold text-lg mb-2">{title}</div>
      <div className="text-sm leading-relaxed mb-3" style={{ color: highlight ? 'rgba(255,255,255,0.85)' : '#666' }}>{desc}</div>
      {price && <div className="text-sm font-bold" style={{ color: highlight ? 'rgba(255,255,255,0.9)' : '#ff4c41' }}>{price}</div>}
    </div>
  );
}

const MILESTONES = [
  { year: '2023', title: 'La idea nace', desc: 'Fundadores hartos del caos de coordinar transporte por WhatsApp. Comenzamos a construir la solución que Ecuador necesitaba.' },
  { year: '2024', title: 'Primer piloto', desc: 'Lanzamos en Quito con conductoras y conductores verificados. Primer mes: miles de viajes completados.' },
  { year: '2025', title: 'Expansión nacional', desc: 'Llegamos a 20 ciudades. Lanzamos Alojamiento, Tours, Experiencias y Envíos. La SuperApp toma forma.' },
  { year: '2026', title: 'La primera SuperApp', desc: 'Más de 1 millón de personas usuarias. Going: la primera SuperApp de turismo colaborativo de Latinoamérica.' },
];

export default function QuienesSomosPage() {
  return (
    <div className="bg-white min-h-screen">

      {/* Hero */}
      <section className="pt-12 pb-24 px-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1010 50%, #ff4c41 100%)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-white/5 translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-10">
          {/* Texto */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-5 py-2 text-white/90 text-sm font-medium mb-8">
              🇪🇨 La primera SuperApp de turismo colaborativo de Latinoamérica
            </div>
            <h1 className="font-black text-white mb-6 leading-tight" style={{ fontSize: 'clamp(2.8rem, 7vw, 5rem)' }}>
              Somos Going
            </h1>
            <p className="text-white/80 text-xl leading-relaxed">
              Transformamos la experiencia de viaje en Ecuador conectando viajeros, conductoras y conductores, anfitriones y proveedores locales en una sola plataforma integral, sostenible e inclusiva.
            </p>
          </div>
          {/* Foto pasajeros */}
          <div className="flex-1 w-full md:max-w-md">
            <img
              src="/images/pasajeros.JPG"
              alt="Pasajeros Going en Ecuador"
              className="w-full rounded-3xl shadow-2xl object-cover"
              style={{ maxHeight: '420px' }}
            />
          </div>
        </div>
      </section>

      {/* Misión */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <FadeIn direction="left">
              <span className="inline-block text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#ff4c41' }}>Nuestra Misión</span>
              <h2 className="text-3xl font-black text-gray-900 mb-6 leading-snug">
                Transformar la experiencia de viaje en Ecuador
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Ser la empresa tecnológica líder en economía colaborativa que, a través de la innovación y la conexión horizontal entre personas usuarias, prestadoras de servicio y anfitrionas locales, busca:
              </p>
              <ul className="space-y-4">
                {[
                  { icon: '🚗', text: 'Brindar un servicio integral de transporte, alojamiento, tours y actividades.' },
                  { icon: '🌿', text: 'Promover la sostenibilidad ambiental con prácticas eco-responsables y reducción de la huella de carbono.' },
                  { icon: '🤲', text: 'Fomentar la inclusión social generando oportunidades de trabajo e ingresos para todas las personas.' },
                  { icon: '🛡️', text: 'Garantizar la seguridad con seguimiento en tiempo real y conductoras y conductores experimentados.' },
                  { icon: '💡', text: 'Impulsar la innovación con sistemas modernos de seguimiento, control permanente y capacitación continua.' },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                    <span className="text-gray-600 leading-relaxed">{item.text}</span>
                  </li>
                ))}
              </ul>
            </FadeIn>

            <FadeIn direction="right" delay={150}>
              <div className="space-y-6">
                {/* Visión */}
                <div className="bg-gray-900 rounded-3xl p-8 text-white">
                  <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#ff4c41' }}>Nuestra Visión</span>
                  <h3 className="text-2xl font-black mb-4 leading-snug">
                    Ser la plataforma líder en viajes y experiencias
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Reconocida por su enfoque innovador, su compromiso con la sostenibilidad ambiental y social, y por construir un futuro más justo y seguro para todas las personas.
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: '1M+', label: 'Personas usuarias', color: '#ff4c41' },
                    { value: '50+', label: 'Ciudades conectadas', color: '#1e3a8a' },
                    { value: '5K+', label: 'Conductoras y conductores', color: '#16a34a' },
                    { value: '4.9★', label: 'Calificación promedio', color: '#f59e0b' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-gray-50 rounded-2xl p-5 text-center border border-gray-100">
                      <div className="text-3xl font-black mb-1" style={{ color: stat.color }}>{stat.value}</div>
                      <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#ff4c41' }}>Lo que nos mueve</span>
            <h2 className="text-4xl font-black text-gray-900 mb-3">Nuestros Valores</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Principios que guían cada decisión, cada línea de código y cada experiencia Going.</p>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {VALUES.map((v, i) => (
              <FadeIn key={v.title} delay={i * 60}>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all h-full">
                  <div className="text-3xl mb-4">{v.icon}</div>
                  <h3 className="text-base font-black text-gray-900 mb-2">{v.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="py-20 px-6" style={{ background: '#f9fafb' }}>
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="inline-block text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#ff4c41' }}>Lo que ofrecemos</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Todo lo que puedes reservar en Going</h2>
              <p className="text-gray-500">Un solo lugar. Múltiples soluciones de movilidad.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <FadeIn delay={0}><ServiceCard icon="🚗" title="Viajes Compartidos" desc="La forma más económica de viajar entre ciudades. Comparte el vehículo y el costo." price="Desde $3 por trayecto" highlight /></FadeIn>
            <FadeIn delay={80}><ServiceCard icon="🚙" title="Transporte Privado" desc="El vehículo es tuyo. Por trayecto o por días. Ideal para grupos y familias." price="Precio fijo desde el inicio" /></FadeIn>
            <FadeIn delay={160}><ServiceCard icon="📦" title="Envíos Express" desc="Envía paquetes a cualquier ciudad. Tracking en tiempo real incluido." price="Recolección en 30 minutos" /></FadeIn>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FadeIn delay={240}><ServiceCard icon="🏨" title="Alojamiento" desc="Hospedaje verificado en toda la ruta. Desde casas locales a hoteles." /></FadeIn>
            <FadeIn delay={300}><ServiceCard icon="🗺️" title="Tours" desc="Guías locales expertos. Descubre Ecuador con quien la conoce de verdad." /></FadeIn>
          </div>
        </div>
      </section>

      {/* Historia / Timeline */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#ff4c41' }}>Nuestra historia</span>
            <h2 className="text-4xl font-black text-gray-900">De idea a revolución</h2>
          </FadeIn>

          <div className="relative pl-10">
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />
            <div className="space-y-10">
              {MILESTONES.map((m, i) => (
                <FadeIn key={m.year} delay={i * 100} direction="left">
                  <div className="relative flex items-start gap-6">
                    <div className="absolute -left-10 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black z-10" style={{ backgroundColor: '#ff4c41' }}>
                      {m.year.slice(2)}
                    </div>
                    <div className="flex-1 bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-sm transition-all">
                      <div className="text-xs font-bold mb-1" style={{ color: '#ff4c41' }}>{m.year}</div>
                      <h3 className="text-lg font-black text-gray-900 mb-2">{m.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1010 50%, #ff4c41 100%)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <div className="text-5xl mb-6">🇪🇨</div>
            <h2 className="text-4xl font-black text-white mb-4">
              ¿Quieres ser parte de Going?
            </h2>
            <p className="text-white/80 text-lg mb-10 leading-relaxed">
              Únete como viajero, conductora o conductor, anfitriona o anfitrión, o proveedor de servicios.<br />
              Juntos construimos un turismo más justo, seguro, sostenible e inclusivo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 font-black px-8 py-4 rounded-2xl text-lg hover:bg-gray-100 transition-all hover:scale-105">
                🧳 Soy viajero/a
              </Link>
              <Link href="/conductores" className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-black px-8 py-4 rounded-2xl text-lg hover:bg-white/20 transition-all">
                🚗 Quiero conducir
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
