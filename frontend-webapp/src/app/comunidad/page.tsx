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
    desc: 'Cada perfil es verificado. Cada calificación es real. La comunidad Going se construye sobre la transparencia y el respeto mutuo.',
    color: '#ff4c41',
  },
  {
    icon: '📍',
    title: 'Cobertura nacional',
    desc: 'Desde Ibarra hasta Loja, desde Manta hasta Lago Agrio. La comunidad Going está presente en todas las provincias de Ecuador.',
    color: '#1a1a1a',
  },
  {
    icon: '💡',
    title: 'Conocimiento compartido',
    desc: 'Conductores que conocen cada ruta. Anfitriones que saben qué hacer en cada ciudad. Guías que aman lo que muestran.',
    color: '#16a34a',
  },
  {
    icon: '📱',
    title: 'Siempre conectados',
    desc: 'Chat integrado, notificaciones en tiempo real y soporte 24/7. Nunca estás solo en un viaje Going.',
    color: '#f59e0b',
  },
];

const COMMUNITY_ROLES = [
  {
    role: 'Pasajeros',
    emoji: '🧳',
    count: '900,000+',
    desc: 'Personas que descubrieron que moverse por Ecuador puede ser seguro, cómodo y asequible. Sin llamadas, sin esperar, sin incertidumbre.',
    highlights: ['Viajes compartidos seguros', 'Califica tu experiencia', 'Puntos Going por cada viaje', 'Referidos con beneficios'],
    cta: 'Unirme como pasajero',
    href: '/auth/register',
    color: '#ff4c41',
  },
  {
    role: 'Conductores',
    emoji: '🚗',
    count: '5,000+',
    desc: 'Profesionales del volante que decidieron trabajar con tecnología. Ganan más, trabajan mejor y pertenecen a una red de apoyo real.',
    highlights: ['Ganancias superiores al mercado', 'Flexibilidad total de horario', 'Capacitación y certificación', 'Comunidad de conductores activa'],
    cta: 'Unirme como conductor',
    href: '/conductores',
    color: '#16a34a',
  },
  {
    role: 'Proveedores',
    emoji: '🏨',
    count: '1,200+',
    desc: 'Hoteles, hostales, operadoras de tours, agencias de envíos. Aliados que expanden su negocio con la red Going.',
    highlights: ['Visibilidad nacional instantánea', 'Panel de gestión profesional', 'Pagos automáticos y seguros', 'Soporte dedicado B2B'],
    cta: 'Ser aliado Going',
    href: '/empresas',
    color: '#6366f1',
  },
];

const TESTIMONIALS = [
  {
    name: 'Patricia L.',
    city: 'Cuenca',
    role: 'Pasajera frecuente',
    emoji: '👩',
    text: 'Antes pasaba horas coordinando por WhatsApp para ir a Guayaquil. Con Going reservo en 2 minutos y sé exactamente cuándo llega el conductor.',
    stars: 5,
  },
  {
    name: 'Rodrigo M.',
    city: 'Quito',
    role: 'Conductor verificado',
    emoji: '👨',
    text: 'La comunidad de conductores me ayudó a conocer las mejores rutas y a maximizar mis ingresos. No es solo una app, es una red.',
    stars: 5,
  },
  {
    name: 'Hostería El Lago',
    city: 'Baños',
    role: 'Aliado Going',
    emoji: '🏨',
    text: 'Desde que nos unimos a Going, nuestra ocupación subió un 40%. Los huéspedes llegan verificados y el proceso de reserva es impecable.',
    stars: 5,
  },
];

const COMMUNITY_EVENTS = [
  { icon: '🎓', title: 'Going Academy', desc: 'Formación gratuita para conductores: atención al cliente, manejo defensivo, gestión financiera personal.' },
  { icon: '🏅', title: 'Conductor del mes', desc: 'Reconocemos a los mejores conductores con bonos, visibilidad y premios especiales cada mes.' },
  { icon: '🤜', title: 'Going Embajadores', desc: 'Usuarios que aman Going y lo recomiendan. Ganan comisiones, acceso anticipado y beneficios exclusivos.' },
  { icon: '📊', title: 'Foros de feedback', desc: 'Reuniones mensuales donde conductores y pasajeros dan forma al futuro de Going. Tu voz importa.' },
];

export default function ComunidadPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/going-logo-h.png" alt="Going" width={120} height={40} className="h-9 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Iniciar sesión</Link>
            <Link href="/auth/register" className="text-sm text-white font-bold px-4 py-2 rounded-xl" style={{ backgroundColor: '#ff4c41' }}>Unirse gratis</Link>
          </div>
        </div>
      </nav>

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
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-white/80 text-sm mb-8">
            🌟 +1,000,000 personas conectadas
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            La Comunidad<br />
            <span style={{ color: '#ff4c41' }}>Going</span>
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
            src="/images/Gemini_Generated_Image_4n0nss4n0nss4n0n.png"
            alt="Going - Grupo de Senderismo Alpes Suizos 2024"
            className="w-full rounded-3xl shadow-2xl object-cover"
            style={{ maxHeight: '460px' }}
          />
          <div className="mt-4 text-center text-sm text-gray-400 italic">Going – Grupo de Senderismo · Alpes Suizos 2024</div>
        </div>
      </section>

      {/* What is community */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#ff4c41] mb-4">Lo que nos une</span>
              <h2 className="text-4xl font-black text-gray-900 mb-4">Una comunidad construida sobre confianza</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">Going no es transaccional. Es relacional. Cada interacción fortalece una red que beneficia a todos.</p>
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
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#ff4c41] mb-4">Tu lugar en Going</span>
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
                      <div className="text-sm font-bold mt-1" style={{ color: role.color }}>{role.count} en la red</div>
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

      {/* Testimonials */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#ff4c41] mb-4">Lo que dicen</span>
              <h2 className="text-4xl font-black text-gray-900">Voces de la comunidad</h2>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={t.name} delay={i * 100}>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-all">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(t.stars)].map((_, si) => (
                      <span key={si} style={{ color: '#f59e0b' }}>★</span>
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">{t.emoji}</div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                      <div className="text-xs text-gray-400">{t.role} · {t.city}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
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
                  Por cada amigo que se registre con tu código, ambos reciben un viaje gratis. La comunidad Going crece cuando tú creces.
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
              Ecuador se mueve con Going.<br />
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
                Conocer más sobre Going
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
