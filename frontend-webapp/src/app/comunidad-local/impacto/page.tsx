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

const stats = [
  { value: '180,000', label: 'viajes compartidos/mes', icon: '🚗', desc: 'Cada viaje compartido reemplaza hasta 3 autos individuales' },
  { value: '12,000', label: 'toneladas CO₂ evitadas', icon: '🌿', desc: 'Equivalente a plantar 550,000 árboles cada año' },
  { value: '4.2M', label: 'horas ahorradas en tráfico', icon: '⏱️', desc: 'Tiempo devuelto a las familias ecuatorianas' },
  { value: '$300M', label: 'movilizados localmente', icon: '💚', desc: 'Dinero que se queda en la economía ecuatoriana' },
];

const trafficCards = [
  { title: 'Menos autos en circulación', desc: 'Un solo viaje Going puede reemplazar 2 a 4 autos individuales, reduciendo el volumen de tráfico en horas pico.' },
  { title: 'Menos parqueos necesarios', desc: 'Cada auto compartido libera hasta 5 espacios de estacionamiento, devolviendo espacio público a la ciudad.' },
  { title: 'Rutas optimizadas por IA', desc: 'Nuestro algoritmo agrupa viajes con trayectorias similares, reduciendo kilómetros recorridos totales.' },
  { title: 'Menos accidentes en vía', desc: 'Conductores Going están verificados, evaluados y entrenados, lo que eleva el estándar de seguridad vial.' },
];

const economicCards = [
  { emoji: '🚘', title: 'Conductores prósperos', desc: 'Más de 28,000 conductores generan ingresos estables gracias a la plataforma Going.' },
  { emoji: '🏨', title: 'Hoteles y alojamientos', desc: 'El 34% de huéspedes en alojamientos Going llegaron vía transporte Going, creando un ecosistema integrado.' },
  { emoji: '🗺️', title: 'Tours que florecen', desc: 'Guías y operadoras turísticas duplicaron sus ventas conectándose con turistas a través de Going.' },
  { emoji: '🔄', title: 'Economía circular', desc: 'Cada dólar gastado en Going genera $2.8 de actividad económica adicional en la ciudad.' },
];

const cities = [
  { name: 'Quito', viajes: '78,000/mes', co2: '5,200 ton', conductores: '12,400', rating: '4.8' },
  { name: 'Guayaquil', viajes: '62,000/mes', co2: '4,100 ton', conductores: '9,800', rating: '4.7' },
  { name: 'Cuenca', viajes: '22,000/mes', co2: '1,450 ton', conductores: '3,600', rating: '4.9' },
  { name: 'Manta', viajes: '11,000/mes', co2: '720 ton', conductores: '1,900', rating: '4.8' },
  { name: 'Ambato', viajes: '7,000/mes', co2: '530 ton', conductores: '1,300', rating: '4.7' },
];

const sostenibilidadCards = [
  { icon: '🌱', title: 'Flota hacia vehículos limpios', desc: 'Going incentiva activamente a los conductores a migrar a vehículos híbridos y eléctricos con tarifas preferenciales y bonificaciones.' },
  { icon: '♻️', title: 'Operación sin papel', desc: 'Contratos, recibos y comunicaciones son 100% digitales. Cero papel en toda la cadena operativa de Going.' },
  { icon: '🌍', title: 'Neutralidad de carbono 2030', desc: 'Going está comprometido a compensar el 100% de las emisiones generadas por su operación antes del año 2030.' },
  { icon: '💧', title: 'Oficinas sostenibles', desc: 'Nuestras instalaciones operan con energía renovable certificada y programas de gestión de residuos.' },
  { icon: '🤝', title: 'Proveedores responsables', desc: 'Exigimos estándares ambientales y sociales a todos nuestros socios y proveedores tecnológicos.' },
  { icon: '📊', title: 'Reporte de impacto anual', desc: 'Publicamos anualmente nuestro reporte de sostenibilidad con métricas verificadas por terceros.' },
];

export default function ImpactoPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><Image src="/going-logo-h.png" alt="Going" width={120} height={40} className="h-9 w-auto" /></Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Iniciar sesión</Link>
            <Link href="/auth/register" className="text-sm text-white font-bold px-4 py-2 rounded-xl" style={{ backgroundColor: '#ff4c41' }}>Unirse</Link>
          </div>
        </div>
      </nav>

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
              Going transforma la<br />movilidad y cuida el planeta
            </h1>
            <p className="text-xl text-emerald-100 max-w-2xl mx-auto mb-10">
              Menos autos individuales, más viajes compartidos, operación sostenible y carbono neutral al 2030
            </p>
            <Link href="/auth/register" className="inline-block text-white font-bold px-8 py-4 rounded-2xl text-lg shadow-lg hover:scale-105 transition-transform" style={{ backgroundColor: '#ff4c41' }}>
              Ver mi impacto
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
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Números que hablan por sí solos</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">Datos reales de la operación Going en Ecuador durante el último año</p>
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

      {/* How Going reduces traffic */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">¿Cómo Going reduce el tráfico?</h2>
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
              <p className="text-gray-500 text-lg max-w-xl mx-auto">Conductores ganan, hoteles llenan, tours florecen — una economía circular que crece sola</p>
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

      {/* Cities */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Ciudades con más impacto</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">Presencia activa en las principales ciudades del Ecuador</p>
            </div>
          </FadeIn>
          <FadeIn delay={100}>
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="grid grid-cols-5 bg-gray-50 border-b border-gray-100 px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                <span>Ciudad</span>
                <span className="text-center">Viajes/mes</span>
                <span className="text-center">CO₂ evitado</span>
                <span className="text-center">Conductores</span>
                <span className="text-center">Rating</span>
              </div>
              {cities.map((city, i) => (
                <div key={city.name} className={`grid grid-cols-5 px-6 py-4 items-center ${i < cities.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <span className="font-bold text-gray-900">{city.name}</span>
                  <span className="text-center text-green-600 font-semibold text-sm">{city.viajes}</span>
                  <span className="text-center text-gray-600 text-sm">{city.co2}</span>
                  <span className="text-center text-gray-600 text-sm">{city.conductores}</span>
                  <span className="text-center font-bold text-amber-500">{city.rating} ⭐</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Sostenibilidad */}
      <section className="py-20 bg-white" id="sostenibilidad">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="inline-block text-emerald-600 text-sm font-semibold tracking-widest uppercase mb-3">Sostenibilidad</span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Construyendo un Ecuador más verde</h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">Cada decisión en Going está guiada por nuestro compromiso con el medio ambiente y las generaciones futuras</p>
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
              <p className="text-green-700 text-base max-w-xl mx-auto">Going compensa las emisiones de CO₂ generadas por su operación a través de programas certificados de reforestación en Ecuador</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24" style={{ background: 'linear-gradient(135deg, #16a34a 0%, #0f4c2a 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5">Únete y contribuye al cambio</h2>
            <p className="text-emerald-100 text-lg mb-10">Cada viaje que haces con Going suma al impacto colectivo de nuestra comunidad</p>
            <Link href="/auth/register" className="inline-block bg-white font-bold px-10 py-4 rounded-2xl text-lg shadow-xl hover:scale-105 transition-transform" style={{ color: '#16a34a' }}>
              Crear mi cuenta gratis
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
