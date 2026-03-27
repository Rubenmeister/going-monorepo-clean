'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

// ── API MAPPING ───────────────────────────────────────────────────────
function mapApiExperience(e: any) {
  return {
    icon: '🎭',
    name: e.title,
    tagline: e.location?.city ? `${e.location.city}, Ecuador` : 'Ecuador',
    desc: e.description,
    includes: [],
    price: `Desde $${e.price?.amount ?? 0}`,
    duration: e.durationHours ? `${e.durationHours}h` : 'Variable',
    photo:
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&q=80&auto=format',
    color: '#0ea5e9',
    tag: 'CULTURAL',
  };
}

// ── FALLBACK DATA (visible mientras la API carga o si está vacía) ─────
const EXPERIENCES_FALLBACK = [
  {
    icon: '🤿',
    name: 'Buceo y Snorkel',
    tagline: 'El submarino de las Galápagos',
    desc: 'Las aguas de las Islas Galápagos albergan uno de los ecosistemas marinos más ricos del mundo. Nada junto a tiburones ballena, mantarrayas, tortugas y leones marinos.',
    includes: [
      'Equipo de buceo certificado',
      'Instructor PADI',
      'Foto y video subacuático',
      'Seguro de buceo',
    ],
    price: 'Desde $95',
    duration: 'Medio día – 5 días',
    photo:
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&q=80&auto=format',
    color: '#0ea5e9',
    tag: 'AVENTURA',
  },
  {
    icon: '🍽️',
    name: 'Gastronomía Ecuatoriana',
    tagline: 'Sabores que cuentan historias',
    desc: 'Ceviche de camarón, seco de pollo, hornado de Riobamba, caldo de patas, llapingachos y el inigualable cuy. Visitas a mercados locales, clases de cocina y cenas en haciendas.',
    includes: [
      'Tour de mercado con chef',
      'Clase de cocina 3 horas',
      'Degustación de 8 platos',
      'Recetario digital de regalo',
    ],
    price: 'Desde $55',
    duration: '3–5 horas',
    photo:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80&auto=format',
    color: '#F59E0B',
    tag: 'CULTURAL',
  },
  {
    icon: '🧵',
    name: 'Arte y Artesanía',
    tagline: 'Manos que crean milagros',
    desc: 'Talleres de tejido Otavaleño, sombrero de paja toquilla de Cuenca, cerámica de Pujilí, balsa de La Esperanza. Aprende de los maestros artesanos y llévate tu obra.',
    includes: [
      'Taller con maestro artesano',
      'Material incluido',
      'Tu obra para llevar',
      'Visita a taller familiar',
    ],
    price: 'Desde $30',
    duration: '2–4 horas',
    photo:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&auto=format',
    color: '#EC4899',
    tag: 'CULTURAL',
  },
  {
    icon: '🌳',
    name: 'Ecoturismo y Naturaleza',
    tagline: 'Conecta con el planeta vivo',
    desc: 'Reserva Mindo-Nambillo, bosque de los Cedros, Yasuni y Cuyabeno. Observación de más de 1,000 especies de aves, mariposas y flora endémica con guías naturalistas.',
    includes: [
      'Guía naturalista certificado',
      'Binoculares incluidos',
      'Lista de aves identificadas',
      'Certificado de carbono cero',
    ],
    price: 'Desde $65',
    duration: '1–3 días',
    photo:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80&auto=format',
    color: '#22C55E',
    tag: 'NATURALEZA',
  },
  {
    icon: '🏄',
    name: 'Surf y Deportes de Mar',
    tagline: 'Las olas perfectas del Pacífico',
    desc: 'Montañita, Canoa, Mompiche y Salinas. Ecuador tiene olas para todos los niveles. Escuelas de surf con instructores certificados, tablas de alquiler y campamentos.',
    includes: [
      'Tabla y traje de neopreno',
      'Instructor certificado ISA',
      'Sesión de video análisis',
      'Transporte a la playa',
    ],
    price: 'Desde $40',
    duration: '2 horas – semana',
    photo:
      'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600&q=80&auto=format',
    color: '#6366F1',
    tag: 'AVENTURA',
  },
  {
    icon: '🎵',
    name: 'Música y Danza',
    tagline: 'El ritmo del Ecuador',
    desc: 'Pasillo, sanjuanito, bomba del Chota y salsa manabita. Talleres de percusión, clases de baile folclórico y noches culturales en peñas tradicionales de Quito y Otavalo.',
    includes: [
      'Clase de baile 2 horas',
      'Música en vivo',
      'Traje típico para fotos',
      'Show folclórico nocturno',
    ],
    price: 'Desde $25',
    duration: '2–4 horas',
    photo:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80&auto=format',
    color: '#EF4444',
    tag: 'CULTURAL',
  },
  {
    icon: '🚵',
    name: 'Ciclismo y Trekking',
    tagline: 'El camino es la recompensa',
    desc: 'Downhill desde el Cotopaxi, ruta de los lagos de Mojanda, Camino del Inca y Trek del Quilotoa. Bicicletas de montaña de última generación y guías especializados.',
    includes: [
      'Bicicleta full-suspension',
      'Casco y protecciones',
      'Almuerzo en ruta',
      'Foto y video incluidos',
    ],
    price: 'Desde $50',
    duration: '4 horas – 3 días',
    photo:
      'https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?w=600&q=80&auto=format',
    color: '#8B5CF6',
    tag: 'AVENTURA',
  },
  {
    icon: '☕',
    name: 'Cacao y Café',
    tagline: 'El origen del mejor cacao del mundo',
    desc: 'Ecuador produce el 70% del cacao fino de aroma del mundo. Tours a fincas en Los Ríos, Esmeraldas y Manabí. Cosecha, fermentación, secado y degustación de chocolate artesanal.',
    includes: [
      'Visita a finca cacaotera',
      'Taller de chocolate artesanal',
      'Degustación premium',
      'Paquete de cacao de regalo',
    ],
    price: 'Desde $45',
    duration: '4 horas – 1 día',
    photo:
      'https://images.unsplash.com/photo-1511381939415-e44015466834?w=600&q=80&auto=format',
    color: '#92400E',
    tag: 'GASTRONOMÍA',
  },
];

const TAGS = ['TODOS', 'AVENTURA', 'CULTURAL', 'NATURALEZA', 'GASTRONOMÍA'];

const STATS = [
  { number: '95+', label: 'Experiencias únicas' },
  { number: '4.9 ★', label: 'Calificación promedio' },
  { number: '8K+', label: 'Participantes este año' },
  { number: '100%', label: 'Anfitriones verificados' },
];
// ── END CONTENT ───────────────────────────────────────────────────────

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState(EXPERIENCES_FALLBACK);
  const [activeTag, setActiveTag] = useState('TODOS');

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;
    fetch(`${apiUrl}/experiences/search`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0)
          setExperiences(data.map(mapApiExperience));
      })
      .catch(() => {});
  }, []);

  const filtered =
    activeTag === 'TODOS'
      ? experiences
      : experiences.filter((e) => e.tag === activeTag);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section
        className="relative py-24 px-4 text-white text-center overflow-hidden"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1400&q=80&auto=format)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(1,22,39,0.72)' }}
        />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="text-5xl mb-4">🎭</div>
          <h1 className="text-5xl font-bold mb-4">Experiencias en Ecuador</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Buceo, gastronomía, artesanía, surf, cacao y mucho más. Crea
            recuerdos que duran toda la vida con anfitriones locales expertos.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold" style={{ color: '#ff4c41' }}>
                {s.number}
              </div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Experiences Grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          ¿Qué quieres vivir hoy?
        </h2>
        <p className="text-gray-500 text-center mb-10">
          Más de 95 experiencias únicas para todos los gustos y presupuestos
        </p>

        {/* Tag filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer"
              style={
                tag === activeTag
                  ? { backgroundColor: '#ff4c41', color: '#fff' }
                  : {
                      backgroundColor: '#fff',
                      color: '#6b7280',
                      border: '1px solid #e5e7eb',
                    }
              }
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((exp) => (
            <div
              key={exp.name}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group"
            >
              {/* Photo */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={exp.photo}
                  alt={exp.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0 opacity-50"
                  style={{
                    background: `linear-gradient(to top, ${exp.color}, transparent)`,
                  }}
                />
                <div className="absolute bottom-3 left-3 text-2xl">
                  {exp.icon}
                </div>
                <div
                  className="absolute top-2 left-2 text-white text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: exp.color }}
                >
                  {exp.tag}
                </div>
                <div
                  className="absolute top-2 right-2 bg-white/90 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ color: exp.color }}
                >
                  {exp.price}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-bold text-gray-900 mb-0.5">{exp.name}</h3>
                <p
                  className="text-xs font-semibold mb-2"
                  style={{ color: '#ff4c41' }}
                >
                  {exp.tagline}
                </p>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-2">
                  {exp.desc}
                </p>

                {exp.includes.length > 0 && (
                  <ul className="space-y-1 mb-4">
                    {exp.includes.slice(0, 3).map((inc) => (
                      <li
                        key={inc}
                        className="text-xs text-gray-600 flex items-center gap-1.5"
                      >
                        <span
                          className="font-bold"
                          style={{ color: '#ff4c41' }}
                        >
                          ✓
                        </span>
                        {inc}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-400">
                    ⏱ {exp.duration}
                  </span>
                </div>

                <button
                  className="w-full py-2 rounded-xl font-semibold text-xs text-white transition-all hover:shadow-md"
                  style={{ backgroundColor: '#ff4c41' }}
                >
                  Reservar experiencia
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-lg font-medium">
              No hay experiencias en esta categoría aún.
            </p>
          </div>
        )}
      </section>

      {/* CTA */}
      <section
        className="py-16 px-4 text-center text-white"
        style={{ backgroundColor: '#011627' }}
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            Cada viaje es una historia nueva
          </h2>
          <p className="text-white/70 mb-8 text-lg">
            Únete a los miles de viajeros que descubren Ecuador desde adentro
            con Going.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-3.5 font-bold rounded-xl text-white transition-all hover:shadow-md text-sm"
              style={{ backgroundColor: '#ff4c41' }}
            >
              Crear cuenta gratis
            </Link>
            <Link
              href="/destinations"
              className="px-8 py-3.5 border-2 border-white/30 font-bold rounded-xl text-white hover:border-white transition-all text-sm"
            >
              Ver destinos
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN PROMOTORES LOCALES ── */}
      <section className="py-0 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row" style={{ background: '#1a1a2e' }}>
            <div className="md:w-2/5 flex-shrink-0">
              <img
                src="/images/BALLET JACCHIGUA.jpg"
                alt="Promotor local Going Ecuador"
                className="w-full h-full object-cover"
                style={{ minHeight: '360px', maxHeight: '500px' }}
              />
            </div>
            <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
              <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-3 py-1.5 rounded-full w-fit"
                style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
                🏺 ¿Ofreces experiencias locales?
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
                Comparte tu cultura.<br />
                <span style={{ color: '#fbbf24' }}>Genera ingresos.</span>
              </h2>
              <p className="text-gray-300 text-base leading-relaxed mb-6">
                ¿Eres guía, artesano, chef o tienes algo único que mostrar de tu comunidad?
                Únete como Promotor Local Going y lleva tu oferta a viajeros de todo el mundo.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { icon: '🌎', text: 'Viajeros nacionales e internacionales' },
                  { icon: '💰', text: 'Tú fijas el precio de tu experiencia' },
                  { icon: '📱', text: 'Gestión simple desde la app' },
                  { icon: '🛡️', text: 'Pagos seguros y a tiempo' },
                ].map(r => (
                  <div key={r.text} className="flex items-center gap-2 text-sm text-gray-300">
                    <span>{r.icon}</span><span>{r.text}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/auth/register?rol=promotor"
                  className="flex-1 py-3.5 rounded-xl text-white font-bold text-center text-sm hover:opacity-90 transition-all"
                  style={{ backgroundColor: '#d97706' }}>
                  Registrarme como promotor →
                </Link>
                <Link href="/auth/login?from=/services/promotores-locales"
                  className="flex-1 py-3.5 rounded-xl font-bold text-center text-sm border border-white/20 text-white hover:bg-white/10 transition-all">
                  Ya soy promotor → Mi panel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="py-10" />
    </main>
  );
}
