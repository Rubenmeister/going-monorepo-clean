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

const COMMUNITY_PILLARS = [
  {
    icon: '🤝',
    title: 'Red de confianza',
    desc: 'Cada perfil es verificado. Cada calificación es real. La comunidad Going App se construye sobre la transparencia y el respeto mutuo.',
    color: '#ff4c41',
  },
  {
    icon: '📍',
    title: 'Cobertura nacional',
    desc: 'Desde Ibarra hasta Loja, desde Manta hasta Lago Agrio. La comunidad Going App está presente en todas las provincias de Ecuador.',
    color: '#1a1a1a',
  },
  {
    icon: '💡',
    title: 'Conocimiento compartido',
    desc: 'Conductoras y conductores que conocen cada ruta. Anfitrionas y anfitriones que saben qué hacer en cada ciudad. Guías que aman lo que muestran.',
    color: '#16a34a',
  },
  {
    icon: '📱',
    title: 'Siempre conectados',
    desc: 'Chat integrado, notificaciones en tiempo real y soporte 24/7. Nunca estás solo en un viaje Going App.',
    color: '#f59e0b',
  },
];

const COMMUNITY_ROLES = [
  {
    role: 'Pasajeras y pasajeros',
    emoji: '🧳',
    desc: 'Personas que descubren que moverse por Ecuador puede ser seguro, cómodo y asequible. Sin llamadas, sin esperar, sin incertidumbre.',
    highlights: ['Viajes compartidos seguros', 'Califica tu experiencia', 'Puntos Going App por cada viaje', 'Referidos con beneficios'],
    cta: 'Unirme como pasajero',
    href: '/auth/register',
    color: '#ff4c41',
  },
  {
    role: 'Conductoras y conductores',
    emoji: '🚗',
    desc: 'Profesionales del volante que eligen trabajar con tecnología. Horario flexible, pagos claros y una red de apoyo real.',
    highlights: ['80% de cada viaje es tuyo', 'Flexibilidad total de horario', 'Capacitación y certificación', 'Comunidad que arranca con vos'],
    cta: 'Unirme como conductora/conductor',
    href: '/conductores',
    color: '#16a34a',
  },
  {
    role: 'Proveedores',
    emoji: '🏨',
    desc: 'Hoteles, hostales, operadoras de tours, agencias de envíos. Aliados que expanden su negocio con la red Going App.',
    highlights: ['Visibilidad nacional instantánea', 'Panel de gestión profesional', 'Pagos automáticos y seguros', 'Soporte dedicado B2B'],
    cta: 'Ser aliado Going App',
    href: '/empresas',
    color: '#6366f1',
  },
];

const COMMUNITY_EVENTS = [
  { icon: '🎓', title: 'Going App Academy', desc: 'Formación gratuita para conductores: atención al cliente, manejo defensivo, gestión financiera personal.' },
  { icon: '🏅', title: 'Conductor del mes', desc: 'Reconocemos a los mejores conductores con bonos, visibilidad y premios especiales cada mes.' },
  { icon: '🤜', title: 'Going App Embajadores', desc: 'Usuarios que aman Going App y lo recomiendan. Ganan comisiones, acceso anticipado y beneficios exclusivos.' },
  { icon: '📊', title: 'Foros de feedback', desc: 'Reuniones mensuales donde conductores y pasajeros dan forma al futuro de Going App. Tu voz importa.' },
];

export default function ComunidadPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          {[
            { w:3,h:4,t:8,l:10 },{ w:6,h:3,t:22,l:35 },{ w:2,h:5,t:45,l:60 },{ w:5,h:2,t:70,l:20 },
            { w:4,h:6,t:15,l:80 },{ w:3,h:3,t:55,l:50 },{ w:7,h:4,t:80,l:90 },{ w:2,h:2,t:30,l:5 },
            { w:5,h:5,t:90,l:40 },{ w:4,h:3,t:10,l:55 },{ w:3,h:6,t:65,l:75 },{ w:6,h:2,t:35,l:15 },
            { w:2,h:4,t:50,l:85 },{ w:5,h:3,t:75,l:30 },{ w:3,h:5,t:20,l:70 },{ w:4,h:4,t:40,l:45 },
            { w:6,h:3,t:85,l:65 },{ w:2,h:6,t:60,l:95 },{ w:5,h:2,t:5,l:25 },{ w:3,h:4,t:95,l:55 },
          ].map((p, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{ width: p.w + 'px', height: p.h + 'px', top: p.t + '%', left: p.l + '%' }}
            />
          ))}
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            La Comunidad<br />
            <span style={{ color: '#ff4c41' }}>Going App</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10">
            No somos solo una aplicación. Somos una red de ecuatorianos que se mueven, trabajan y crecen juntos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 text-gray-900 font-bold px-8 py-4 rounded-2xl text-lg bg-white hover:opacity-90 transition-all">
              Unirme a la comunidad
            </Link>
            <a href="#roles" className="inline-flex items-center justify-center gap-2 text-white font-bold px-8 py-4 rounded-2xl text-lg bg-white/10 border border-white/20 hover:bg-white/20 transition-all">
              ¿Cómo participar?
            </a>
          </div>
        </div>
      </section>

      {/* Foto grupo senderismo Alpes Suizos */}
      <section className="py-0 px-6">
        <div className="max-w-6xl mx-auto -mt-10 relative z-10">
          <img
            src="/images/senderismo quilotoa.png"
            alt="Going App - Senderismo Quilotoa Ecuador"
            className="w-full rounded-3xl shadow-2xl object-cover"
            style={{ maxHeight: '460px' }}
          />
          <div className="mt-4 text-center text-sm text-gray-400 italic">Going App – Comunidad Ecuador</div>
        </div>
      </section>

      {/* What is community */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#ff4c41] mb-4">Lo que nos une</span>
              <h2 className="text-4xl font-black text-gray-900 mb-4">Una comunidad construida sobre confianza</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">Going App no es transaccional. Es relacional. Cada interacción fortalece una red que beneficia a todos.</p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {COMMUNITY_PILLARS.map((p, i) => (
              <FadeIn key={p.title} delay={i * 80}>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-all">
                  <div className="text-3xl mb-4">{p.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{p.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#ff4c41] mb-4">Tu lugar en Going App</span>
              <h2 className="text-4xl font-black text-gray-900">¿Quién eres en la comunidad?</h2>
            </div>
          </FadeIn>

          <div className="grid lg:grid-cols-3 gap-8">
            {COMMUNITY_ROLES.map((role, i) => (
              <FadeIn key={role.role} delay={i * 120}>
                <div className="bg-white rounded-3xl p-8 border border-gray-100 hover:shadow-xl transition-all flex flex-col">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="text-4xl mb-2">{role.emoji}</div>
                      <h3 className="text-2xl font-black text-gray-900">{role.role}</h3>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm leading-relaxed mb-6">{role.desc}</p>

                  <ul className="space-y-2 mb-8 flex-1">
                    {role.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0" style={{ backgroundColor: role.color }}>✓</div>
                        {h}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={role.href}
                    className="w-full flex items-center justify-center gap-2 font-bold text-white py-3.5 rounded-xl text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ backgroundColor: role.color }}
                  >
                    {role.cta} →
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Community programs */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#ff4c41] mb-4">Programas</span>
              <h2 className="text-4xl font-black text-gray-900">Más que una app, un ecosistema</h2>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-6">
            {COMMUNITY_EVENTS.map((ev, i) => (
              <FadeIn key={ev.title} delay={i * 80} direction={i % 2 === 0 ? 'left' : 'right'}>
                <div className="flex gap-5 p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
                    {ev.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{ev.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{ev.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Pre-lanzamiento */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#ff4c41] mb-4">Estamos por arrancar</span>
            <h2 className="text-4xl font-black text-gray-900 mb-4">Sé parte de la comunidad desde el día uno</h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              Going App está por salir al aire en Ecuador. Empezamos con 3 rutas — Riobamba, Santo Domingo e Ibarra,
              desde Quito y el aeropuerto — y vamos llegando a todo el país. Sumate y crezcamos juntos.
            </p>
            <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 text-gray-900 font-bold px-8 py-4 rounded-2xl text-lg bg-white border border-gray-200 hover:shadow-md transition-all">
              Unirme a la comunidad →
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Referrals / Points */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div
              className="rounded-3xl p-10 md:p-14 text-white text-center relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #ff4c41, #c0392b)' }}
            >
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10">
                <div className="text-5xl mb-4">🎁</div>
                <h2 className="text-3xl font-black mb-4">Gana por traer amigos</h2>
                <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
                  Por cada amigo que se registre con tu código, ambos reciben un viaje gratis. La comunidad Going App crece cuando tú creces.
                </p>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-8 py-4 rounded-2xl text-lg hover:opacity-90 transition-all"
                >
                  Obtener mi código de referido →
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-4xl font-black text-white mb-4">
              Ecuador se mueve con Going App.<br />
              <span style={{ color: '#ff4c41' }}>¿Y tú?</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Únete hoy. Es gratis. Sin compromisos. Solo movilidad inteligente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 text-gray-900 font-bold px-8 py-4 rounded-2xl text-lg bg-white hover:opacity-90 transition-all">
                Crear cuenta gratis
              </Link>
              <Link href="/quienes-somos" className="inline-flex items-center justify-center gap-2 text-white font-bold px-8 py-4 rounded-2xl text-lg border border-white/20 hover:bg-white/10 transition-all">
                Conocer más sobre Going App
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
