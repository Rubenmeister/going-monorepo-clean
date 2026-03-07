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
      'Viaja cómodo y seguro a cualquier destino. Conductores verificados, tarifas transparentes.',
    photo:
      'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80&auto=format',
    href: '/services',
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

      {/* ─── Quick Links ────────────────────────────────────── */}
      <section className="bg-gray-900 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Image
              src="/going-logo-white-h.png"
              alt="Going"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
            <div className="flex flex-wrap gap-6 justify-center">
              {[
                { title: 'Academia', href: '/academy' },
                { title: 'Servicios', href: '/services' },
                { title: 'Mis Reservas', href: '/bookings' },
                { title: 'Emergencias', href: '/sos' },
                { title: 'Mi Cuenta', href: '/account' },
              ].map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
                >
                  {link.title}
                </Link>
              ))}
            </div>
            <p className="text-gray-600 text-xs">© 2026 Going · Ecuador</p>
          </div>
        </div>
      </section>
    </main>
  );
}
