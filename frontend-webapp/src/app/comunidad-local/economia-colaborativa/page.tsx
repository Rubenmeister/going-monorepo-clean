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

const steps = [
  { number: '01', title: 'Tienes algo', desc: 'Un auto, una habitación, un conocimiento, un vehículo de carga — recursos que están subutilizados la mayor parte del tiempo.' },
  { number: '02', title: 'Lo compartes', desc: 'A través de Going, lo pones a disposición de personas que lo necesitan, en el momento exacto en que lo necesitan.' },
  { number: '03', title: 'Generas valor', desc: 'Recibes ingresos, ellos reciben un servicio de calidad, y toda la comunidad se beneficia del uso eficiente de los recursos.' },
];

const goingCards = [
  { emoji: '🚗', title: 'Tu auto genera ingresos', subtitle: 'mientras no lo usas', desc: 'El ecuatoriano promedio usa su auto solo 4% del tiempo. Con Going, conviertes el 96% de tiempo inactivo en ingreso real.', badge: 'Transporte' },
  { emoji: '🏠', title: 'Tu casa genera ingresos', subtitle: 'como alojamiento', desc: 'Una habitación vacía o una segunda propiedad se convierte en fuente de ingresos recurrentes para huéspedes nacionales e internacionales.', badge: 'Alojamiento' },
  { emoji: '🗺️', title: 'Tu conocimiento genera ingresos', subtitle: 'como guía turístico', desc: 'Conoces tu ciudad, tu cultura, tus senderos. Comparte esa riqueza con viajeros que pagan por experiencias auténticas y locales.', badge: 'Experiencias' },
  { emoji: '📦', title: 'Tu moto o camioneta', subtitle: 'genera ingresos con envíos', desc: 'La demanda de entregas en Ecuador crece 40% cada año. Tu vehículo puede trabajar por ti mientras tú decides cuándo y cómo.', badge: 'Envíos' },
];

const comparison = [
  { aspect: 'Propiedad', traditional: 'Para uso exclusivo del dueño', collaborative: 'Compartida para maximizar uso' },
  { aspect: 'Ingresos', traditional: 'Solo por empleo formal', collaborative: 'Por compartir recursos propios' },
  { aspect: 'Flexibilidad', traditional: 'Horario fijo, jefe, contrato', collaborative: 'Tú decides cuándo y cuánto' },
  { aspect: 'Comunidad', traditional: 'Relación proveedor-cliente fría', collaborative: 'Conexiones humanas reales' },
  { aspect: 'Impacto', traditional: 'Consumo individual', collaborative: 'Uso eficiente y sostenible' },
];

const testimonials = [
  { name: 'Carmen V.', city: 'Quito', role: 'Conductora y anfitriona', quote: 'Con Going llevo a mis hijos al colegio y de regreso uso el tiempo para hacer viajes. Mi cuarto vacío lo alquilo los fines de semana. Genero más de $1,200 al mes sin salir de mi rutina.', emoji: '👩' },
  { name: 'Roberto P.', city: 'Cuenca', role: 'Guía turístico', quote: 'Trabajé 20 años en turismo formal. Ahora soy mi propio jefe, elijo mis grupos y gano el doble que antes. Mis tours del centro histórico están llenos todos los fines de semana.', emoji: '👨' },
  { name: 'Familia Tapia', city: 'Guayaquil', role: 'Anfitriones', quote: 'Teníamos un departamento vacío que nos costaba mantenimiento. Ahora genera $600 al mes. Ya pagamos la hipoteca con eso y el dinero extra lo ahorramos para los estudios de nuestros hijos.', emoji: '👨‍👩‍👧' },
];

export default function EconomiaColaborativaPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
'#ff4c41' }}>Unirse</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #3730a3 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-20 w-80 h-80 rounded-full bg-indigo-200 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-24 text-center relative z-10">
          <FadeIn>
            <span className="inline-block text-indigo-200 text-sm font-semibold tracking-widest uppercase mb-4">Economía Colaborativa</span>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              ¿Qué es la economía<br />colaborativa?
            </h1>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-10">
              Cuando las personas comparten recursos, todos ganan
            </p>
            <Link href="/auth/register" className="inline-block text-white font-bold px-8 py-4 rounded-2xl text-lg shadow-lg hover:scale-105 transition-transform" style={{ backgroundColor: '#ff4c41' }}>
              Empieza a generar ingresos
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* 3 Steps */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Así de simple funciona</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">La economía colaborativa no es un concepto abstracto. Es una realidad que ya viven miles de ecuatorianos.</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <FadeIn key={step.number} delay={i * 120}>
                <div className="relative rounded-3xl border border-gray-100 p-8 hover:shadow-lg transition-shadow">
                  <div className="text-6xl font-black mb-4" style={{ color: '#6366f1', opacity: 0.15 }}>{step.number}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 text-2xl text-gray-300 z-10">→</div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Going in collaborative economy */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Going en la economía colaborativa</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">Una plataforma, cuatro formas de generar valor con lo que ya tienes</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-6">
            {goingCards.map((card, i) => (
              <FadeIn key={card.title} delay={i * 80} direction={i % 2 === 0 ? 'left' : 'right'}>
                <div className="bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-md transition-shadow flex gap-5">
                  <div className="text-5xl flex-shrink-0">{card.emoji}</div>
                  <div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{ backgroundColor: '#6366f1' }}>{card.badge}</span>
                    <h3 className="text-lg font-bold text-gray-900 mt-2">{card.title}</h3>
                    <p className="text-sm font-medium mb-2" style={{ color: '#6366f1' }}>{card.subtitle}</p>
                    <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Economía Tradicional vs Colaborativa</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">¿Por qué cada vez más ecuatorianos eligen el modelo colaborativo?</p>
            </div>
          </FadeIn>
          <FadeIn delay={100}>
            <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-100">
                <div className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Aspecto</div>
                <div className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wide text-center border-l border-gray-100">Economía Tradicional</div>
                <div className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-center border-l border-gray-100" style={{ color: '#6366f1' }}>Going Colaborativo</div>
              </div>
              {comparison.map((row, i) => (
                <div key={row.aspect} className={`grid grid-cols-3 ${i < comparison.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="px-6 py-4 text-sm font-bold text-gray-700">{row.aspect}</div>
                  <div className="px-6 py-4 text-sm text-gray-500 text-center border-l border-gray-100">{row.traditional}</div>
                  <div className="px-6 py-4 text-sm font-medium text-center border-l border-gray-100" style={{ color: '#6366f1' }}>{row.collaborative}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Impacto real en familias ecuatorianas</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">Historias de personas que transformaron su vida económica con Going</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <FadeIn key={t.name} delay={i * 100}>
                <div className="bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-4">{t.emoji}</div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
                  <div>
                    <div className="font-bold text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role} · {t.city}</div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #3730a3 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5">Empieza a generar ingresos</h2>
            <p className="text-indigo-100 text-lg mb-10">Únete a los miles de ecuatorianos que ya aprovechan la economía colaborativa con Going</p>
            <Link href="/auth/register" className="inline-block font-bold px-10 py-4 rounded-2xl text-lg shadow-xl hover:scale-105 transition-transform bg-white" style={{ color: '#6366f1' }}>
              Crear mi cuenta gratis
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
