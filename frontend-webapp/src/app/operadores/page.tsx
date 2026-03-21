'use client';
export const dynamic = 'force-dynamic';

import Link from 'next/link';

const ACTIVITIES = [
  { icon: '🥾', name: 'Trekking y Senderismo', areas: 'Cotopaxi, Chimborazo, Cajas, Antisana' },
  { icon: '🚣', name: 'Kayak y Rafting', areas: 'Río Toachi, Pastaza, Upano, Baños' },
  { icon: '🧗', name: 'Escalada y Montañismo', areas: 'Volcanes ecuatoriales, paredes de roca' },
  { icon: '🚵', name: 'Ciclismo de montaña', areas: 'Cotopaxi, Tungurahua, rutas del Andes' },
  { icon: '🤿', name: 'Buceo y Snorkel', areas: 'Galápagos, Salinas, Manta, Esmeraldas' },
  { icon: '🪂', name: 'Parapente y Canopy', areas: 'Baños, Alausi, Ruta del Sol' },
  { icon: '⛺', name: 'Camping y Glamping', areas: 'Laguna Quilotoa, Limoncocha, Napo' },
  { icon: '🦉', name: 'Birdwatching y Fauna', areas: 'Mindo, Amazonia, Galápagos' },
];

const BENEFITS = [
  { icon: '🌎', title: 'Acceso a viajeros globales', desc: 'Turistas de aventura internacionales buscan exactamente lo que tú ofreces. Going los conecta contigo.' },
  { icon: '📋', title: 'Gestión de grupos sin fricción', desc: 'App para confirmaciones, waivers digitales, comunicación pre-tour y check-in de participantes.' },
  { icon: '💳', title: 'Pagos en dólares, garantizados', desc: 'Cobras el 100% por adelantado. Sin problemas de no-shows. DATAFAST o transferencia.' },
  { icon: '🤝', title: 'Red de alianzas Going', desc: 'Conéctate con hoteles, guías y transportistas de la plataforma para crear paquetes completos.' },
  { icon: '📊', title: 'Analytics de tu negocio', desc: 'Ocupación, ingresos, demografía de clientes, reseñas y tendencias. Todo en un panel.' },
  { icon: '🛡️', title: 'Soporte en seguros y normativas', desc: 'Te orientamos sobre MINTUR, LUAE, seguros de responsabilidad civil y requisitos por actividad.' },
];

const REQUIREMENTS: { icon: string; item: string; note: string; required: boolean }[] = [
  { icon: '🪪', item: 'Cédula o RUC', note: 'Persona natural o jurídica', required: true },
  { icon: '🛡️', item: 'Seguro de responsabilidad civil', note: 'Obligatorio para actividades de riesgo', required: true },
  { icon: '📸', item: 'Foto de la actividad en operación', note: 'Transmite confianza a los viajeros', required: true },
  { icon: '📋', item: 'Registro Nacional de Turismo (RNT)', note: 'Recomendado — mayor visibilidad', required: false },
  { icon: '🎒', item: 'Inventario de equipos de seguridad', note: 'Cascos, arneses, botiquín, etc.', required: false },
];

const PACKS = [
  { name: 'Operador Básico', price: 'Gratis', color: '#6b7280', features: ['1 actividad listada', 'Hasta 50 plazas/mes', 'Pagos DATAFAST', 'Soporte por email'], cta: 'Empezar gratis' },
  { name: 'Operador Pro', price: '$29/mes', color: '#d97706', features: ['Actividades ilimitadas', 'Plazas ilimitadas', 'Panel de analytics', 'Badge verificado', 'Alianzas Going', 'Soporte prioritario'], cta: 'Activar Pro', highlight: true },
  { name: 'Agencia / Empresa', price: 'A convenir', color: '#ff4c41', features: ['Todo en Pro', 'Multi-usuario', 'API personalizada', 'Facturación corporativa', 'Account manager dedicado'], cta: 'Contactar ventas' },
];

export default function OperadoresPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <div className="relative text-white py-20 px-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #451a03 0%, #78350f 60%, #d9770620 100%)' }}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-5 bg-white -translate-y-1/2 translate-x-1/4" />
        <div className="max-w-5xl mx-auto relative z-10">
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: '#d9770622', color: '#fcd34d' }}>
            🧗 Operadores de Aventura Going
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Ecuador tiene<br />
            <span style={{ color: '#fbbf24' }}>aventuras sin límite.</span>
          </h1>
          <p className="text-amber-200 text-lg max-w-xl mb-8 leading-relaxed">
            Lleva a viajeros de todo el mundo a vivir lo más extremo y hermoso del Ecuador.
            Going gestiona las reservas, pagos y grupos para que tú te concentres en la experiencia.
          </p>
          <div className="flex flex-wrap gap-4 mb-10">
            <Link href="/auth/register?rol=operator"
              className="px-8 py-4 rounded-2xl font-bold text-white text-base hover:opacity-90 transition-opacity shadow-lg"
              style={{ backgroundColor: '#d97706' }}>
              Registrar mi operación →
            </Link>
            <a href="#actividades"
              className="px-8 py-4 rounded-2xl font-bold text-amber-200 border border-amber-700 hover:bg-amber-900 transition-colors text-base">
              Ver actividades
            </a>
          </div>
          <div className="flex flex-wrap gap-10">
            {[
              { value: '320+', label: 'Operadores activos' },
              { value: '$2,400', label: 'Ingreso top/mes' },
              { value: '18', label: 'Provincias cubiertas' },
              { value: '4.8 ★', label: 'Calificación media' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold" style={{ color: '#fbbf24' }}>{s.value}</div>
                <div className="text-amber-300 text-sm mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Actividades ── */}
      <div id="actividades" className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">Actividades que puedes ofrecer</h2>
          <p className="text-gray-500 text-center mb-10">Desde trekking en el Cotopaxi hasta buceo en Galápagos. Si Ecuador lo tiene, Going lo conecta.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {ACTIVITIES.map(a => (
              <div key={a.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow text-center">
                <div className="text-3xl mb-2">{a.icon}</div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{a.name}</h3>
                <p className="text-xs text-gray-400">{a.areas}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Beneficios ── */}
      <div className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">La plataforma que tu operación necesita</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map(b => (
              <div key={b.title} className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl flex-shrink-0">{b.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{b.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Requisitos ── */}
      <div className="py-16 px-6 bg-amber-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">¿Qué necesitas para unirte?</h2>
          <p className="text-gray-500 text-center text-sm mb-8">Solo 3 documentos obligatorios. El resto es opcional pero suma visibilidad.</p>
          <div className="space-y-3">
            {REQUIREMENTS.map(r => (
              <div key={r.item} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                <span className="text-2xl">{r.icon}</span>
                <div className="flex-1">
                  <span className="font-semibold text-gray-900 text-sm">{r.item}</span>
                  <span className="text-gray-400 text-xs ml-2">— {r.note}</span>
                </div>
                {r.required
                  ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold flex-shrink-0">Requerido</span>
                  : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">Opcional</span>
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Planes ── */}
      <div className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">Planes para cada tamaño</h2>
          <p className="text-gray-500 text-center mb-10">Empieza gratis. Crece cuando lo necesites.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PACKS.map(p => (
              <div key={p.name}
                className={`rounded-2xl border-2 p-6 relative ${p.highlight ? 'shadow-xl' : 'border-gray-100 shadow-sm'}`}
                style={p.highlight ? { borderColor: p.color } : {}}>
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: p.color }}>
                    Más popular
                  </span>
                )}
                <h3 className="font-bold text-gray-900 mb-1">{p.name}</h3>
                <p className="text-2xl font-bold mb-4" style={{ color: p.color }}>{p.price}</p>
                <ul className="space-y-2 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span style={{ color: p.color }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.name === 'Agencia / Empresa' ? '/contact' : '/auth/register?rol=operator'}
                  className="block w-full py-3 rounded-xl font-bold text-center text-sm hover:opacity-90 transition-opacity"
                  style={p.highlight ? { backgroundColor: p.color, color: 'white' } : { border: `2px solid ${p.color}`, color: p.color }}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="py-16 px-6" style={{ background: 'linear-gradient(135deg, #451a03 0%, #78350f 100%)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Empieza a recibir reservas esta semana</h2>
          <p className="text-amber-200 mb-8">Revisamos tu operación en 2–4 días hábiles. Sin complicaciones.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register?rol=operator"
              className="px-8 py-4 rounded-2xl font-bold text-white hover:opacity-90 transition-opacity shadow-lg text-base"
              style={{ backgroundColor: '#d97706' }}>
              Registrar mi operación →
            </Link>
            <Link href="/operadores/registro"
              className="px-8 py-4 rounded-2xl font-bold text-amber-200 border border-amber-700 hover:bg-amber-900 transition-colors text-base">
              Ya tengo cuenta — activar perfil
            </Link>
          </div>
          <p className="text-amber-500 text-xs mt-6">¿Preguntas? <span className="text-amber-300">operadores@goingec.com</span></p>
        </div>
      </div>

    </div>
  );
}
