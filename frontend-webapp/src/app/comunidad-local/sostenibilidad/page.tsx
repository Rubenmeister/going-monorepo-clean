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

function ProgressBar({ label, value, color = '#059669' }: { label: string; value: number; color?: string }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: inView ? `${value}%` : '0%', backgroundColor: color, transitionDelay: '200ms' }}
        />
      </div>
    </div>
  );
}

const commitments = [
  { icon: '🌱', title: 'Carbono neutral 2027', desc: 'Compensamos automáticamente cada kilómetro recorrido en la plataforma a través de proyectos de reforestación certificados en Ecuador.' },
  { icon: '♻️', title: 'App sin papel', desc: 'Facturas digitales, contratos digitales, recibos digitales. Going elimina completamente el papel de todas sus operaciones.' },
  { icon: '🌳', title: 'Un árbol por cada 100 viajes', desc: 'Por cada 100 viajes completados en la plataforma, Going planta un árbol nativo en zonas de reforestación prioritaria en Ecuador.' },
  { icon: '⚡', title: 'Flota eléctrica e híbrida', desc: 'Conductores con vehículos eléctricos o híbridos reciben incentivos especiales: mayor tarifa base y visibilidad prioritaria en la app.' },
];

const impactSteps = [
  { step: '1', title: 'Medición en tiempo real', desc: 'Cada viaje registra distancia, tipo de vehículo y número de pasajeros para calcular el CO₂ exacto.' },
  { step: '2', title: 'Comparación con línea base', desc: 'Comparamos las emisiones del viaje compartido vs los autos individuales equivalentes que hubieran hecho el mismo trayecto.' },
  { step: '3', title: 'Compensación automática', desc: 'El ahorro calculado alimenta nuestro fondo de reforestación. Sin burocracia, sin trámites, automático.' },
  { step: '4', title: 'Certificación y reporte', desc: 'Publicamos un reporte trimestral de impacto ambiental verificado por auditores independientes.' },
];

const co2Comparison = [
  { mode: 'Auto individual (solo)', co2: '180g', color: '#ef4444', width: '100%' },
  { mode: 'Going (2 pasajeros)', co2: '90g', color: '#f59e0b', width: '50%' },
  { mode: 'Going (3 pasajeros)', co2: '60g', color: '#22c55e', width: '33%' },
  { mode: 'Going eléctrico', co2: '25g', color: '#059669', width: '14%' },
];

const goals = [
  { label: 'Avance hacia carbono neutral 2027', value: 67, color: '#059669' },
  { label: 'Flota híbrida/eléctrica registrada', value: 45, color: '#10b981' },
  { label: 'Operaciones 100% digitales (sin papel)', value: 89, color: '#14532d' },
  { label: 'Viajes con 2+ pasajeros (viajes compartidos)', value: 73, color: '#16a34a' },
];

export default function SostenibilidadPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
'#ff4c41' }}>Unirse</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #14532d 0%, #059669 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-80 h-80 rounded-full bg-emerald-200 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-green-300 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-24 text-center relative z-10">
          <FadeIn>
            <span className="inline-block text-emerald-200 text-sm font-semibold tracking-widest uppercase mb-4">Sostenibilidad</span>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              Movilidad que cuida<br />el planeta
            </h1>
            <p className="text-xl text-emerald-100 max-w-2xl mx-auto mb-10">
              Cada viaje compartido es un voto por un Ecuador más limpio
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register" className="inline-block text-white font-bold px-8 py-4 rounded-2xl text-lg shadow-lg hover:scale-105 transition-transform" style={{ backgroundColor: '#ff4c41' }}>
                Únete al movimiento verde
              </Link>
              <Link href="#compromisos" className="inline-block border-2 border-white/50 text-white font-bold px-8 py-4 rounded-2xl text-lg hover:bg-white/10 transition-colors">
                Ver compromisos
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Commitments */}
      <section id="compromisos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Nuestros compromisos medioambientales</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">No son slogans. Son compromisos con métricas, plazos y responsabilidad pública.</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-6">
            {commitments.map((c, i) => (
              <FadeIn key={c.title} delay={i * 100} direction={i % 2 === 0 ? 'left' : 'right'}>
                <div className="rounded-2xl border border-gray-100 p-7 hover:shadow-lg transition-shadow flex gap-5">
                  <div className="text-4xl flex-shrink-0">{c.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{c.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{c.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How we calculate impact */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">¿Cómo calculamos el impacto?</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">Transparencia total. Metodología verificada y publicada trimestralmente.</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-4 gap-6">
            {impactSteps.map((s, i) => (
              <FadeIn key={s.step} delay={i * 100}>
                <div className="text-center bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center font-black text-xl text-white" style={{ backgroundColor: '#059669' }}>
                    {s.step}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-sm">{s.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CO2 comparison */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Viajes compartidos vs individuales</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">CO₂ emitido por km recorrido — la diferencia es enorme</p>
            </div>
          </FadeIn>
          <div className="space-y-5">
            {co2Comparison.map((row, i) => (
              <FadeIn key={row.mode} delay={i * 80}>
                <div className="bg-gray-50 rounded-2xl p-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">{row.mode}</span>
                    <span className="text-sm font-bold" style={{ color: row.color }}>{row.co2} CO₂/km</span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: row.width, backgroundColor: row.color }} />
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={400}>
            <p className="text-center text-sm text-gray-400 mt-6">Datos basados en IPCC Transport Emissions 2023 y operación real Going Ecuador</p>
          </FadeIn>
        </div>
      </section>

      {/* Progress toward goals */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Avance hacia nuestros objetivos</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">Actualizamos estas métricas cada trimestre con datos verificados</p>
            </div>
          </FadeIn>
          <div className="bg-white rounded-3xl border border-gray-100 p-8 space-y-8 shadow-sm">
            {goals.map((g, i) => (
              <FadeIn key={g.label} delay={i * 80}>
                <ProgressBar label={g.label} value={g.value} color={g.color} />
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={300}>
            <p className="text-center text-xs text-gray-400 mt-4">Último reporte: Q1 2026 — Próxima actualización: Abril 2026</p>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24" style={{ background: 'linear-gradient(135deg, #14532d 0%, #059669 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn>
            <div className="text-6xl mb-6">🌍</div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5">Únete al movimiento verde</h2>
            <p className="text-emerald-100 text-lg mb-10">Cada cuenta Going es un compromiso con un Ecuador más limpio, más verde y más sostenible</p>
            <Link href="/auth/register" className="inline-block bg-white font-bold px-10 py-4 rounded-2xl text-lg shadow-xl hover:scale-105 transition-transform" style={{ color: '#14532d' }}>
              Crear mi cuenta gratis
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
