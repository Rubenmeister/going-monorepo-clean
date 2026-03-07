'use client';

import { useState } from 'react';
import Link from 'next/link';

/* ─────────────────────────────────────────────────────────────
   DESTINOS DE ECUADOR — edita este bloque para cambiar el
   contenido de cada destino. Solo necesitas modificar los
   campos: name, region, tagline, description, highlights,
   photo, activities, bestTime y price.
───────────────────────────────────────────────────────────── */
const DESTINATIONS = [
  {
    id: 'galapagos',
    name: 'Islas Galápagos',
    region: 'Pacífico',
    tagline: 'El laboratorio natural de la evolución',
    description:
      'Archipiélago único en el mundo, declarado Patrimonio de la Humanidad por la UNESCO. Hogar de tortugas gigantes, iguanas marinas, leones marinos y una biodiversidad sin igual que inspiró la teoría de la evolución de Darwin.',
    highlights: [
      'Patrimonio UNESCO',
      'Buceo único',
      'Fauna endémica',
      'Volcanes activos',
    ],
    photo:
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80&auto=format',
    activities: [
      '🤿 Snorkel y buceo',
      '🐢 Avistamiento de tortugas',
      '🦈 Tiburones ballena',
      '🚤 Cruceros',
    ],
    bestTime: 'Junio – Diciembre',
    price: 'Desde $890',
    color: '#0ea5e9',
    featured: true,
  },
  {
    id: 'amazon',
    name: 'Amazonía Ecuatoriana',
    region: 'Oriente',
    tagline: 'El pulmón del mundo te espera',
    description:
      'La Amazonía ecuatoriana guarda una de las mayores biodiversidades del planeta. Ríos caudalosos, comunidades indígenas Kichwa, Shuar y Waorani, y una selva viva que alberga miles de especies de flora y fauna.',
    highlights: [
      'Mayor biodiversidad',
      'Comunidades indígenas',
      'Ríos navegables',
      'Canopy y zip-line',
    ],
    photo:
      'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80&auto=format',
    activities: [
      '🛶 Canoa por el río',
      '🌿 Caminatas en selva',
      '🐒 Avistamiento de fauna',
      '🏠 Lodges ecológicos',
    ],
    bestTime: 'Todo el año',
    price: 'Desde $290',
    color: '#10B981',
    featured: true,
  },
  {
    id: 'quito',
    name: 'Quito',
    region: 'Sierra Norte',
    tagline: 'La primera ciudad Patrimonio de la Humanidad',
    description:
      'A 2.800 m de altitud, Quito es una ciudad que combina historia colonial, modernidad y la majestuosa naturaleza andina. Su centro histórico, el mejor conservado de América Latina, y la Mitad del Mundo son imanes para viajeros del mundo.',
    highlights: [
      'Centro histórico UNESCO',
      'Mitad del Mundo',
      'Gastronomía de altura',
      'Mercados coloniales',
    ],
    photo:
      'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=80&auto=format',
    activities: [
      '🏛️ Iglesias coloniales',
      '🌅 Teleférico (4.100 m)',
      '🍽️ Gastronomía',
      '🛍️ Mercados artesanales',
    ],
    bestTime: 'Todo el año',
    price: 'Desde $89',
    color: '#F59E0B',
    featured: false,
  },
  {
    id: 'cotopaxi',
    name: 'Cotopaxi',
    region: 'Sierra Centro',
    tagline: 'El volcán activo más alto del mundo',
    description:
      'El Parque Nacional Cotopaxi alberga uno de los volcanes activos más altos del planeta con 5.897 m. Un destino de aventura extrema rodeado de páramos andinos, lagunas de altura y vida silvestre única.',
    highlights: [
      '5.897 m de altura',
      'Volcán activo',
      'Laguna del Quilotoa cercana',
      'Ciclismo de montaña',
    ],
    photo:
      'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80&auto=format',
    activities: [
      '🧗 Ascenso al volcán',
      '🚵 Mountain bike',
      '🏕️ Camping de altura',
      '🦌 Fauna andina',
    ],
    bestTime: 'Nov – Feb',
    price: 'Desde $120',
    color: '#6366f1',
    featured: false,
  },
  {
    id: 'cuenca',
    name: 'Cuenca',
    region: 'Sierra Sur',
    tagline: 'La Atenas de Ecuador',
    description:
      'Ciudad colonial por excelencia, declarada Patrimonio de la Humanidad. Sus calles empedradas, iglesias barrocas, ríos que la cruzan y la calidez de su gente hacen de Cuenca un destino imperdible del sur ecuatoriano.',
    highlights: [
      'Centro histórico UNESCO',
      'Artesanías en paja toquilla',
      'Ríos Tomebamba y Yanuncay',
      'Gastronomía local',
    ],
    photo:
      'https://images.unsplash.com/photo-1559742811-822873691df8?w=800&q=80&auto=format',
    activities: [
      '🎨 Mercados artesanales',
      '⛪ Catedral Nueva',
      '🌊 Parque Nacional Cajas',
      '🧵 Sombreros de paja',
    ],
    bestTime: 'Todo el año',
    price: 'Desde $79',
    color: '#ec4899',
    featured: false,
  },
  {
    id: 'mindo',
    name: 'Mindo',
    region: 'Sierra Noroccidente',
    tagline: 'Paraíso del aviturismo y el ecoturismo',
    description:
      'Ubicado en el bosque nublado a 1.250 m, Mindo es el paraíso de los amantes de las aves, las mariposas y la naturaleza. Más de 400 especies de aves, cascadas, canopy y el mejor chocolate orgánico del Ecuador.',
    highlights: [
      '400+ especies de aves',
      'Bosque nublado',
      'Chocolate orgánico',
      'Mariposas exóticas',
    ],
    photo:
      'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=800&q=80&auto=format',
    activities: [
      '🦜 Aviturismo',
      '🦋 Mariposario',
      '🍫 Ruta del cacao',
      '🧗 Canopy y tubing',
    ],
    bestTime: 'Dic – May',
    price: 'Desde $69',
    color: '#14b8a6',
    featured: false,
  },
  {
    id: 'montanita',
    name: 'Montañita',
    region: 'Costa Sur',
    tagline: 'El epicentro del surf y la vida bohemia',
    description:
      'Montañita es la capital del surf ecuatoriano y un punto de encuentro de viajeros de todo el mundo. Playa, fiesta, artesanías y una atmósfera libre y creativa hacen de este lugar un destino de culto en la costa del Pacífico.',
    highlights: [
      'Olas perfectas para surf',
      'Ambiente internacional',
      'Artesanías y murales',
      'Gastronomía costera',
    ],
    photo:
      'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&q=80&auto=format',
    activities: [
      '🏄 Surf y SUP',
      '🐠 Snorkel',
      '🎵 Vida nocturna',
      '🦐 Ceviche y mariscos',
    ],
    bestTime: 'Dic – May',
    price: 'Desde $59',
    color: '#f97316',
    featured: false,
  },
  {
    id: 'otavalo',
    name: 'Otavalo',
    region: 'Sierra Norte',
    tagline: 'El mercado artesanal más famoso de Sudamérica',
    description:
      'Otavalo es famosa mundialmente por su mercado indígena, donde la tradición Kichwa se expresa en textiles, artesanías y gastronomía. Rodeada de volcanes como el Imbabura, lagos como el Cuicocha y comunidades que preservan su cultura ancestral.',
    highlights: [
      'Mercado artesanal mundial',
      'Cultura Kichwa viva',
      'Lago Cuicocha',
      'Volcán Imbabura',
    ],
    photo:
      'https://images.unsplash.com/photo-1518563222397-b22eb9bab1c3?w=800&q=80&auto=format',
    activities: [
      '🧶 Mercado de artesanías',
      '🚣 Lago San Pablo',
      '🌋 Trekking Imbabura',
      '🍲 Gastronomía indígena',
    ],
    bestTime: 'Todo el año',
    price: 'Desde $49',
    color: '#84cc16',
    featured: false,
  },
];

const REGIONS = [
  'Todos',
  'Pacífico',
  'Oriente',
  'Sierra Norte',
  'Sierra Centro',
  'Sierra Sur',
  'Sierra Noroccidente',
  'Costa Sur',
];

/* ─────────────────────────────────────────────────────────── */
export default function DestinationsPage() {
  const [activeRegion, setActiveRegion] = useState('Todos');
  const [searchQ, setSearchQ] = useState('');

  const filtered = DESTINATIONS.filter((d) => {
    const matchRegion = activeRegion === 'Todos' || d.region === activeRegion;
    const matchSearch =
      !searchQ ||
      d.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      d.region.toLowerCase().includes(searchQ.toLowerCase()) ||
      d.tagline.toLowerCase().includes(searchQ.toLowerCase());
    return matchRegion && matchSearch;
  });

  const featured = DESTINATIONS.filter((d) => d.featured);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Hero ───────────────────────────────────────────── */}
      <section className="relative h-[420px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1800&q=80&auto=format')",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 100%)',
          }}
        />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-4">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-4 py-1.5 rounded-full"
            style={{
              backgroundColor: '#ff4c4125',
              borderColor: '#ff4c41',
              border: '1px solid #ff4c4160',
            }}
          >
            🌍 Destinos Going
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 drop-shadow-md">
            Descubre Ecuador
          </h1>
          <p className="text-lg md:text-xl text-white/85 max-w-2xl drop-shadow">
            Desde las Islas Galápagos hasta la Amazonía. Playas, volcanes,
            selva, historia y cultura en un solo país.
          </p>
        </div>
      </section>

      {/* ─── Search bar ─────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 -mt-8 relative z-20 mb-10">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex gap-3">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar destino o región..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4c41] bg-gray-50"
            />
          </div>
          <button
            onClick={() => setSearchQ('')}
            className="px-6 py-3 rounded-xl font-bold text-white text-sm"
            style={{ backgroundColor: '#ff4c41' }}
          >
            Buscar
          </button>
        </div>
      </section>

      {/* ─── Destinos Destacados ─────────────────────────────── */}
      {!searchQ && activeRegion === 'Todos' && (
        <section className="max-w-6xl mx-auto px-4 mb-14">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            ⭐ Destinos Destacados
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {featured.map((dest) => (
              <div
                key={dest.id}
                className="group relative rounded-3xl overflow-hidden h-80 cursor-pointer shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                <img
                  src={dest.photo}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <span
                    className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-2 inline-block"
                    style={{ backgroundColor: dest.color }}
                  >
                    {dest.region}
                  </span>
                  <h3 className="text-2xl font-extrabold mb-1">{dest.name}</h3>
                  <p className="text-white/80 text-sm mb-3">{dest.tagline}</p>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-sm font-bold"
                      style={{ color: '#ffd253' }}
                    >
                      {dest.price}
                    </span>
                    <Link
                      href={`/services/tours`}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors hover:opacity-90"
                      style={{ backgroundColor: '#ff4c41' }}
                    >
                      Reservar tour →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Filtro por región ───────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((region) => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeRegion === region
                  ? 'text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-[#ff4c41] hover:text-[#ff4c41]'
              }`}
              style={
                activeRegion === region ? { backgroundColor: '#ff4c41' } : {}
              }
            >
              {region}
            </button>
          ))}
        </div>
      </section>

      {/* ─── Grid de destinos ───────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">
              No encontramos destinos con esa búsqueda.
            </p>
            <button
              onClick={() => {
                setSearchQ('');
                setActiveRegion('Todos');
              }}
              className="mt-4 px-6 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#ff4c41' }}
            >
              Ver todos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((dest) => (
              <div
                key={dest.id}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
              >
                {/* Photo */}
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={dest.photo}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{
                      background: `linear-gradient(to top, ${dest.color}, transparent)`,
                    }}
                  />
                  <span
                    className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full text-white"
                    style={{ backgroundColor: dest.color }}
                  >
                    {dest.region}
                  </span>
                  <span className="absolute bottom-3 right-3 text-xs font-bold bg-black/60 text-white px-2.5 py-1 rounded-full">
                    {dest.bestTime}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {dest.name}
                  </h3>
                  <p
                    className="text-sm font-medium mb-2"
                    style={{ color: dest.color }}
                  >
                    {dest.tagline}
                  </p>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                    {dest.description}
                  </p>

                  {/* Highlights */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {dest.highlights.map((h) => (
                      <span
                        key={h}
                        className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600"
                      >
                        {h}
                      </span>
                    ))}
                  </div>

                  {/* Activities */}
                  <div className="grid grid-cols-2 gap-1 mb-4">
                    {dest.activities.map((a) => (
                      <span key={a} className="text-xs text-gray-500">
                        {a}
                      </span>
                    ))}
                  </div>

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <span className="text-xs text-gray-400">Paquetes</span>
                      <p className="text-lg font-bold text-gray-900">
                        {dest.price}
                      </p>
                    </div>
                    <Link
                      href={`/services/tours`}
                      className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: '#ff4c41' }}
                    >
                      Ver tours →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── CTA ─────────────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ backgroundColor: '#011627' }}>
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-3">
            ¿No encuentras lo que buscas?
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Nuestros expertos locales diseñan itinerarios a tu medida para
            cualquier destino de Ecuador.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-8 py-4 font-bold rounded-xl text-sm hover:opacity-90 transition-all"
              style={{ backgroundColor: '#ff4c41', color: 'white' }}
            >
              Contactar un experto
            </Link>
            <Link
              href="/services/tours"
              className="px-8 py-4 border-2 border-white/30 text-white font-bold rounded-xl text-sm hover:border-white/60 hover:bg-white/5 transition-all"
            >
              Ver todos los tours
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
