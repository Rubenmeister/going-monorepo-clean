'use client';
export const dynamic = 'force-dynamic';

import Link from 'next/link';

const BENEFITS = [
  { icon: '🗺️', title: 'Diseña tus propios tours', desc: 'Crea experiencias únicas con tu itinerario, precio, idioma y cupo máximo.' },
  { icon: '🌍', title: 'Viajeros internacionales', desc: 'Going te conecta con turistas de 40+ países que buscan guías locales auténticos.' },
  { icon: '💰', title: 'Fija tus tarifas', desc: 'Tú decides cuánto cobras. Sin comisiones ocultas — Going cobra solo el 15% al cierre.' },
  { icon: '🧳', title: 'Gestión de grupos', desc: 'La app maneja reservas, pagos y comunicación con el grupo antes y durante el tour.' },
  { icon: '📚', title: 'Academia Going gratuita', desc: 'Cursos de storytelling, manejo de grupos, seguridad exterior e inglés turístico.' },
  { icon: '⭐', title: 'Reputación visible', desc: 'Tu calificación y reseñas son públicas. Un buen perfil llena tu agenda solo.' },
];

const TOUR_TYPES = [
  { icon: '🏛️', type: 'Cultural / Histórico', examples: 'Centro histórico, museos, iglesias, mitad del mundo', color: '#7c3aed' },
  { icon: '🌿', type: 'Naturaleza y Aves', examples: 'Páramos, reservas, observación de flora y fauna nativa', color: '#059669' },
  { icon: '🧗', type: 'Aventura y Deportes', examples: 'Trekking, escalada, ciclismo, rafting de día', color: '#dc2626' },
  { icon: '🍽️', type: 'Gastronómico', examples: 'Mercados, cocina tradicional, fincas productoras, cevicherías', color: '#d97706' },
  { icon: '🤝', type: 'Turismo Comunitario', examples: 'Comunidades indígenas, tejidos, ritmos y danza, cacao', color: '#0891b2' },
  { icon: '📷', type: 'Fotográfico', examples: 'Amanecer en volcán, mercados coloridos, fauna silvestre', color: '#7c3aed' },
];

const LEVELS = [
  { icon: '🌱', title: 'Guía Local Comunitario', req: 'Sin licencia requerida', desc: 'Puedes operar tours en tu comunidad o barrio sin licencia. Ideal para empezar.' },
  { icon: '📋', title: 'Guía Nacional', req: 'Licencia MINTUR', desc: 'Opera tours en cualquier parte del Ecuador. Mayor visibilidad en la plataforma.' },
  { icon: '🌐', title: 'Guía Internacional', req: 'Licencia MINTUR + idioma certificado', desc: 'Atiende grupos internacionales. Las tarifas más altas de la plataforma.' },
];

const TESTIMONIALS = [
  { name: 'Andrés V.', city: 'Quito', type: 'Guía cultural', earn: '$1,400/mes', quote: 'Paso de vender mis tours en Instagram a tener una agenda llena. Going me da visibilidad con turistas que de otra forma no me encontrarían.' },
  { name: 'Karina T.', city: 'Amazonia', type: 'Ecoturismo', earn: '$2,100/mes', quote: 'Mis tours de biodiversidad amazónica son los más reservados de mi zona. Turistas de Alemania, Francia y EE.UU.' },
];

export default function GuiasPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <div className="relative text-white py-20 px-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #075985 60%, #0891b230 100%)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5 bg-white -translate-y-1/2 translate-x-1/4" />
        <div className="max-w-5xl mx-auto relative z-10">
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: '#0891b233', color: '#67e8f9' }}>
            🏺 Guías Locales Going
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Ecuador te pertenece.<br />
            <span style={{ color: '#67e8f9' }}>Muéstralo al mundo.</span>
          </h1>
          <p className="text-cyan-200 text-lg max-w-xl mb-8 leading-relaxed">
            Convierte tu conocimiento local en una carrera. Diseña tours únicos, recibe
            viajeros internacionales y gana lo que mereces.
          </p>
          <div className="flex flex-wrap gap-4 mb-10">
            <Link href="/auth/register?rol=guide"
              className="px-8 py-4 rounded-2xl font-bold text-white text-base hover:opacity-90 transition-opacity shadow-lg"
              style={{ backgroundColor: '#0891b2' }}>
              Registrarme como guía →
            </Link>
            <a href="#tour-types"
              className="px-8 py-4 rounded-2xl font-bold text-cyan-200 border border-cyan-700 hover:bg-cyan-900 transition-colors text-base">
              Ver tipos de tours
            </a>
          </div>
          <div className="flex flex-wrap gap-10">
            {[
              { value: '840+', label: 'Guías activos' },
              { value: '$1,100', label: 'Ingreso promedio' },
              { value: '40+', label: 'Países de viajeros' },
              { value: '4.9 ★', label: 'Calificación media' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold" style={{ color: '#67e8f9' }}>{s.value}</div>
                <div className="text-cyan-300 text-sm mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tipos de tour ── */}
      <div id="tour-types" className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">¿Qué tipo de tours puedes ofrecer?</h2>
          <p className="text-gray-500 text-center mb-10">Cualquier formato que sea tuyo y auténtico tiene demanda en Going.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TOUR_TYPES.map(t => (
              <div key={t.type} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <span className="text-3xl">{t.icon}</span>
                <h3 className="font-bold text-gray-900 mt-2 mb-1">{t.type}</h3>
                <p className="text-xs text-gray-400">{t.examples}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Niveles de guía ── */}
      <div className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Tres niveles, una plataforma</h2>
          <p className="text-gray-500 text-center mb-10">Empieza sin licencia y crece con nosotros.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {LEVELS.map(l => (
              <div key={l.title} className="rounded-2xl border-2 border-cyan-100 bg-cyan-50 p-6 text-center">
                <div className="text-4xl mb-3">{l.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{l.title}</h3>
                <span className="inline-block text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-semibold mb-3">{l.req}</span>
                <p className="text-gray-500 text-sm">{l.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Beneficios ── */}
      <div className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Todo lo que necesitas para operar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map(b => (
              <div key={b.title} className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center text-2xl flex-shrink-0">{b.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{b.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Testimonios ── */}
      <div className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Guías que ya trabajan con Going</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white"
                    style={{ backgroundColor: '#0891b2' }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.type} · {t.city}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4 italic leading-relaxed">"{t.quote}"</p>
                <span className="text-sm font-bold" style={{ color: '#0891b2' }}>{t.earn}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA final ── */}
      <div className="py-16 px-6" style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #075985 100%)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Empieza a guiar desde esta semana</h2>
          <p className="text-cyan-200 mb-8">El proceso de activación toma 24–48 horas. Sin burocracia.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register?rol=guide"
              className="px-8 py-4 rounded-2xl font-bold text-white hover:opacity-90 transition-opacity shadow-lg text-base"
              style={{ backgroundColor: '#0891b2' }}>
              Registrarme como guía →
            </Link>
            <Link href="/guias/registro"
              className="px-8 py-4 rounded-2xl font-bold text-cyan-200 border border-cyan-700 hover:bg-cyan-900 transition-colors text-base">
              Ya tengo cuenta — activar perfil
            </Link>
          </div>
          <p className="text-cyan-500 text-xs mt-6">¿Dudas? <span className="text-cyan-300">guias@goingec.com</span></p>
        </div>
      </div>

    </div>
  );
}
