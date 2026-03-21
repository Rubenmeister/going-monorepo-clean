'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

// ── API MAPPING ───────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  ADVENTURE: '🏔️',
  CULTURAL: '🎨',
  GASTRONOMY: '🍽️',
  NATURE: '🌿',
};
const CATEGORY_COLORS: Record<string, string> = {
  ADVENTURE: '#EF4444',
  CULTURAL: '#8B5CF6',
  GASTRONOMY: '#F59E0B',
  NATURE: '#22C55E',
};
const CATEGORY_PHOTOS: Record<string, string> = {
  ADVENTURE:
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80&auto=format',
  CULTURAL:
    'https://images.unsplash.com/photo-1509400449-534e54d0b4cf?w=600&q=80&auto=format',
  GASTRONOMY:
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80&auto=format',
  NATURE:
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80&auto=format',
};

function mapApiTour(t: any) {
  const cat = (t.category as string) ?? 'ADVENTURE';
  return {
    icon: CATEGORY_ICONS[cat] ?? '🗺️',
    name: t.title,
    tagline: t.location?.city ? `${t.location.city}, Ecuador` : 'Ecuador',
    desc: t.description,
    highlights: (t.amenities ?? []).slice(0, 4),
    duration: t.durationHours ? `${t.durationHours}h` : 'Variable',
    from: `Desde $${t.price?.amount ?? 0}`,
    photo: CATEGORY_PHOTOS[cat] ?? CATEGORY_PHOTOS['ADVENTURE'],
    color: CATEGORY_COLORS[cat] ?? '#EF4444',
    featured: false,
  };
}

// ── FALLBACK DATA (visible mientras la API carga o si está vacía) ─────
const TOURS_FALLBACK = [
  {
    icon: '🌋',
    name: 'Volcanes y Andes',
    tagline: 'La Avenida de los Volcanes',
    desc: 'Explora la imponente Cordillera de los Andes. Ascenso al Cotopaxi (5,897 m), Chimborazo, Tungurahua y el magnífico camino del Quilotoa. Tours de 1 a 5 días.',
    highlights: [
      'Cotopaxi · Chimborazo · Quilotoa',
      'Guías de alta montaña certificados',
      'Equipo técnico incluido',
      'Grupos máximo 8 personas',
    ],
    duration: '1–5 días',
    from: 'Desde $75',
    photo:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80&auto=format',
    color: '#EF4444',
    featured: true,
  },
  {
    icon: '🌿',
    name: 'Amazonía',
    tagline: 'El pulmón del planeta',
    desc: 'Adéntrate en la selva tropical ecuatoriana. Comunidades indígenas Kichwa, observación de vida silvestre, canotaje en el río Napo y noches bajo las estrellas amazónicas.',
    highlights: [
      'Comunidades indígenas',
      'Canotaje en el Napo',
      'Observación de fauna',
      'Lodge en la selva',
    ],
    duration: '3–7 días',
    from: 'Desde $220',
    photo:
      'https://images.unsplash.com/photo-1547550332-b31d9d7d82ef?w=600&q=80&auto=format',
    color: '#22C55E',
    featured: true,
  },
  {
    icon: '🐢',
    name: 'Islas Galápagos',
    tagline: 'El laboratorio de Darwin',
    desc: 'El archipiélago más biodiverso del planeta. Snorkel con tortugas marinas, lobos de mar y tiburones ballena. Cruceros de 4 a 8 días o tours desde Santa Cruz.',
    highlights: [
      'Patrimonio UNESCO',
      'Cruceros disponibles',
      'Guías naturalistas',
      'Buceo y snorkel',
    ],
    duration: '4–8 días',
    from: 'Desde $890',
    photo:
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80&auto=format',
    color: '#0ea5e9',
    featured: false,
  },
  {
    icon: '🏙️',
    name: 'Quito Histórico',
    tagline: 'Primer Patrimonio de la Humanidad',
    desc: 'Recorre el Centro Histórico más grande y mejor preservado de América Latina. Iglesia de La Compañía, Plaza Grande, mercados y gastronomía quiteña.',
    highlights: [
      'Centro histórico UNESCO',
      'La Mitad del Mundo',
      'Gastronomía local',
      'Tour nocturno disponible',
    ],
    duration: 'Medio día – 2 días',
    from: 'Desde $35',
    photo:
      'https://images.unsplash.com/photo-1534531173927-aeb928d54385?w=600&q=80&auto=format',
    color: '#F59E0B',
    featured: false,
  },
  {
    icon: '🏖️',
    name: 'Costa y Playas',
    tagline: 'El Pacífico a tus pies',
    desc: 'Montañita, Canoa, Salinas, Puerto López. Avistamiento de ballenas jorobadas (julio–octubre), surf, buceo y la gastronomía costeña que enamora.',
    highlights: [
      'Ballenas jorobadas (jul–oct)',
      'Surf en Montañita',
      'Isla de La Plata',
      'Ceviche y mariscos',
    ],
    duration: '2–5 días',
    from: 'Desde $95',
    photo:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80&auto=format',
    color: '#6366F1',
    featured: false,
  },
  {
    icon: '🎨',
    name: 'Cultural y Artesanal',
    tagline: 'El alma de los pueblos andinos',
    desc: 'Otavalo, Cotacachi, Riobamba y Cuenca. Mercados indígenas, talleres de cerámica y textiles, danzas tradicionales y cocina de la Sierra ecuatoriana.',
    highlights: [
      'Mercado de Otavalo',
      'Talleres artesanales',
      'Danzas autóctonas',
      'Cuenca Patrimonio UNESCO',
    ],
    duration: '1–3 días',
    from: 'Desde $45',
    photo:
      'https://images.unsplash.com/photo-1509400449-534e54d0b4cf?w=600&q=80&auto=format',
    color: '#8B5CF6',
    featured: false,
  },
];

const STATS = [
  { number: '180+', label: 'Tours disponibles' },
  { number: '320+', label: 'Guías certificados' },
  { number: '4.9 ★', label: 'Calificación promedio' },
  { number: '15K+', label: 'Viajeros este año' },
];

const WHY_GOING = [
  {
    icon: '🏅',
    title: 'Guías locales certificados',
    desc: 'Todos nuestros guías son nativos de cada región, certificados por el Ministerio de Turismo de Ecuador.',
  },
  {
    icon: '📋',
    title: 'Itinerarios personalizados',
    desc: 'Adaptamos cada tour a tu ritmo, intereses y presupuesto. Grupos familiares, parejas o viajeros solos.',
  },
  {
    icon: '🎒',
    title: 'Equipamiento incluido',
    desc: 'No te preocupes por el equipo. En tours de montaña proveemos crampones, arneses y ropa técnica.',
  },
  {
    icon: '🚐',
    title: 'Transporte puerta a puerta',
    desc: 'Recogida y retorno desde tu hotel o punto acordado en todas las ciudades principales.',
  },
];
// ── END CONTENT ───────────────────────────────────────────────────────

export default function ToursPage() {
  const [tours, setTours] = useState(TOURS_FALLBACK);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;
    fetch(`${apiUrl}/tours/search`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0)
          setTours(data.map(mapApiTour));
      })
      .catch(() => {});
  }, []);

  const featured = tours.filter((t) => t.featured);
  const rest = tours.filter((t) => !t.featured);
  // If no featured (API data has none), show first 2 as featured
  const displayFeatured = featured.length > 0 ? featured : tours.slice(0, 2);
  const displayRest = featured.length > 0 ? rest : tours.slice(2);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section
        className="relative py-24 px-4 text-white text-center overflow-hidden"
        style={{ backgroundColor: '#011627' }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white opacity-5 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white opacity-5 translate-y-1/2 -translate-x-1/3" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="text-5xl mb-4">🗺️</div>
          <h1 className="text-5xl font-bold mb-4">Tours por Ecuador</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Cuatro mundos en un solo país: Sierra, Costa, Amazonía y Galápagos.
            Guías locales expertos te llevan a donde los mapas no llegan.
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

      {/* Featured Tours */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Tours destacados
        </h2>
        <p className="text-gray-500 mb-8">Los favoritos de nuestra comunidad</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {displayFeatured.map((tour) => (
            <div
              key={tour.name}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={tour.photo}
                  alt={tour.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0 opacity-50"
                  style={{
                    background: `linear-gradient(to top, ${tour.color}, transparent)`,
                  }}
                />
                <div className="absolute top-3 left-3 bg-white/10 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                  ⭐ DESTACADO
                </div>
                <div className="absolute bottom-3 left-4">
                  <div className="text-2xl mb-1">{tour.icon}</div>
                  <div className="text-white font-bold text-xl leading-tight">
                    {tour.name}
                  </div>
                  <div className="text-white/80 text-sm">{tour.tagline}</div>
                </div>
                <div
                  className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full"
                  style={{ color: tour.color }}
                >
                  {tour.from}
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                  {tour.desc}
                </p>
                {tour.highlights.length > 0 && (
                  <ul className="grid grid-cols-2 gap-1.5 mb-5">
                    {tour.highlights.map((h) => (
                      <li
                        key={h}
                        className="text-sm text-gray-600 flex items-center gap-1.5"
                      >
                        <span
                          className="font-bold text-xs"
                          style={{ color: '#ff4c41' }}
                        >
                          ✓
                        </span>
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-3">
                  <div className="flex-1 text-center py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500">
                    ⏱ {tour.duration}
                  </div>
                  <button
                    className="flex-[2] py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:shadow-md"
                    style={{ backgroundColor: '#ff4c41' }}
                  >
                    Reservar tour
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* All Tours */}
      {displayRest.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 mt-8">
            Más tours
          </h2>
          <p className="text-gray-500 mb-8">Toda Ecuador en un clic</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayRest.map((tour) => (
              <div
                key={tour.name}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group"
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={tour.photo}
                    alt={tour.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div
                    className="absolute inset-0 opacity-50"
                    style={{
                      background: `linear-gradient(to top, ${tour.color}, transparent)`,
                    }}
                  />
                  <div className="absolute bottom-3 left-3 text-2xl">
                    {tour.icon}
                  </div>
                  <div
                    className="absolute top-2 right-2 bg-white/90 text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ color: tour.color }}
                  >
                    {tour.from}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-0.5">
                    {tour.name}
                  </h3>
                  <p
                    className="text-xs font-semibold mb-2"
                    style={{ color: '#ff4c41' }}
                  >
                    {tour.tagline}
                  </p>
                  <p className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-2">
                    {tour.desc}
                  </p>
                  <div className="text-xs text-gray-400 mb-3">
                    ⏱ {tour.duration}
                  </div>
                  <button
                    className="w-full py-2 rounded-xl font-semibold text-xs text-white transition-all hover:shadow-md"
                    style={{ backgroundColor: '#ff4c41' }}
                  >
                    Ver tour
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Why Going */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
            Tours que no olvidarás
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {WHY_GOING.map((w) => (
              <div
                key={w.title}
                className="flex gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100"
              >
                <div className="text-3xl flex-shrink-0">{w.icon}</div>
                <div>
                  <div className="font-bold text-gray-900 mb-1">{w.title}</div>
                  <div className="text-sm text-gray-500 leading-relaxed">
                    {w.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-16 px-4 text-center text-white"
        style={{ backgroundColor: '#011627' }}
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            ¿Cuál será tu próxima aventura?
          </h2>
          <p className="text-white/70 mb-8 text-lg">
            Más de 180 tours en los cuatro mundos de Ecuador. Reserva hoy y vive
            mañana.
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
              Explorar destinos
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
