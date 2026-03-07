'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';

/* ── Saved locations hook (localStorage) ───────────────────── */
function useSavedLocations() {
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('going_locations');
      if (raw) setSaved(JSON.parse(raw));
    } catch {}
  }, []);

  const add = (loc: string) => {
    const trimmed = loc.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...saved.filter((l) => l !== trimmed)].slice(
      0,
      6
    );
    setSaved(updated);
    try {
      localStorage.setItem('going_locations', JSON.stringify(updated));
    } catch {}
  };

  return { saved, add };
}

/* ── Location Input with dropdown suggestions ──────────────── */
function LocationInput({
  label,
  placeholder,
  value,
  onChange,
  suggestions,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
}) {
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(value.toLowerCase()) && s !== value
  );
  const showDrop =
    focused && (filtered.length > 0 || (!value && suggestions.length > 0));
  const dropItems = value ? filtered : suggestions;

  return (
    <div ref={wrapRef} className="relative">
      <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wide">
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4c41] bg-gray-50"
      />
      {showDrop && dropItems.length > 0 && (
        <ul className="absolute z-30 top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
          {dropItems.map((s) => (
            <li key={s}>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-[#ff4c41] flex items-center gap-2"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(s);
                  setFocused(false);
                }}
              >
                <svg
                  className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Static data ────────────────────────────────────────────── */
const SERVICES = [
  {
    id: 'transport',
    icon: '🚗',
    title: 'Transporte',
    description:
      'Privado (Economy, Comfort, Premium) o Compartido. Ahorra hasta 60%. Conductores verificados, seguimiento en tiempo real.',
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
    href: '/services/accommodation',
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
    href: '/services/tours',
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
    href: '/services/experiences',
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
    id: 'academy',
    icon: '📚',
    title: 'Academia Going',
    description:
      'Cursos gratuitos para conductores, anfitriones, guías y operadores de experiencias.',
    photo:
      'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&q=80&auto=format',
    href: '/academy',
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

/* ── Page ─────────────────────────────────────────────────── */
export default function Home() {
  const { auth } = useMonorepoApp();
  const { saved: savedLocations, add: saveLocation } = useSavedLocations();
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchTime, setSearchTime] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Save both locations to recent history
    if (searchFrom) saveLocation(searchFrom);
    if (searchTo) saveLocation(searchTo);
    const params = new URLSearchParams({
      from: searchFrom,
      to: searchTo,
      date: searchDate,
      time: searchTime,
    });
    window.location.href = `/services/transport?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Hero — touristic landscape, dark overlay ───────── */}
      <section className="relative h-[580px] overflow-hidden">
        {/* Background — vibrant Ecuador landscape photo */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1800&q=85&auto=format')",
            transformOrigin: 'center',
          }}
        />
        {/* Dark overlay — let the photo breathe, no heavy red */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.65) 100%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-4">
          {/* Primary logo — white version over dark overlay */}
          <div className="mb-6 drop-shadow-lg">
            <Image
              src="/going-logo-white-h.png"
              alt="Going"
              width={200}
              height={68}
              className="h-14 w-auto mx-auto object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 leading-tight max-w-3xl drop-shadow-md">
            Viaja, explora y vive Ecuador
          </h1>
          <p className="text-lg md:text-xl text-white/85 mb-8 max-w-xl drop-shadow">
            Transporte, alojamiento, tours, experiencias y envíos en una sola
            plataforma.
          </p>
          {!auth.user && (
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/auth/register"
                className="px-8 py-3.5 bg-white font-bold rounded-xl transition-all hover:bg-gray-100 hover:shadow-lg text-sm"
                style={{ color: '#ff4c41' }}
              >
                Comenzar Gratis
              </a>
              <a
                href="/auth/login"
                className="px-8 py-3.5 border-2 border-white text-white font-bold rounded-xl transition-all hover:bg-white/10 text-sm"
              >
                Iniciar Sesión
              </a>
            </div>
          )}
          {auth.user && (
            <div className="px-8 py-3.5 bg-white/15 border border-white/30 rounded-2xl text-white backdrop-blur-sm text-sm font-semibold">
              Bienvenido, <strong>{auth.user.firstName}</strong> 👋
            </div>
          )}
        </div>
      </section>

      {/* ─── Search Bar with time + saved locations ─────────── */}
      <section className="max-w-5xl mx-auto px-4 -mt-12 relative z-20 mb-14">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>🔍</span> ¿A dónde quieres ir?
          </h2>
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
          >
            {/* Origen — with saved locations dropdown */}
            <div className="lg:col-span-1">
              <LocationInput
                label="Origen"
                placeholder="Ciudad de origen"
                value={searchFrom}
                onChange={setSearchFrom}
                suggestions={savedLocations}
              />
            </div>

            {/* Destino — with saved locations dropdown */}
            <div className="lg:col-span-1">
              <LocationInput
                label="Destino"
                placeholder="Ciudad destino"
                value={searchTo}
                onChange={setSearchTo}
                suggestions={savedLocations}
              />
            </div>

            {/* Fecha */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wide">
                Fecha
              </label>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4c41] bg-gray-50"
              />
            </div>

            {/* Hora de salida */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wide">
                Hora salida
              </label>
              <input
                type="time"
                value={searchTime}
                onChange={(e) => setSearchTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4c41] bg-gray-50"
              />
            </div>

            {/* Buscar */}
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
          {savedLocations.length > 0 && (
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Haz clic en Origen o Destino para ver tus últimas búsquedas
            </p>
          )}
        </div>
      </section>

      {/* ─── Stats ─────────────────────────────────────────────── */}
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

      {/* ─── Services Grid ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Nuestros Servicios
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Todo lo que necesitas para moverte, alojarte y explorar Ecuador.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service) => (
            <Link
              key={service.id}
              href={service.href}
              className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
            >
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

      {/* ─── How It Works ──────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              ¿Cómo funciona?
            </h2>
            <p className="text-gray-500 text-lg">Reserva en 4 simples pasos</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.num} className="text-center relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div
                    className="hidden md:block absolute top-8 left-[calc(50%+2rem)] right-0 h-0.5 opacity-20"
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

      {/* ─── Testimonials ──────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
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

      {/* ─── Únete como proveedor ──────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <span
            className="inline-block text-sm font-bold uppercase tracking-widest mb-3 px-4 py-1.5 rounded-full"
            style={{ backgroundColor: '#fff2f2', color: '#ff4c41' }}
          >
            Para proveedores
          </span>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Únete a la plataforma y genera ingresos
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Conductores, anfitriones, guías de tours y operadores de
            experiencias.
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

      {/* ─── Academia Going ────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ backgroundColor: '#0f172a' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span
                className="inline-block text-sm font-bold uppercase tracking-widest mb-3 px-4 py-1.5 rounded-full"
                style={{ backgroundColor: '#ff4c4120', color: '#ff6b60' }}
              >
                📚 Academia Going
              </span>
              <h2 className="text-3xl font-bold text-white mb-3">
                Capacítate y crece con Going
              </h2>
              <p className="text-gray-400 text-lg max-w-xl">
                Cursos gratuitos para conductores, anfitriones, guías y
                operadores. Aprende a tu ritmo.
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
                      className="text-xs font-semibold"
                      style={{ color: '#ff6b60' }}
                    >
                      Comenzar →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

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

      {/* ─── CTA — dark navy instead of solid red ──────────────── */}
      {!auth.user && (
        <section
          className="py-20 px-4 text-center"
          style={{ backgroundColor: '#011627' }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <Image
                src="/going-logo-white-h.png"
                alt="Going"
                width={140}
                height={48}
                className="h-12 w-auto mx-auto object-contain opacity-90"
              />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              ¿Listo para tu próxima aventura?
            </h2>
            <p className="text-xl text-white/70 mb-8">
              Únete a más de 1 millón de ecuatorianos que ya usan Going
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/register"
                className="px-10 py-4 font-bold rounded-xl text-sm hover:opacity-90 transition-all shadow-lg"
                style={{ backgroundColor: '#ff4c41', color: 'white' }}
              >
                Crear cuenta gratis
              </a>
              <a
                href="/services"
                className="px-10 py-4 border-2 border-white/30 text-white font-bold rounded-xl text-sm hover:border-white/60 hover:bg-white/5 transition-all"
              >
                Ver servicios
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
