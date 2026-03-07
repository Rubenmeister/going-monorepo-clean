import React from 'react';
import Link from 'next/link';

// ── EDITABLE CONTENT ───────────────────────────────────────────────
const STORY = {
  title: 'Nuestra Historia',
  paragraphs: [
    'Going nació en Ecuador con una visión simple: conectar a las personas con los mejores destinos, servicios y experiencias de su país, todo desde una sola plataforma.',
    'Fundada por ecuatorianos apasionados por el turismo y la tecnología, Going reúne transporte, alojamiento, tours, experiencias, envíos y pagos en un ecosistema digital que funciona para viajeros, anfitriones y conductores por igual.',
    'Hoy operamos en las cuatro regiones del Ecuador — Sierra, Costa, Amazonía y Galápagos — con el compromiso de impulsar el turismo local, generar oportunidades y poner a Ecuador en el mapa del viajero moderno.',
  ],
};

const VALUES = [
  {
    icon: '🎯',
    title: 'Misión',
    desc: 'Conectar a cada viajero con lo mejor de Ecuador: transporte seguro, alojamiento verificado, tours auténticos y experiencias que transforman.',
    color: '#ff4c41',
  },
  {
    icon: '🌍',
    title: 'Visión',
    desc: 'Ser la plataforma de viajes y movilidad de referencia en América Latina, poniendo a Ecuador como destino ineludible del continente.',
    color: '#0ea5e9',
  },
  {
    icon: '💚',
    title: 'Impacto',
    desc: 'Generamos empleo local, apoyamos a comunidades indígenas y promovemos el turismo sostenible en cada rincón del país.',
    color: '#22C55E',
  },
];

const STATS = [
  { number: '4', label: 'Regiones del Ecuador' },
  { number: '2,400+', label: 'Proveedores activos' },
  { number: '15,000+', label: 'Viajeros atendidos' },
  { number: '4.9 ★', label: 'Calificación promedio' },
];

const TEAM_VALUES = [
  {
    icon: '🤝',
    title: 'Confianza',
    desc: 'Cada proveedor y conductor pasa por verificación rigurosa antes de unirse a nuestra red.',
  },
  {
    icon: '🔒',
    title: 'Seguridad',
    desc: 'Seguimiento GPS en tiempo real, pagos protegidos y soporte 24/7 para todos nuestros usuarios.',
  },
  {
    icon: '🌱',
    title: 'Sostenibilidad',
    desc: 'Promovemos el turismo responsable, apoyamos eco-lodges y compensamos nuestra huella de carbono.',
  },
  {
    icon: '🏆',
    title: 'Excelencia',
    desc: 'Nos obsesiona la calidad. Si algo no cumple nuestro estándar, lo mejoramos antes de ofrecerlo.',
  },
  {
    icon: '🧑‍🤝‍🧑',
    title: 'Comunidad',
    desc: 'Trabajamos de la mano con comunidades indígenas y rurales para que el turismo les beneficie directamente.',
  },
  {
    icon: '💡',
    title: 'Innovación',
    desc: 'Tecnología ecuatoriana al servicio del viajero: app móvil, reservas en tiempo real y soporte con IA.',
  },
];

const SERVICES_SUMMARY = [
  { icon: '🚗', label: 'Transporte', href: '/services/transport' },
  { icon: '🏨', label: 'Alojamiento', href: '/services/accommodation' },
  { icon: '🗺️', label: 'Tours', href: '/services/tours' },
  { icon: '🎭', label: 'Experiencias', href: '/services/experiences' },
  { icon: '📦', label: 'Envíos', href: '/services' },
  { icon: '🎓', label: 'Academia', href: '/academy' },
];
// ── END EDITABLE CONTENT ───────────────────────────────────────────

export const metadata = {
  title: 'Sobre Going | La plataforma de viajes de Ecuador',
  description:
    'Conoce la historia, misión y valores de Going — la plataforma que conecta a viajeros con lo mejor de Ecuador.',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section
        className="relative py-28 px-4 text-white text-center overflow-hidden"
        style={{ backgroundColor: '#011627' }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white opacity-5 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-white opacity-5 translate-y-1/2 -translate-x-1/3" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{
            background: 'radial-gradient(circle, #ff4c41, transparent)',
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold mb-6 border border-white/20 text-white/70 tracking-widest uppercase">
            Hecho en Ecuador 🇪🇨
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Conoce <span style={{ color: '#ff4c41' }}>Going</span>
          </h1>
          <p className="text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
            La plataforma que conecta a viajeros, anfitriones y conductores con
            lo mejor de los cuatro mundos de Ecuador.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-bold" style={{ color: '#ff4c41' }}>
                {s.number}
              </div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="max-w-6xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            {STORY.title}
          </h2>
          {STORY.paragraphs.map((p, i) => (
            <p key={i} className="text-gray-500 leading-relaxed mb-4 text-lg">
              {p}
            </p>
          ))}
          <div className="flex gap-4 mt-8">
            <Link
              href="/services"
              className="px-6 py-3 text-white font-bold rounded-xl text-sm transition-all hover:shadow-md"
              style={{ backgroundColor: '#ff4c41' }}
            >
              Ver nuestros servicios
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 font-bold rounded-xl text-sm border-2 transition-all"
              style={{ borderColor: '#ff4c41', color: '#ff4c41' }}
            >
              Contáctanos
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
            <img
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&auto=format"
              alt="Ecuador paisaje"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-5 -left-5 w-32 h-32 rounded-2xl shadow-xl overflow-hidden border-4 border-white">
            <img
              src="https://images.unsplash.com/photo-1547550332-b31d9d7d82ef?w=300&q=80&auto=format"
              alt="Amazonia"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -top-5 -right-5 w-28 h-28 rounded-2xl shadow-xl overflow-hidden border-4 border-white">
            <img
              src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300&q=80&auto=format"
              alt="Galapagos"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Mission / Vision / Impact */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Lo que nos mueve
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center"
              >
                <div className="text-5xl mb-5">{v.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {v.title}
                </h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  {v.desc}
                </p>
                <div
                  className="w-12 h-1 rounded-full mx-auto mt-6"
                  style={{ backgroundColor: v.color }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
          Nuestros valores
        </h2>
        <p className="text-gray-500 text-center mb-12 text-lg">
          Los principios que guían cada decisión en Going
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEAM_VALUES.map((v) => (
            <div
              key={v.title}
              className="flex gap-4 p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-red-100 hover:bg-red-50/30 transition-all"
            >
              <div className="text-3xl flex-shrink-0">{v.icon}</div>
              <div>
                <div className="font-bold text-gray-900 mb-1">{v.title}</div>
                <div className="text-sm text-gray-500 leading-relaxed">
                  {v.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services we offer */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Todo lo que Going ofrece
          </h2>
          <p className="text-gray-500 mb-10">
            Un ecosistema completo para tu viaje por Ecuador
          </p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {SERVICES_SUMMARY.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-red-200 hover:shadow-md transition-all group"
              >
                <span className="text-3xl">{s.icon}</span>
                <span className="text-xs font-semibold text-gray-600 group-hover:text-[#ff4c41] transition-colors">
                  {s.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-20 px-4 text-center text-white"
        style={{ backgroundColor: '#011627' }}
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">
            ¿Listo para explorar Ecuador?
          </h2>
          <p className="text-white/70 mb-10 text-lg">
            Únete a la comunidad Going y descubre el país como nunca antes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-4 font-bold rounded-xl text-white text-sm transition-all hover:shadow-lg"
              style={{ backgroundColor: '#ff4c41' }}
            >
              Crear cuenta gratis
            </Link>
            <Link
              href="/destinations"
              className="px-8 py-4 border-2 border-white/30 font-bold rounded-xl text-white hover:border-white transition-all text-sm"
            >
              Explorar destinos
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
