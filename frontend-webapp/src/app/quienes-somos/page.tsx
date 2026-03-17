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
      <section className="pt-32 pb-24 px-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1010 50%, #ff4c41 100%)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-white/5 translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-5 py-2 text-white/90 text-sm font-medium mb-8">
            🇪🇨 La primera SuperApp de turismo colaborativo de Latinoamérica
          </div>
          <h1 className="font-black text-white mb-6 leading-tight" style={{ fontSize: 'clamp(2.8rem, 7vw, 5rem)' }}>
            Somos Going
          </h1>
          <p className="text-white/80 text-xl leading-relaxed max-w-3xl mx-auto">
            Transformamos la experiencia de viaje en Ecuador conectando viajeros, conductoras y conductores, anfitriones y proveedores locales en una sola plataforma integral, sostenible e inclusiva.
          </p>
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

      {/* Propuesta de Valor */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#ff4c41' }}>Por qué Going</span>
            <h2 className="text-4xl font-black text-gray-900 mb-3">Propuesta de Valor</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Going es una plataforma completa para atender la demanda de viajes y experiencias en Ecuador.
            </p>
          </FadeIn>

          {/* Integralidad highlight */}
          <FadeIn delay={100}>
            <div className="rounded-3xl p-10 mb-12 text-white" style={{ background: 'linear-gradient(135deg, #1e3a8a, #0f172a)' }}>
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <div className="text-3xl mb-3">🚗</div>
                  <h4 className="font-black text-lg mb-2">Traslados</h4>
                  <p className="text-blue-200 text-sm leading-relaxed">De ciudad a ciudad y hacia los aeropuertos de Quito y Guayaquil, en vehículos modernos con conductoras y conductores experimentados.</p>
                </div>
                <div>
                  <div className="text-3xl mb-3">🏡</div>
                  <h4 className="font-black text-lg mb-2">Alojamiento</h4>
                  <p className="text-blue-200 text-sm leading-relaxed">Conexión con anfitrionas y anfitriones locales para ofrecer opciones de alojamiento personalizadas y verificadas.</p>
                </div>
                <div>
                  <div className="text-3xl mb-3">🧭</div>
                  <h4 className="font-black text-lg mb-2">Tours y Actividades</h4>
                  <p className="text-blue-200 text-sm leading-relaxed">Colaboración con operadores y anfitriones locales para brindar experiencias únicas a los viajeros en todo el país.</p>
                </div>
              </div>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DIFFERENTIATORS.map((d, i) => (
              <FadeIn key={d.title} delay={i * 70}>
                <div className="flex gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all h-full">
                  <span className="text-3xl flex-shrink-0 mt-0.5">{d.icon}</span>
                  <div>
                    <h4 className="font-black text-gray-900 text-base mb-2">{d.title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{d.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
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
