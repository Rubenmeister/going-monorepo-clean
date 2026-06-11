'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
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

const stats = [
  { value: 'Viajes compartidos', label: 'menos autos en la vía', icon: '🚗', desc: 'Cada viaje compartido puede reemplazar varios autos individuales' },
  { value: 'Menos emisiones', label: 'movilidad más limpia', icon: '🌿', desc: 'Compartir el trayecto reduce el CO₂ por persona' },
  { value: 'Tiempo de vuelta', label: 'menos horas en tráfico', icon: '⏱️', desc: 'Rutas optimizadas que devuelven tiempo a las familias' },
  { value: 'Economía local', label: 'el valor se queda acá', icon: '💚', desc: 'Lo que se mueve en Going App impulsa a Ecuador' },
];

const trafficCards = [
  { title: 'Menos autos en circulación', desc: 'Un solo viaje Going App puede reemplazar 2 a 4 autos individuales, reduciendo el volumen de tráfico en horas pico.' },
  { title: 'Menos parqueos necesarios', desc: 'Cada auto compartido libera hasta 5 espacios de estacionamiento, devolviendo espacio público a la ciudad.' },
  { title: 'Rutas optimizadas por IA', desc: 'Nuestro algoritmo agrupa viajes con trayectorias similares, reduciendo kilómetros recorridos totales.' },
  { title: 'Menos accidentes en vía', desc: 'Conductores Going App están verificados, evaluados y entrenados, lo que eleva el estándar de seguridad vial.' },
];

const economicCards = [
  { emoji: '🚘', title: 'Conductoras y conductores', desc: 'Vos generás ingresos con tu auto y tu tiempo, con pagos claros y horario libre.' },
  { emoji: '🏨', title: 'Hoteles y alojamientos', desc: 'Anfitrionas y anfitriones conectan su espacio con viajeras y viajeros verificados.' },
  { emoji: '🗺️', title: 'Tours y experiencias', desc: 'Guías y operadoras turísticas llegan a viajeras y viajeros que buscan lo auténtico de Ecuador.' },
  { emoji: '🔄', title: 'Economía circular', desc: 'Lo que se mueve en Going App impulsa a otras personas y negocios de la misma ciudad.' },
];

const sostenibilidadCards = [
  { icon: '🌱', title: 'Flota hacia vehículos limpios', desc: 'Going App incentiva activamente a conductoras y conductores a migrar a vehículos híbridos y eléctricos con tarifas preferenciales y bonificaciones.' },
  { icon: '♻️', title: 'Operación sin papel', desc: 'Contratos, recibos y comunicaciones son 100% digitales. Cero papel en toda la cadena operativa de Going App.' },
  { icon: '🌍', title: 'Neutralidad de carbono 2030', desc: 'Going App está comprometido a compensar el 100% de las emisiones generadas por su operación antes del año 2030.' },
  { icon: '💧', title: 'Oficinas sostenibles', desc: 'Nuestras instalaciones operan con energía renovable certificada y programas de gestión de residuos.' },
  { icon: '🤝', title: 'Proveedores responsables', desc: 'Exigimos estándares ambientales y sociales a todos nuestros socios y proveedores tecnológicos.' },
  { icon: '📊', title: 'Reporte de impacto anual', desc: 'Publicamos anualmente nuestro reporte de sostenibilidad con métricas verificadas por terceros.' },
];

export default function ImpactoPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Hero */}
      <section className="pt-16 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #16a34a 0%, #0f4c2a 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-emerald-300 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-24 text-center relative z-10">
          <FadeIn>
            <span className="inline-block text-emerald-200 text-sm font-semibold tracking-widest uppercase mb-4">Impacto y Sostenibilidad</span>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              Going App transforma la<br />movilidad y cuida el planeta
            </h1>
            <p className="text-xl text-emerald-100 max-w-2xl mx-auto mb-10">
              Menos autos individuales, más viajes compartidos y el compromiso de una operación carbono neutral al 2030
            </p>
            <Link href="/auth/register" className="inline-block text-white font-bold px-8 py-4 rounded-2xl text-lg shadow-lg hover:scale-105 transition-transform" style={{ backgroundColor: '#ff4c41' }}>
              Sumarme al cambio
            </Link>
          </FadeIn>
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 pb-12">
            {stats.map((s, i) => (
              <FadeIn key={s.label} delay={i * 80}>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20">
                  <div className="text-3xl mb-1">{s.icon}</div>
                  <div className="text-2xl md:text-3xl font-black text-white">{s.value}</div>
                  <div className="text-emerald-200 text-xs mt-1 font-medium">{s.label}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Stats detail */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Nuestro impacto crecerá con cada viaje</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">Going App está por arrancar en Ecuador. Este es el impacto que vamos a construir juntos, viaje a viaje.</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <FadeIn key={s.value} delay={i * 80}>
                <div className="rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow">
                  <div className="text-4xl mb-3">{s.icon}</div>
                  <div className="text-3xl font-black text-gray-900">{s.value}</div>
                  <div className="text-sm font-bold text-green-600 mt-1 mb-2">{s.label}</div>
                  <p className="text-gray-500 text-sm">{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How Going App reduces traffic */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">¿Cómo Going App reduce el tráfico?</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">Tecnología y comunidad al servicio de una ciudad que fluye mejor</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-6">
            {trafficCards.map((card, i) => (
              <FadeIn key={card.title} delay={i * 100} direction={i % 2 === 0 ? 'left' : 'right'}>
                <div className="bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-md transition-shadow flex gap-4">
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-white text-lg" style={{ backgroundColor: '#16a34a' }}>
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{card.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Economic impact */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Impacto económico local</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">Conductoras y conductores, anfitrionas y anfitriones, guías y operadoras — una economía circular que crece con cada viaje</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {economicCards.map((card, i) => (
              <FadeIn key={card.title} delay={i * 80}>
                <div className="rounded-2xl border border-gray-100 p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="text-4xl mb-4">{card.emoji}</div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{card.title}</h3>
                  <p className="text-gray-500 text-sm">{card.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Sostenibilidad */}
      <section className="py-20 bg-white" id="sostenibilidad">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="inline-block text-emerald-600 text-sm font-semibold tracking-widest uppercase mb-3">Sostenibilidad</span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Construyendo un Ecuador más verde</h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">Cada decisión en Going App está guiada por nuestro compromiso con el medio ambiente y las generaciones futuras</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sostenibilidadCards.map((card, i) => (
              <FadeIn key={card.title} delay={i * 80}>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6 hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-4">{card.icon}</div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{card.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={200}>
            <div className="mt-12 rounded-3xl p-8 text-center" style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
              <p className="text-2xl font-black text-green-900 mb-2">Meta: Neutralidad de carbono 2030</p>
              <p className="text-green-700 text-base max-w-xl mx-auto">Going App compensa las emisiones de CO₂ generadas por su operación a través de programas certificados de reforestación en Ecuador</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24" style={{ background: 'linear-gradient(135deg, #16a34a 0%, #0f4c2a 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5">Únete y contribuye al cambio</h2>
            <p className="text-emerald-100 text-lg mb-10">Cada viaje que haces con Going App suma al impacto colectivo de nuestra comunidad</p>
            <Link href="/auth/register" className="inline-block bg-white font-bold px-10 py-4 rounded-2xl text-lg shadow-xl hover:scale-105 transition-transform" style={{ color: '#16a34a' }}>
              Crear mi cuenta gratis
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
