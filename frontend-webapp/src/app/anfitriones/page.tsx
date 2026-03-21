'use client';
export const dynamic = 'force-dynamic';

import Link from 'next/link';

const BENEFITS = [
  { icon: '💰', title: 'Ingresos extras reales', desc: 'Hosts ecuatorianos ganan entre $400 y $2,000/mes dependiendo del tipo y ubicación del espacio.' },
  { icon: '📅', title: 'Tú controlas tu calendario', desc: 'Bloquea fechas cuando quieras. Sin compromisos fijos ni mínimos de disponibilidad.' },
  { icon: '🛡️', title: 'Pagos seguros', desc: 'Cobras antes de que llegue el huésped. DATAFAST o transferencia directa a tu cuenta.' },
  { icon: '⭐', title: 'Perfil verificado', desc: 'Nuestro equipo verifica tu espacio y documentos. Eso genera confianza y más reservas.' },
  { icon: '🌍', title: 'Viajeros internacionales', desc: 'Going conecta con turistas de LATAM, Europa y EE.UU que buscan experiencias auténticas en Ecuador.' },
  { icon: '📚', title: 'Academia gratuita', desc: 'Cursos de fotografía, limpieza profesional, reseñas y diseño de espacios. Todo gratis.' },
];

const PROPERTY_TYPES = [
  { icon: '🏠', type: 'Casa completa', range: '$45–$150/noche', desc: 'El espacio ideal para familias y grupos. Alta demanda en temporadas.' },
  { icon: '🏢', type: 'Apartamento', range: '$25–$90/noche', desc: 'Perfecto para viajeros de negocios y turistas independientes.' },
  { icon: '🏕️', type: 'Cabaña / Glamping', range: '$60–$200/noche', desc: 'Los espacios más buscados por turistas extranjeros en Ecuador.' },
  { icon: '🌿', type: 'Finca / Hacienda', range: '$80–$300/noche', desc: 'Experiencias únicas de agro-turismo y contacto con la naturaleza.' },
  { icon: '🏡', type: 'Habitación privada', range: '$15–$45/noche', desc: 'Ideal para empezar. Hospedar sin entregar toda tu casa.' },
  { icon: '🏨', type: 'Hostal / Lodge', range: '$20–$60/noche por hab.', desc: 'Para establecimientos con múltiples habitaciones.' },
];

const STEPS = [
  { n: 1, icon: '📝', title: 'Crea tu cuenta', desc: 'Regístrate como Anfitrión en menos de 2 minutos.' },
  { n: 2, icon: '🏠', title: 'Describe tu espacio', desc: 'Tipo, comodidades, precio y fotos. Nuestro equipo te ayuda si lo necesitas.' },
  { n: 3, icon: '📋', title: 'Verifica documentos', desc: 'Cédula y título de propiedad. Proceso 100% digital, 2–3 días hábiles.' },
  { n: 4, icon: '🎉', title: 'Empieza a recibir reservas', desc: 'Tu listing aparece en Going y empiezas a ganar desde la primera noche.' },
];

const TESTIMONIALS = [
  { name: 'Carmen R.', city: 'Cuenca', type: 'Casa colonial', earn: '$1,200/mes', quote: 'En 6 meses llenamos el calendario casi todos los fines de semana. Los turistas extranjeros adoran el centro histórico.', stars: 5 },
  { name: 'Diego M.', city: 'Tena', type: 'Cabaña amazónica', earn: '$1,800/mes', quote: 'Tenía la cabaña desocupada. Ahora es mi principal fuente de ingresos. Los viajeros de aventura pagan muy bien.', stars: 5 },
  { name: 'Sofía L.', city: 'Quito Norte', type: 'Apartamento', earn: '$680/mes', quote: 'Fácil de manejar desde la app. Los pagos siempre a tiempo y el soporte de Going es excelente.', stars: 5 },
];

export default function AnfitrionesPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <div className="relative text-white py-20 px-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #7c3aed30 100%)' }}>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 w-96 h-96 rounded-full bg-white -translate-y-1/4 translate-x-1/4" />
          <div className="absolute bottom-0 left-10 w-64 h-64 rounded-full bg-white" />
        </div>
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-10">
          {/* Texto */}
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: '#7c3aed33', color: '#a78bfa' }}>
              🏡 Anfitriones Going
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              Tu espacio es<br />
              <span style={{ color: '#a78bfa' }}>una oportunidad.</span>
            </h1>
            <p className="text-purple-200 text-lg max-w-xl mb-8 leading-relaxed">
              Convierte tu casa, cabaña o habitación en una fuente de ingresos constante.
              Conectamos viajeros verificados con los mejores espacios del Ecuador.
            </p>
            <div className="flex flex-wrap gap-4 mb-10 justify-center md:justify-start">
              <Link href="/auth/register?rol=host"
                className="px-8 py-4 rounded-2xl font-bold text-white text-base hover:opacity-90 transition-opacity shadow-lg"
                style={{ backgroundColor: '#7c3aed' }}>
                Publicar mi espacio →
              </Link>
              <a href="#como-funciona"
                className="px-8 py-4 rounded-2xl font-bold text-purple-200 border border-purple-600 hover:bg-purple-900 transition-colors text-base">
                ¿Cómo funciona?
              </a>
            </div>
            <div className="flex flex-wrap gap-10 justify-center md:justify-start">
              {[
                { value: '3,200+', label: 'Hosts activos' },
                { value: '$920', label: 'Promedio mensual' },
                { value: '4.8 ★', label: 'Calificación media' },
                { value: '48 h', label: 'Tiempo de activación' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl font-bold" style={{ color: '#a78bfa' }}>{s.value}</div>
                  <div className="text-purple-300 text-sm mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Imagen */}
          <div className="flex-1 w-full md:max-w-md">
            <img
              src="/images/Going homes.png"
              alt="Going Homes – alojamientos en Ecuador"
              className="w-full rounded-3xl shadow-2xl object-cover"
              style={{ maxHeight: '440px' }}
            />
          </div>
        </div>
      </div>

      {/* ── Tipos de alojamiento ── */}
      <div className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">¿Qué puedes publicar?</h2>
          <p className="text-gray-500 text-center mb-10">Desde una habitación hasta una hacienda — todo tiene demanda en Going.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PROPERTY_TYPES.map(pt => (
              <div key={pt.type} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-3">{pt.icon}</div>
                <h3 className="font-bold text-gray-900 mb-0.5">{pt.type}</h3>
                <p className="text-sm font-semibold mb-2" style={{ color: '#7c3aed' }}>{pt.range}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{pt.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Beneficios ── */}
      <div className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Por qué Going es diferente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map(b => (
              <div key={b.title} className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 bg-purple-50">{b.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{b.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Cómo funciona ── */}
      <div id="como-funciona" className="py-16 px-6 bg-purple-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">En 4 pasos empiezas a ganar</h2>
          <div className="space-y-6">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex gap-5 items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
                    style={{ backgroundColor: '#7c3aed' }}>
                    {s.n}
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="font-bold text-gray-900 mb-1">{s.icon} {s.title}</h3>
                  <p className="text-gray-500 text-sm">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="absolute mt-14 ml-6 w-0.5 h-6 bg-purple-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Testimonios ── */}
      <div className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Hosts que ya están ganando</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white"
                    style={{ backgroundColor: '#7c3aed' }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.type} · {t.city}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed italic">"{t.quote}"</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-yellow-500">{'★'.repeat(t.stars)}</span>
                  <span className="text-sm font-bold" style={{ color: '#7c3aed' }}>{t.earn}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA final ── */}
      <div className="py-16 px-6" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">¿Listo para publicar tu espacio?</h2>
          <p className="text-purple-200 mb-8">Únete a más de 3,200 hosts que ya generan ingresos con Going.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register?rol=host"
              className="px-8 py-4 rounded-2xl font-bold text-white hover:opacity-90 transition-opacity shadow-lg text-base"
              style={{ backgroundColor: '#7c3aed' }}>
              Publicar mi espacio →
            </Link>
            <Link href="/anfitriones/registro"
              className="px-8 py-4 rounded-2xl font-bold text-purple-200 border border-purple-600 hover:bg-purple-900 transition-colors text-base">
              Ya tengo cuenta — activar perfil
            </Link>
          </div>
          <p className="text-purple-400 text-xs mt-6">¿Preguntas? Escríbenos a <span className="text-purple-300">anfitriones@goingec.com</span></p>
        </div>
      </div>

    </div>
  );
}
