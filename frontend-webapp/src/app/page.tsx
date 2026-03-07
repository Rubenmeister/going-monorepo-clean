'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';

const SERVICES = [
  {
    id: 'transport',
    icon: '🚗',
    title: 'Transporte',
    description:
      'Privado (Economy, Comfort, Premium) o Compartido para ahorrar hasta 60%. Conductores verificados, seguimiento en tiempo real.',
    photo:
      'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80&auto=format',
    href: '/services/transport',
    color: '#ff4c41',
  },
  {
    id: 'accommodation',
    icon: '🏨',
    title: 'Alojamiento',
    description:
      'Hospedaje verificado en las mejores ubicaciones. Desde hostales hasta hoteles boutique.',
    photo:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80&auto=format',
    href: '/services',
    color: '#10B981',
  },
  {
    id: 'tours',
    icon: '🗺️',
    title: 'Tours',
    description:
      'Descubre Ecuador con guías locales expertos. Aventura, cultura y naturaleza.',
    photo:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80&auto=format',
    href: '/services',
    color: '#3B82F6',
  },
  {
    id: 'experiences',
    icon: '🎭',
    title: 'Experiencias',
    description:
      'Gastronomía, aventura extrema, artesanía local. Crea recuerdos únicos.',
    photo:
      'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=600&q=80&auto=format',
    href: '/services',
    color: '#F59E0B',
  },
  {
    id: 'parcels',
    icon: '📦',
    title: 'Envíos',
    description:
      'Envía tus paquetes de forma rápida y segura a cualquier rincón del país.',
    photo:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80&auto=format',
    href: '/services',
    color: '#8B5CF6',
  },
  {
    id: 'payments',
    icon: '💳',
    title: 'Pagos Seguros',
    description:
      'Múltiples métodos de pago. Transacciones protegidas y facturación electrónica.',
    photo:
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80&auto=format',
    href: '/services',
    color: '#EC4899',
  },
];

const STATS = [
  { number: '1M+', label: 'Usuarios activos' },
  { number: '50+', label: 'Ciudades en Ecuador' },
  { number: '100M+', label: 'Viajes completados' },
  { number: '4.9★', label: 'Calificación promedio' },
];

const HOW_IT_WORKS = [
  {
    num: '01',
    title: 'Regístrate gratis',
    desc: 'Crea tu cuenta en segundos con tu email o número de teléfono.',
  },
  {
    num: '02',
    title: 'Elige tu servicio',
    desc: 'Transporte, alojamiento, tours, experiencias o envíos.',
  },
  {
    num: '03',
    title: 'Reserva al instante',
    desc: 'Confirma en segundos. Sin filas, sin esperas.',
  },
  {
    num: '04',
    title: 'Disfruta y valora',
    desc: 'Vive la experiencia y ayuda a mejorar la comunidad Going.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Carlos M.',
    role: 'Conductor Going',
    text: 'Aumenté mis ingresos en un 40% en solo 3 meses. La plataforma es muy fácil de usar.',
    avatar: 'CM',
  },
  {
    name: 'María L.',
    role: 'Anfitriona',
    text: 'Mis habitaciones tienen 98% de ocupación desde que me uní a Going. Increíble.',
    avatar: 'ML',
  },
  {
    name: 'Pedro R.',
    role: 'Viajero frecuente',
    text: 'El servicio de transporte es puntual y los conductores son muy amables. Lo recomiendo.',
    avatar: 'PR',
  },
];

const PROVIDERS = [
  {
    icon: '🚗',
    title: 'Conductor',
    description:
      'Genera ingresos manejando tu propio vehículo. Tú decides tus horarios y zonas de trabajo.',
    stats: '+40% ingresos promedio',
    href: '/auth/register',
    color: '#ff4c41',
  },
  {
    icon: '🏨',
    title: 'Anfitrión',
    description:
      'Alquila tu propiedad o habitaciones a viajeros verificados. Gestión simple desde la app.',
    stats: '98% tasa de ocupación',
    href: '/auth/register',
    color: '#10B981',
  },
  {
    icon: '🗺️',
    title: 'Guía de Tours',
    description:
      'Comparte tu conocimiento local y lleva a viajeros a descubrir los mejores rincones de Ecuador.',
    stats: 'Agenda siempre llena',
    href: '/auth/register',
    color: '#3B82F6',
  },
  {
    icon: '🎭',
    title: 'Operador de Experiencias',
    description:
      'Ofrece gastronomía, aventura, artesanía y cultura local. Conecta con miles de turistas.',
    stats: '5K+ turistas al mes',
    href: '/auth/register',
    color: '#F59E0B',
  },
];

const ACADEMY_PREVIEW = [
  {
    icon: '🚗',
    category: 'Conductores',
    title: 'Cómo ser conductor Going',
    description:
      'Aprende todo lo que necesitas para empezar a generar ingresos como conductor verificado.',
    lessons: 8,
    duration: '2h 30min',
    level: 'Principiante',
    levelColor: 'text-green-700 bg-green-100',
    students: 5234,
    rating: 4.8,
  },
  {
    icon: '🏨',
    category: 'Anfitriones',
    title: 'Gestiona tu alojamiento',
    description:
      'Maximiza tus ingresos: fotografía profesional, precios dinámicos y atención al huésped.',
    lessons: 12,
    duration: '4h 15min',
    level: 'Intermedio',
    levelColor: 'text-yellow-700 bg-yellow-100',
    students: 3421,
    rating: 4.9,
  },
  {
    icon: '🗺️',
    category: 'Guías y Operadores',
    title: 'Crea experiencias únicas',
    description:
      'Diseña tours y experiencias memorables que atraigan a viajeros nacionales e internacionales.',
    lessons: 10,
    duration: '3h 00min',
    level: 'Avanzado',
    levelColor: 'text-red-700 bg-red-100',
    students: 1823,
    rating: 4.7,
  },
];

export default function Home() {
  const { auth } = useMonorepoApp();
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [searchDate, setSearchDate] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      from: searchFrom,
      to: searchTo,
      date: searchDate,
    });
    window.location.href = `/services?${params.toString()}`;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ─── Hero ──────────────────────────────────────────── */}
      <section className="relative h-[560px] overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80&auto=format')",
          }}
        />
        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,76,65,0.88) 0%, rgba(230,58,47,0.75) 60%, rgba(0,0,0,0.55) 100%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-4">
          <div className="mb-6">
            <Image
              src="/going-logo.png"
              alt="Going"
              width={140}
              height={95}
              className="brightness-0 invert mx-auto"
              priority
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight max-w-3xl">
            Viaja, explora y vive Ecuador
          </h1>
          <p className="text-xl md:text-2xl text-white/85 mb-8 max-w-2xl">
            Transporte, alojamiento, tours, experiencias y envíos en una sola
            plataforma.
          </p>
          {!auth.user && (
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/auth/register"
                className="px-8 py-4 bg-white font-bold rounded-xl transition-all hover:bg-gray-100 hover:shadow-lg"
                style={{ color: '#ff4c41' }}
              >
                Comenzar Gratis
              </a>
              <a
                href="/auth/login"
                className="px-8 py-4 border-2 border-white text-white font-bold rounded-xl transition-all hover:bg-white/10"
              >
                Iniciar Sesión
              </a>
            </div>
          )}
          {auth.user && (
            <div className="px-8 py-4 bg-white/15 border border-white/30 rounded-2xl text-white backdrop-blur-sm">
              Bienvenido, <strong>{auth.user.firstName}</strong> 👋
            </div>
          )}
        </div>
      </section>

      {/* ─── Search Bar ─────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 -mt-10 relative z-20 mb-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            🔍 ¿A dónde quieres ir?
          </h2>
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block uppercase tracking-wide">
                Origen
              </label>
              <input
                type="text"
                placeholder="Ciudad de origen"
                value={searchFrom}
                onChange={(e) => setSearchFrom(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4c41] bg-gray-50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block uppercase tracking-wide">
                Destino
              </label>
              <input
                type="text"
                placeholder="Ciudad destino"
                value={searchTo}
                onChange={(e) => setSearchTo(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4c41] bg-gray-50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block uppercase tracking-wide">
                Fecha
              </label>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4c41] bg-gray-50"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:shadow-md active:scale-[0.98]"
                style={{ backgroundColor: '#ff4c41' }}
              >
                Buscar
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ─── Stats ──────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100"
            >
              <div
                className="text-3xl font-bold mb-1"
                style={{ color: '#ff4c41' }}
              >
                {stat.number}
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Services Grid ──────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Nuestros Servicios
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Todo lo que necesitas para moverte, alojarte y explorar Ecuador en
            un solo lugar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service) => (
            <Link
              key={service.id}
              href={service.href}
              className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
            >
              {/* Photo */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={service.photo}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: `linear-gradient(to top, ${service.color}, transparent)`,
                  }}
                />
                <div className="absolute bottom-3 left-3 text-3xl">
                  {service.icon}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {service.description}
                </p>
                <div
                  className="mt-4 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all"
                  style={{ color: '#ff4c41' }}
                >
                  Explorar {service.title} →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── How It Works ───────────────────────────────────── */}
      <section className="py-16 px-4" style={{ backgroundColor: '#fff8f8' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              ¿Cómo funciona?
            </h2>
            <p className="text-gray-500 text-lg">Reserva en 4 simples pasos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.num} className="text-center relative">
                {/* Connector line (between cards) */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div
                    className="hidden md:block absolute top-8 left-[calc(50%+2rem)] right-0 h-0.5 opacity-30"
                    style={{ backgroundColor: '#ff4c41' }}
                  />
                )}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-sm"
                  style={{ backgroundColor: '#ff4c41' }}
                >
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ───────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Lo que dicen nuestros usuarios
          </h2>
          <p className="text-gray-500 text-lg">
            Historias reales de la comunidad Going
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: '#ff4c41' }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
              <div className="text-yellow-400 text-sm mb-3">★★★★★</div>
              <p className="text-gray-600 text-sm leading-relaxed italic">
                &ldquo;{t.text}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Únete como proveedor ───────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <span
            className="inline-block text-sm font-bold uppercase tracking-widest mb-3 px-4 py-1.5 rounded-full"
            style={{ backgroundColor: '#fff2f2', color: '#ff4c41' }}
          >
            Para proveedores
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Únete a la plataforma y genera ingresos
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Conductores, anfitriones, guías de tours y operadores de
            experiencias. Going te da las herramientas para crecer tu negocio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PROVIDERS.map((p) => (
            <Link
              key={p.title}
              href={p.href}
              className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${p.color}18` }}
              >
                {p.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {p.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-4">
                {p.description}
              </p>
              <div
                className="text-xs font-bold px-3 py-1.5 rounded-full inline-block mb-4"
                style={{ backgroundColor: `${p.color}15`, color: p.color }}
              >
                ✓ {p.stats}
              </div>
              <div
                className="text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all"
                style={{ color: '#ff4c41' }}
              >
                Registrarse como {p.title} →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Academia Going ─────────────────────────────────── */}
      <section className="py-16 px-4" style={{ backgroundColor: '#0f172a' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span
                className="inline-block text-sm font-bold uppercase tracking-widest mb-3 px-4 py-1.5 rounded-full"
                style={{ backgroundColor: '#ff4c411a', color: '#ff6b60' }}
              >
                📚 Academia Going
              </span>
              <h2 className="text-4xl font-bold text-white mb-3">
                Capacítate y crece con Going
              </h2>
              <p className="text-gray-400 text-lg max-w-xl">
                Cursos gratuitos para conductores, anfitriones, guías de tours y
                operadores de experiencias. Aprende a tu ritmo.
              </p>
            </div>
            <Link
              href="/academy"
              className="flex-shrink-0 px-6 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:border-gray-400 hover:text-white transition-all text-sm"
            >
              Ver todos los cursos →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {ACADEMY_PREVIEW.map((course) => (
              <Link
                key={course.title}
                href="/academy"
                className="group bg-gray-800/60 border border-gray-700 rounded-2xl overflow-hidden hover:border-gray-500 hover:bg-gray-800 transition-all"
              >
                <div className="h-2" style={{ backgroundColor: '#ff4c41' }} />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      {course.category}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${course.levelColor}`}
                    >
                      {course.level}
                    </span>
                  </div>
                  <div className="text-4xl mb-3">{course.icon}</div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {course.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">
                    {course.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span>📖 {course.lessons} lecciones</span>
                    <span>⏱️ {course.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      ⭐ {course.rating} · {course.students.toLocaleString()}{' '}
                      estudiantes
                    </div>
                    <span
                      className="text-xs font-semibold group-hover:gap-1"
                      style={{ color: '#ff6b60' }}
                    >
                      Comenzar →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Academy stats bar */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { n: '6', label: 'Cursos disponibles' },
              { n: 'Gratis', label: 'Siempre gratuito' },
              { n: '27K+', label: 'Estudiantes activos' },
              { n: '4.8★', label: 'Calificación promedio' },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-gray-800/40 border border-gray-700 rounded-xl p-4 text-center"
              >
                <div
                  className="text-2xl font-bold mb-1"
                  style={{ color: '#ff6b60' }}
                >
                  {s.n}
                </div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────── */}
      {!auth.user && (
        <section
          className="py-20 px-4 text-white text-center"
          style={{
            background: 'linear-gradient(135deg, #ff4c41 0%, #e63a2f 100%)',
          }}
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">
              ¿Listo para tu próxima aventura?
            </h2>
            <p className="text-xl text-white/85 mb-8">
              Únete a más de 1 millón de ecuatorianos que ya usan Going
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/register"
                className="px-10 py-4 bg-white font-bold rounded-xl text-lg hover:bg-gray-100 transition-all hover:shadow-lg"
                style={{ color: '#ff4c41' }}
              >
                Crear cuenta gratis
              </a>
              <a
                href="/services"
                className="px-10 py-4 border-2 border-white text-white font-bold rounded-xl text-lg hover:bg-white/10 transition-all"
              >
                Ver servicios
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer className="bg-gray-900 px-4 pt-14 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Top row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <Image
                src="/going-logo-white-h.png"
                alt="Going"
                width={110}
                height={38}
                className="h-8 w-auto mb-4"
              />
              <p className="text-gray-500 text-sm leading-relaxed">
                La plataforma de movilidad y servicios de Ecuador.
              </p>
              <div className="flex gap-3 mt-4">
                {['📱', '🤖', '🌐'].map((icon, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-base cursor-pointer hover:bg-gray-700 transition-colors"
                  >
                    {icon}
                  </div>
                ))}
              </div>
            </div>

            {/* Servicios */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">
                Servicios
              </h4>
              <ul className="space-y-2">
                {[
                  { label: 'Transporte', href: '/services' },
                  { label: 'Alojamiento', href: '/services' },
                  { label: 'Tours', href: '/services' },
                  { label: 'Experiencias', href: '/services' },
                  { label: 'Envíos', href: '/services' },
                  { label: 'Pagos', href: '/services' },
                ].map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Academia */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">
                Academia
              </h4>
              <ul className="space-y-2">
                {[
                  { label: 'Para Conductores', href: '/academy' },
                  { label: 'Para Anfitriones', href: '/academy' },
                  { label: 'Para Guías', href: '/academy' },
                  { label: 'Para Operadores', href: '/academy' },
                  { label: 'Para Viajeros', href: '/academy' },
                  { label: 'Todos los cursos', href: '/academy' },
                ].map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Empresa</h4>
              <ul className="space-y-2">
                {[
                  { label: 'Nosotros', href: '/about' },
                  { label: 'Blog', href: '/blog' },
                  { label: 'Noticias', href: '/news' },
                  { label: 'Carreras', href: '/careers' },
                  { label: 'Comunidad', href: '/community' },
                  { label: 'Sostenibilidad', href: '/sustainability' },
                ].map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Soporte */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Soporte</h4>
              <ul className="space-y-2">
                {[
                  { label: 'Centro de Ayuda', href: '/help' },
                  { label: 'SOS / Emergencias', href: '/sos' },
                  { label: 'Contacto', href: '/contact' },
                  { label: 'Seguridad', href: '/security' },
                  { label: 'Estado del sistema', href: '/status' },
                  { label: 'Documentación', href: '/documentation' },
                ].map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-800 pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-gray-600 text-xs">
                © 2026 Going · Todos los derechos reservados · Ecuador
              </p>
              <div className="flex gap-5">
                {[
                  { label: 'Términos', href: '/legal/terms' },
                  { label: 'Privacidad', href: '/legal/privacy' },
                  { label: 'Cookies', href: '/legal/cookies' },
                ].map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
