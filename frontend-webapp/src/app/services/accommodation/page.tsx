'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

// ── API MAPPING ───────────────────────────────────────────────────────
function mapApiAccommodation(a: any) {
  return {
    icon: '🏠',
    name: a.title,
    tagline: a.location?.city ? `${a.location.city}, Ecuador` : 'Ecuador',
    desc: a.description,
    features: (a.amenities ?? []).slice(0, 4),
    price: `Desde $${a.pricePerNight?.amount ?? 0}/noche`,
    photo:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80&auto=format',
    color: '#10B981',
  };
}

// ── FALLBACK DATA (visible mientras la API carga o si está vacía) ─────
const ACCOMMODATION_TYPES_FALLBACK = [
  {
    icon: '🏨',
    name: 'Hoteles',
    tagline: 'Confort y servicio de primera',
    desc: 'Hoteles urbanos y de resort en las principales ciudades de Ecuador. Habitaciones equipadas, servicio de habitaciones, piscina y restaurante incluidos en muchas opciones.',
    features: [
      'Desayuno incluido',
      'Wi-Fi de alta velocidad',
      'Servicio 24/7',
      'Estacionamiento gratuito',
    ],
    price: 'Desde $45/noche',
    photo:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80&auto=format',
    color: '#10B981',
  },
  {
    icon: '🏡',
    name: 'Hostales',
    tagline: 'La opción del viajero inteligente',
    desc: 'Alojamiento económico en ambiente social y acogedor. Ideal para mochileros y viajeros independientes. Habitaciones privadas y dormitorios compartidos.',
    features: [
      'Cocina compartida',
      'Área de coworking',
      'Tours organizados',
      'Ambiente multicultural',
    ],
    price: 'Desde $12/noche',
    photo:
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80&auto=format',
    color: '#F59E0B',
  },
  {
    icon: '🏠',
    name: 'Cabañas',
    tagline: 'Naturaleza en estado puro',
    desc: 'Estancias rústicas inmersas en la naturaleza ecuatoriana. Bosques nublados, volcanes, haciendas coloniales y reservas naturales a tu alcance.',
    features: [
      'Rodeadas de naturaleza',
      'Chimenea o fogata',
      'Actividades al aire libre',
      'Gastronomía local',
    ],
    price: 'Desde $65/noche',
    photo:
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=600&q=80&auto=format',
    color: '#8B5CF6',
  },
  {
    icon: '🌴',
    name: 'Resorts',
    tagline: 'Vacaciones sin preocupaciones',
    desc: 'Complejos todo incluido en las costas del Pacífico y las Islas Galápagos. Relajación total con spa, playa privada, deportes acuáticos y gastronomía de autor.',
    features: [
      'Todo incluido disponible',
      'Spa y bienestar',
      'Actividades acuáticas',
      'Atención personalizada',
    ],
    price: 'Desde $150/noche',
    photo:
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80&auto=format',
    color: '#0ea5e9',
  },
  {
    icon: '🏰',
    name: 'Haciendas',
    tagline: 'Historia y tradición ecuatoriana',
    desc: 'Haciendas coloniales del siglo XVI y XVII convertidas en boutique hotels de lujo. Caballos, hornado al carbón, chimeneas y vistas al volcán.',
    features: [
      'Arquitectura colonial',
      'Equitación incluida',
      'Gastronomía tradicional',
      'Vista a volcanes',
    ],
    price: 'Desde $120/noche',
    photo:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80&auto=format',
    color: '#EF4444',
  },
  {
    icon: '🛖',
    name: 'Eco-Lodges',
    tagline: 'Turismo sostenible y consciente',
    desc: 'Alojamientos eco-amigables en la Amazonía, bosque nublado y Galápagos. Construcción con materiales locales, energía renovable y cero residuos.',
    features: [
      'Energía solar',
      'Guías nativos',
      'Fauna y flora única',
      'Certificación verde',
    ],
    price: 'Desde $80/noche',
    photo:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80&auto=format',
    color: '#22C55E',
  },
];

const STATS = [
  { number: '2,400+', label: 'Propiedades verificadas' },
  { number: '98%', label: 'Satisfacción de huéspedes' },
  { number: '24 h', label: 'Soporte al cliente' },
  { number: '0 %', label: 'Comisión oculta' },
];

const BENEFITS = [
  {
    icon: '✓',
    title: 'Anfitriones verificados',
    desc: 'Cada propiedad pasa por revisión física y documental antes de publicarse.',
  },
  {
    icon: '✓',
    title: 'Mejores tarifas garantizadas',
    desc: 'Si encuentras el mismo alojamiento más barato en otro sitio, te igualamos el precio.',
  },
  {
    icon: '✓',
    title: 'Cancelación flexible',
    desc: 'Cancela hasta 24 horas antes sin cargo en la mayoría de propiedades.',
  },
  {
    icon: '✓',
    title: 'Fotos reales del espacio',
    desc: 'Todas las fotografías son verificadas por nuestro equipo — sin sorpresas al llegar.',
  },
];
// ── END CONTENT ───────────────────────────────────────────────────────

export default function AccommodationPage() {
  const [items, setItems] = useState(ACCOMMODATION_TYPES_FALLBACK);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;
    fetch(`${apiUrl}/accommodations/search`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0)
          setItems(data.map(mapApiAccommodation));
      })
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section
        className="relative py-20 px-4 text-white text-center overflow-hidden"
        style={{ backgroundColor: '#011627' }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white opacity-5 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white opacity-5 translate-y-1/2 -translate-x-1/3" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="text-5xl mb-4">🏨</div>
          <h1 className="text-5xl font-bold mb-4">Alojamiento en Ecuador</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Desde hostales económicos hasta haciendas coloniales de lujo.
            Encuentra tu refugio perfecto en cualquier rincón del país.
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

      {/* Accommodation Types */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Tipos de alojamiento
        </h2>
        <p className="text-gray-500 text-center mb-10">
          Elige el estilo que más se adapte a tu viaje
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item) => (
            <div
              key={item.name}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group"
            >
              {/* Photo */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={item.photo}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0 opacity-50"
                  style={{
                    background: `linear-gradient(to top, ${item.color}, transparent)`,
                  }}
                />
                <div className="absolute bottom-3 left-4 text-3xl">
                  {item.icon}
                </div>
                <div
                  className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full"
                  style={{ color: item.color }}
                >
                  {item.price}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {item.name}
                </h3>
                <p
                  className="text-xs font-semibold mb-3"
                  style={{ color: '#ff4c41' }}
                >
                  {item.tagline}
                </p>
                <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                  {item.desc}
                </p>

                {item.features.length > 0 && (
                  <ul className="space-y-1.5 mb-5">
                    {item.features.map((f) => (
                      <li
                        key={f}
                        className="text-sm text-gray-600 flex items-center gap-2"
                      >
                        <span
                          className="font-bold text-xs"
                          style={{ color: '#ff4c41' }}
                        >
                          ✓
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  className="w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:shadow-md"
                  style={{ backgroundColor: '#ff4c41' }}
                >
                  Ver {item.name}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
            ¿Por qué reservar con Going?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="flex gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: '#ff4c41' }}
                >
                  {b.icon}
                </div>
                <div>
                  <div className="font-bold text-gray-900 mb-1">{b.title}</div>
                  <div className="text-sm text-gray-500 leading-relaxed">
                    {b.desc}
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
            ¿Listo para reservar tu estadía?
          </h2>
          <p className="text-white/70 mb-8 text-lg">
            Más de 2,400 propiedades verificadas te esperan en todo Ecuador.
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
              href="/services"
              className="px-8 py-3.5 border-2 border-white/30 font-bold rounded-xl text-white hover:border-white transition-all text-sm"
            >
              Ver todos los servicios
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
