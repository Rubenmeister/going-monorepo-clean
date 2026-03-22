'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
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

/* ── Stat card ─────────────────────────────────────────────── */
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center px-6 py-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}>
      <div className="text-3xl font-extrabold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-300">{label}</div>
    </div>
  );
}

/* ── Earnings card ─────────────────────────────────────────── */
function EarningsCard({ plan, hours, range, highlight }: { plan: string; hours: string; range: string; highlight?: boolean }) {
  return (
    <div
      className="rounded-3xl p-8 flex flex-col items-center text-center transition-transform duration-300 hover:-translate-y-1"
      style={{
        background: highlight ? '#ff4c41' : '#fff',
        color: highlight ? '#fff' : '#1a1a1a',
        boxShadow: highlight ? '0 8px 40px rgba(255,76,65,0.35)' : '0 2px 20px rgba(0,0,0,0.08)',
        border: highlight ? 'none' : '1px solid #f0f0f0',
      }}
    >
      <div className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: highlight ? 'rgba(255,255,255,0.8)' : '#ff4c41' }}>{plan}</div>
      <div className="text-lg font-semibold mb-4" style={{ color: highlight ? 'rgba(255,255,255,0.85)' : '#666' }}>{hours}</div>
      <div className="text-4xl font-extrabold mb-1">{range}</div>
      <div className="text-sm mt-2" style={{ color: highlight ? 'rgba(255,255,255,0.75)' : '#888' }}>por mes estimado</div>
    </div>
  );
}

/* ── Requirement card ──────────────────────────────────────── */
function ReqCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 flex gap-4 items-start shadow-sm border border-gray-100 transition-shadow duration-300 hover:shadow-md">
      <div className="text-3xl flex-shrink-0">{icon}</div>
      <div>
        <div className="font-bold text-gray-900 mb-1">{title}</div>
        <div className="text-sm text-gray-500 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}

/* ── Step ──────────────────────────────────────────────────── */
function Step({ num, title, desc, last }: { num: number; title: string; desc: string; last?: boolean }) {
  return (
    <div className="flex gap-5 items-start">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-white text-sm flex-shrink-0" style={{ background: '#ff4c41' }}>
          {num}
        </div>
        {!last && <div className="w-px flex-1 mt-2" style={{ background: '#f0d0cf', minHeight: 40 }} />}
      </div>
      <div className="pb-8">
        <div className="font-bold text-gray-900 mb-1">{title}</div>
        <div className="text-sm text-gray-500 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}

/* ── Benefit card ──────────────────────────────────────────── */
function BenefitCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div
      className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <div className="font-bold text-white mb-2">{title}</div>
      <div className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{desc}</div>
    </div>
  );
}

/* ── Testimonial ───────────────────────────────────────────── */
function Testimonial({ quote, name, city }: { quote: string; name: string; city: string }) {
  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col gap-4">
      <div className="text-4xl" style={{ color: '#ff4c41' }}>"</div>
      <p className="text-gray-700 leading-relaxed text-sm flex-1">{quote}</p>
      <div>
        <div className="font-bold text-gray-900">{name}</div>
        <div className="text-xs text-gray-400">{city}</div>
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────── */
export default function ConductoresPage() {

  return (
    <div className="min-h-screen font-sans antialiased" style={{ color: '#1a1a1a' }}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="pt-12 pb-20 px-6" style={{ background: '#1a1a1a' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10">
          {/* Texto */}
          <div className="flex-1 text-center md:text-left">
            <FadeIn delay={0}>
              <span className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-6" style={{ background: 'rgba(255,76,65,0.18)', color: '#ff4c41', border: '1px solid rgba(255,76,65,0.3)' }}>
                🚗 Para Conductoras y Conductores
              </span>
            </FadeIn>
            <FadeIn delay={100}>
              <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6">
                Maneja tus tiempos,<br />
                <span style={{ color: '#ff4c41' }}>multiplica tus ingresos</span>
              </h1>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="text-lg md:text-xl text-gray-300 max-w-xl mb-10 leading-relaxed">
                Únete a más de 12,000 conductoras y conductores Going en Ecuador. Sin jefes, sin horarios fijos. Tú decides cuándo y cuánto trabajar.
              </p>
            </FadeIn>
            <FadeIn delay={300}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-10">
                <Link href="/register?rol=driver" className="px-8 py-4 rounded-2xl font-bold text-white text-base transition-all duration-200 hover:opacity-90 active:scale-95" style={{ background: '#ff4c41', boxShadow: '0 4px 24px rgba(255,76,65,0.4)' }}>
                  Registrarme como conductora/conductor
                </Link>
                <a href="#requisitos" className="px-8 py-4 rounded-2xl font-bold text-white text-base transition-all duration-200 hover:bg-white hover:text-gray-900" style={{ border: '2px solid rgba(255,255,255,0.3)' }}>
                  Ver requisitos
                </a>
              </div>
            </FadeIn>
            <FadeIn delay={400}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard value="+40%" label="ingresos promedio" />
                <StatCard value="12,000+" label="conductoras/conductores activos" />
                <StatCard value="24h" label="pago garantizado" />
              </div>
            </FadeIn>
          </div>
          {/* Imagen */}
          <div className="flex-1 w-full md:max-w-md">
            <FadeIn delay={200} direction="right">
              <img
                src="/images/SUV de lujo.png"
                alt="SUV de lujo Going"
                className="w-full rounded-3xl shadow-2xl object-cover"
                style={{ maxHeight: '440px' }}
              />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── POR QUÉ UNIRTE ───────────────────────────────────── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row" style={{ border: '1px solid #f0f0f0' }}>
              {/* Foto aeropuerto */}
              <div className="md:w-2/5 flex-shrink-0">
                <img
                  src="/images/SUV de lujo.png"
                  alt="Conductor Going en el Aeropuerto Internacional Mariscal Sucre"
                  className="w-full h-full object-cover"
                  style={{ minHeight: '320px' }}
                />
              </div>
              {/* Contenido */}
              <div className="flex-1 p-8 md:p-10" style={{ background: '#1a1a1a' }}>
                <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#ff4c41' }}>
                  Comunidad Going
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-6 leading-snug">
                  ¿Por qué te conviene unirte a la comunidad Going?
                </h2>
                <ul className="space-y-3">
                  {[
                    { icon: '💰', text: 'Ganas el 80% de cada viaje, sin descuentos sorpresa.' },
                    { icon: '🕐', text: 'Horarios 100% flexibles — tú decides cuándo trabajar.' },
                    { icon: '⚡', text: 'Pagos garantizados en menos de 24 horas.' },
                    { icon: '📍', text: 'Rutas inteligentes que optimizan tu tiempo y ganancias.' },
                    { icon: '🛡️', text: 'Seguro incluido en cada viaje sin costo adicional.' },
                    { icon: '🏆', text: 'Programa Diamond: acceso a clientes premium con tarifas más altas.' },
                    { icon: '🎓', text: 'Academia Going gratuita para mejorar tu servicio.' },
                    { icon: '🤝', text: 'Red de apoyo activa con más de 12,000 conductoras y conductores.' },
                  ].map((item) => (
                    <li key={item.text} className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">{item.icon}</span>
                      <span className="text-gray-300 text-sm leading-relaxed">{item.text}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link
                    href="/register?rol=driver"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white text-sm hover:opacity-90 transition-all"
                    style={{ background: '#ff4c41' }}
                  >
                    Quiero ser conductor Going →
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── PHOTO STRIP ──────────────────────────────────────── */}
      <section className="py-10 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FadeIn delay={0} direction="up">
              <img src="/images/43.png" alt="Trabaja cuando quieres, el tiempo que quieres"
                className="w-full rounded-2xl shadow-md object-cover aspect-square" />
            </FadeIn>
            <FadeIn delay={100} direction="up">
              <img src="/images/41.png" alt="Sé parte de nuestro equipo"
                className="w-full rounded-2xl shadow-md object-cover aspect-square" />
            </FadeIn>
            <FadeIn delay={200} direction="up">
              <img src="/images/42.png" alt="Sé tu propio jefe"
                className="w-full rounded-2xl shadow-md object-cover aspect-square" />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── EARNINGS CALCULATOR ──────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: '#1a1a1a' }}>¿Cuánto puedes ganar?</h2>
              <p className="text-gray-500">Estimaciones basadas en conductoras y conductores activos en Ecuador</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <FadeIn delay={0} direction="up"><EarningsCard plan="Part-time" hours="20 h / semana" range="$480–$650" /></FadeIn>
            <FadeIn delay={100} direction="up"><EarningsCard plan="Full-time" hours="40 h / semana" range="$900–$1,200" highlight /></FadeIn>
            <FadeIn delay={200} direction="up"><EarningsCard plan="Full-time + Empresa" hours="40 h / semana" range="$1,400–$1,800" /></FadeIn>
          </div>
          <FadeIn delay={300}>
            <div className="text-center rounded-2xl py-4 px-6" style={{ background: '#fff7f7', border: '1px solid #ffd6d4' }}>
              <p className="text-sm font-semibold" style={{ color: '#c73b31' }}>
                ✓ Tú recibes el 80% de cada viaje. Sin descuentos sorpresa.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── RUTAS DISPONIBLES ────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: '#f9fafb' }}>
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-10">
              <span className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,76,65,0.1)', color: '#ff4c41' }}>
                🗺️ Cobertura Going
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: '#1a1a1a' }}>Nuevas rutas disponibles</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Más zonas, más viajes, más ingresos. Going expande su red de rutas para que siempre tengas demanda cerca.</p>
            </div>
          </FadeIn>
          <FadeIn delay={100} direction="up">
            <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-100">
              <img
                src="/images/nuevas%20rutas.png"
                alt="Nuevas rutas Going — cobertura y expansión de zonas"
                className="w-full object-contain"
                style={{ maxHeight: '520px', background: '#fff' }}
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── REQUIREMENTS ─────────────────────────────────────── */}
      <section id="requisitos" className="py-20 px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">¿Qué necesitas para empezar?</h2>
              <p className="text-gray-500">Documentos básicos. Todo se sube desde la app.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <FadeIn delay={0}><ReqCard icon="📄" title="Cédula de Identidad" desc="Copia a color vigente" /></FadeIn>
            <FadeIn delay={80}><ReqCard icon="🚗" title="Licencia de Conducir" desc="Tipo B o profesional. Mínimo 2 años de experiencia." /></FadeIn>
            <FadeIn delay={160}><ReqCard icon="📋" title="Matrícula del Vehículo" desc="Modelo 2015 o posterior. SUV tiene prioridad." /></FadeIn>
            <FadeIn delay={240}><ReqCard icon="🛡️" title="SOAT vigente" desc="Seguro obligatorio al día." /></FadeIn>
          </div>
          <FadeIn delay={320}>
            <div className="rounded-2xl p-6 flex items-start gap-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <span className="text-2xl">✓</span>
              <p className="text-sm leading-relaxed" style={{ color: '#166534' }}>
                <strong>Todo el proceso es 100% digital.</strong> Subes tus documentos desde la app. Sin filas, sin oficinas, sin complicaciones.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── REGISTRATION STEPS ──────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Regístrate en 4 pasos simples</h2>
              <p className="text-gray-500">En menos de 10 minutos dejas tu solicitud lista.</p>
            </div>
          </FadeIn>
          <FadeIn delay={80}>
            <Step num={1} title="Descarga la app Going" desc="Disponible en Android. iOS próximamente." />
          </FadeIn>
          <FadeIn delay={160}>
            <Step num={2} title="Completa tus datos" desc="Nombre, email, teléfono y contraseña. Rápido y seguro." />
          </FadeIn>
          <FadeIn delay={240}>
            <Step num={3} title="Sube tus documentos" desc="Cédula, licencia, matrícula y SOAT. Foto desde la app, en segundos." />
          </FadeIn>
          <FadeIn delay={320}>
            <Step num={4} title="Espera la verificación" desc="24–48 horas. Te notificamos por email y SMS en cuanto estés aprobado." last />
          </FadeIn>
          <FadeIn delay={400}>
            <div className="text-center mt-4">
              <Link href="/register?rol=driver" className="inline-block px-10 py-4 rounded-2xl font-bold text-white text-base transition-all duration-200 hover:opacity-90 active:scale-95" style={{ background: '#ff4c41', boxShadow: '0 4px 24px rgba(255,76,65,0.35)' }}>
                Registrarme ahora →
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: '#0f172a' }}>
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Por qué conductoras y conductores eligen Going</h2>
              <p style={{ color: '#94a3b8' }}>Más que una plataforma. Una comunidad.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FadeIn delay={0}><BenefitCard icon="⚡" title="Pagos rápidos" desc="Cobra en 24 horas directamente a tu cuenta. Sin esperas ni trámites." /></FadeIn>
            <FadeIn delay={60}><BenefitCard icon="📍" title="Rutas inteligentes" desc="El sistema optimiza tus viajes para maximizar ganancias sin perder tiempo." /></FadeIn>
            <FadeIn delay={120}><BenefitCard icon="🛡️" title="Seguro incluido" desc="Cobertura en cada viaje sin costo adicional. Maneja con tranquilidad." /></FadeIn>
            <FadeIn delay={180}><BenefitCard icon="📱" title="App intuitiva" desc="Acepta viajes, navega y cobra desde una sola pantalla. Sin complicaciones." /></FadeIn>
            <FadeIn delay={240}><BenefitCard icon="🏆" title="Programa Diamond" desc="Llega a Diamond y accede a clientes empresariales premium con tarifas más altas." /></FadeIn>
            <FadeIn delay={300}><BenefitCard icon="🎓" title="Academia gratuita" desc="Capacitación online para conductoras y conductores en la Academia Going. Mejora tu servicio." /></FadeIn>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Lo que dicen en la comunidad Going</h2>
              <p className="text-gray-500">Historias reales de personas reales.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FadeIn delay={0}><Testimonial quote="En 6 meses con Going, pagué mis deudas y hasta ahorré para la educación de mis hijos." name="Carlos V." city="Quito" /></FadeIn>
            <FadeIn delay={100}><Testimonial quote="Antes trabajaba 12 horas en una empresa. Ahora trabajo 8 horas para mí y gano lo mismo." name="Roberto M." city="Guayaquil" /></FadeIn>
            <FadeIn delay={200}><Testimonial quote="Soy conductora y madre. Going me permite organizarme sin depender de nadie." name="Ana P." city="Cuenca" /></FadeIn>
          </div>
        </div>
      </section>

      {/* ── ACADEMIA GOING ───────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
              <div className="flex flex-col md:flex-row items-center gap-8 p-10">
                <div className="flex-1 text-white">
                  <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4"
                    style={{ backgroundColor: '#ff4c4122', color: '#ff6b60' }}>
                    📚 Academia Going — 100% Gratuita
                  </span>
                  <h2 className="text-2xl md:text-3xl font-extrabold mb-3">
                    Capacítate. Gana insignias.<br />Gana más dinero.
                  </h2>
                  <p className="text-gray-300 text-sm leading-relaxed mb-6">
                    La Academia Going tiene cursos especiales para conductores: seguridad vial en Ecuador,
                    inglés turístico básico (en formato podcast para escuchar mientras manejas), mecánica
                    preventiva y el arte de recibir pasajeros. Completa la Ruta del Volante y consigue
                    el badge <strong style={{ color: '#ff6b60' }}>Aliado Oro</strong> para aparecer primero en los resultados.
                  </p>
                  <div className="flex flex-wrap gap-3 mb-6">
                    {['👋 Primera Impresión', '🛡️ Seguridad Vial', '🔧 Mecánica', '🗣️ Inglés (Podcast)', '🚑 Primeros Auxilios'].map(c => (
                      <span key={c} className="text-xs px-3 py-1.5 rounded-full border border-gray-600 text-gray-300">{c}</span>
                    ))}
                  </div>
                  <Link href="/academy"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#ff4c41', color: '#fff' }}>
                    Ir a la Academia Going →
                  </Link>
                </div>
                <div className="flex-shrink-0 grid grid-cols-3 gap-3">
                  {[
                    { icon: '🥉', label: 'Aliado Bronce', desc: 'Tronco Común' },
                    { icon: '🥈', label: 'Aliado Plata', desc: '+3 cursos' },
                    { icon: '🥇', label: 'Aliado Oro', desc: 'Ruta completa' },
                  ].map(lvl => (
                    <div key={lvl.label} className="rounded-2xl p-4 text-center text-white"
                      style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                      <div className="text-3xl mb-1">{lvl.icon}</div>
                      <div className="text-xs font-bold">{lvl.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{lvl.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: '#ff4c41' }}>
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">¿Listo para empezar a ganar más?</h2>
            <p className="text-white mb-10 text-lg" style={{ opacity: 0.88 }}>
              Regístrate gratis. La app es gratuita. Sin comisiones de suscripción.
            </p>
            <Link href="/register?rol=driver" className="inline-block px-10 py-4 rounded-2xl font-extrabold text-base transition-all duration-200 hover:opacity-90 active:scale-95 mb-6" style={{ background: '#fff', color: '#ff4c41' }}>
              Comenzar ahora →
            </Link>
            <div>
              <Link href="/contact" className="text-sm font-semibold underline text-white" style={{ opacity: 0.82 }}>
                ¿Tienes preguntas? Chatea con nosotros →
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="py-10 px-6 text-center" style={{ background: '#1a1a1a', color: '#666' }}>
        <Link href="/" className="font-extrabold text-lg mb-2 block" style={{ color: '#ff4c41' }}>Going</Link>
        <p className="text-xs mb-4">Movilidad inteligente en Ecuador</p>
        <div className="flex justify-center gap-6 text-xs">
          <Link href="/legal/terms" className="hover:text-white transition-colors">Términos</Link>
          <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacidad</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contacto</Link>
          <Link href="/pasajeros" className="hover:text-white transition-colors">Para Pasajeros</Link>
          <Link href="/academy" className="hover:text-white transition-colors" style={{ color: '#ff6b60' }}>📚 Academia</Link>
        </div>
      </footer>
    </div>
  );
}
