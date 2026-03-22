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

const upcomingEvents = [
  {
    date: '25 Mar 2026',
    day: '25',
    month: 'MAR',
    title: 'Encuentro de Conductores Quito',
    location: 'Hotel Dann Carlton, Quito',
    type: 'Presencial',
    typeColor: '#f59e0b',
    spots: '120 cupos disponibles',
    desc: 'El gran encuentro trimestral de conductores Going de la Sierra. Networking, reconocimientos y presentación de novedades de la plataforma.',
  },
  {
    date: '1 Abr 2026',
    day: '01',
    month: 'ABR',
    title: 'Taller: Maximiza tus ganancias',
    location: 'Online — Zoom',
    type: 'Online',
    typeColor: '#6366f1',
    spots: '500 cupos disponibles',
    desc: 'Aprende las estrategias probadas para incrementar tus ingresos en la plataforma. Horarios óptimos, zonas calientes y bonificaciones.',
  },
  {
    date: '8 Abr 2026',
    day: '08',
    month: 'ABR',
    title: 'Going + Turismo: Mesa Redonda',
    location: 'Guayaquil (sede por confirmar)',
    type: 'Presencial',
    typeColor: '#f59e0b',
    spots: '60 cupos disponibles',
    desc: 'Diálogo abierto entre conductores, anfitriones, guías turísticos y el equipo Going sobre el futuro de la movilidad turística en Ecuador.',
  },
  {
    date: '15 Abr 2026',
    day: '15',
    month: 'ABR',
    title: 'Certificación Going Conductor Pro',
    location: 'Online — Plataforma Going Academy',
    type: 'Online',
    typeColor: '#6366f1',
    spots: 'Cupos ilimitados',
    desc: 'Obtén la certificación oficial Going Conductor Pro. Acceso a viajes premium, tarifa preferencial y distintivo verificado en tu perfil.',
  },
];

const eventTypes = [
  { emoji: '🎓', title: 'Academia Going', desc: 'Formación práctica para conductores, anfitriones y guías. Certificaciones reconocidas dentro de la plataforma que desbloquean mejores oportunidades.', color: '#6366f1' },
  { emoji: '🤝', title: 'Networking', desc: 'Conecta con otros proveedores Going de tu ciudad y región. Comparte experiencias, estrategias y construye una red de apoyo real.', color: '#059669' },
  { emoji: '🗣️', title: 'Feedback Going', desc: 'Da forma al futuro de la plataforma. Going organiza sesiones de escucha activa donde las decisiones de producto se construyen con la comunidad.', color: '#f59e0b' },
  { emoji: '🏆', title: 'Premios Going', desc: 'Reconocimiento trimestral a los mejores conductores, anfitriones y guías de cada ciudad. Premios en efectivo, visibilidad y beneficios exclusivos.', color: '#ff4c41' },
];

const howToSteps = [
  { number: '1', title: 'Revisa el calendario', desc: 'Encuentra el evento que más te interesa según tu rol (conductor, anfitrión, guía) y tu ciudad.' },
  { number: '2', title: 'Regístrate gratis', desc: 'Los eventos Going son gratuitos para todos los proveedores activos de la plataforma. Reserva tu cupo con anticipación.' },
  { number: '3', title: 'Participa y conecta', desc: 'Asiste, aprende, comparte. Los eventos Going son espacios de crecimiento real, no conferencias corporativas.' },
];

export default function EventosPage() {
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
      <section className="pt-16 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-10 w-96 h-96 rounded-full bg-amber-200 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-24 text-center relative z-10">
          <FadeIn>
            <span className="inline-block text-amber-100 text-sm font-semibold tracking-widest uppercase mb-4">Comunidad Going</span>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              La comunidad Going<br />se reúne
            </h1>
            <p className="text-xl text-amber-100 max-w-2xl mx-auto mb-10">
              Talleres, encuentros y eventos que fortalecen nuestra red
            </p>
            <Link href="/auth/register" className="inline-block text-white font-bold px-8 py-4 rounded-2xl text-lg shadow-lg hover:scale-105 transition-transform" style={{ backgroundColor: '#ff4c41' }}>
              Registrarme para próximo evento
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Próximos eventos</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">Calendario de eventos de la comunidad Going para el primer semestre 2026</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-6">
            {upcomingEvents.map((evt, i) => (
              <FadeIn key={evt.title} delay={i * 80} direction={i % 2 === 0 ? 'left' : 'right'}>
                <div className="rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow flex gap-5">
                  {/* Date block */}
                  <div className="flex-shrink-0 w-16 text-center">
                    <div className="rounded-2xl overflow-hidden border border-gray-100">
                      <div className="text-xs font-bold text-white py-1" style={{ backgroundColor: '#f59e0b' }}>{evt.month}</div>
                      <div className="text-3xl font-black text-gray-900 py-2">{evt.day}</div>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: evt.typeColor }}>{evt.type}</span>
                      <span className="text-xs text-gray-400">{evt.spots}</span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{evt.title}</h3>
                    <p className="text-xs text-gray-400 mb-2">📍 {evt.location}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{evt.desc}</p>
                    <Link href="/auth/register" className="inline-block mt-3 text-xs font-bold px-4 py-2 rounded-xl text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: '#ff4c41' }}>
                      Reservar cupo →
                    </Link>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Event types */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Tipos de eventos Going</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">Diferentes formatos pensados para distintas necesidades de la comunidad</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {eventTypes.map((et, i) => (
              <FadeIn key={et.title} delay={i * 80}>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-4">{et.emoji}</div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{et.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{et.desc}</p>
                  <div className="mt-4 h-1 rounded-full mx-auto w-12" style={{ backgroundColor: et.color }} />
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How to participate */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">¿Cómo participar?</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">Tres pasos para ser parte de la comunidad Going más activa del país</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8">
            {howToSteps.map((step, i) => (
              <FadeIn key={step.number} delay={i * 120}>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center font-black text-2xl text-white" style={{ backgroundColor: '#f59e0b' }}>
                    {step.number}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn>
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5">Registrarme para el próximo evento</h2>
            <p className="text-amber-100 text-lg mb-10">Los eventos son gratuitos para todos los proveedores activos. Crea tu cuenta y reserva tu cupo.</p>
            <Link href="/auth/register" className="inline-block bg-white font-bold px-10 py-4 rounded-2xl text-lg shadow-xl hover:scale-105 transition-transform" style={{ color: '#b45309' }}>
              Crear mi cuenta gratis
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
