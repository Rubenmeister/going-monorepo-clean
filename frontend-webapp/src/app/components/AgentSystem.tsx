/* Sección "La tecnología detrás de Going" — el sistema agéntico (cerebro + 7
   agentes, nombres en kichwa) para el final del home de la webapp. Estática.
   Paleta de marca (design-tokens): azul #0033A0 = el cerebro (pensar),
   coral #FF4C41 = los agentes (actuar). Serif para los nombres ancestrales. */

const BRAIN = [
  { name: 'Pacha', meaning: 'el todo, la Pachamama', verb: 'Percibe',
    role: 'Reúne las señales de los siete agentes en una foto del mundo, cada pocos minutos.' },
  { name: 'Yachay', meaning: 'el saber', verb: 'Piensa',
    role: 'La capa con inteligencia artificial: lee la foto del mundo, razona y propone qué hacer.' },
  { name: 'Wayra', meaning: 'el viento', verb: 'Decide',
    role: 'Ejecuta con permisos; lo delicado —dinero, precios— siempre espera el visto bueno humano.' },
  { name: 'Chaski', meaning: 'el mensajero', verb: 'Reparte',
    role: 'Lleva cada orden al agente correcto, como los chaskis llevaban los mensajes del inca.' },
];

const AGENTS = [
  { name: 'Sacha', meaning: 'la selva', role: 'El producto: el pulso de los viajes, la oferta y la demanda.' },
  { name: 'Rumi', meaning: 'la piedra', role: 'Operaciones: incidencias y reasignación automática de viajes.' },
  { name: 'Inti', meaning: 'el sol', role: 'Finanzas: comisiones, conciliación, facturación y control de fraude.' },
  { name: 'Killa', meaning: 'la luna', role: 'Contenido: noticias, blog y revista, siempre con fotografía.' },
  { name: 'Sumak', meaning: 'lo hermoso', role: 'Marketing: publicaciones en redes y campañas para atraer viajes.' },
  { name: 'Quinde', meaning: 'el colibrí', role: 'Móvil: la app, sus caídas y su salud en las tiendas.' },
  { name: 'Kuntur', meaning: 'el cóndor', role: 'Web: despliegues y disponibilidad de los sitios públicos.' },
];

const CYCLE = ['Los agentes ven', 'Pacha reúne', 'Yachay razona', 'Wayra decide', 'Chaski entrega', 'el agente actúa'];

const NAVY = '#0033A0';
const CORAL = '#FF4C41';

export function AgentSystem() {
  return (
    <section className="bg-[#F9FAFB] py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="max-w-2xl mb-14">
          <div className="text-[11px] font-black tracking-[3px] uppercase mb-2.5" style={{ color: CORAL }}>
            Tecnología hecha en Ecuador
          </div>
          <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-black text-gray-900 leading-tight mb-5">
            Un cerebro y siete agentes
          </h2>
          <p className="text-[15px] text-gray-500 leading-relaxed">
            Going se opera con un sistema propio en dos planos: un <strong className="text-gray-900 font-bold">cerebro</strong> de
            cuatro capas que percibe, razona y decide, y <strong className="text-gray-900 font-bold">siete agentes</strong> que
            vigilan y actúan cada uno en su dominio. Todos llevan nombre en kichwa.
          </p>
        </div>

        {/* El cerebro — azul */}
        <div className="text-[11px] font-black tracking-[2px] uppercase text-gray-400 mb-4">
          El cerebro · cuatro capas
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {BRAIN.map((c) => (
            <div key={c.name} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col">
              <div className="text-[10px] font-black tracking-[2px] uppercase text-gray-400 mb-1">{c.verb}</div>
              <div className="font-serif text-[26px] font-black leading-none" style={{ color: NAVY }}>{c.name}</div>
              <div className="font-serif italic text-[14px] text-gray-400 mb-2.5">{c.meaning}</div>
              <p className="text-[13px] text-gray-600 leading-relaxed">{c.role}</p>
            </div>
          ))}
        </div>

        {/* Los agentes — coral */}
        <div className="text-[11px] font-black tracking-[2px] uppercase mb-4" style={{ color: CORAL }}>
          Los siete agentes
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {AGENTS.map((a) => (
            <div key={a.name} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col">
              <div className="font-serif text-[26px] font-black leading-none" style={{ color: CORAL }}>{a.name}</div>
              <div className="font-serif italic text-[14px] text-gray-400 mb-2.5">{a.meaning}</div>
              <p className="text-[13px] text-gray-600 leading-relaxed">{a.role}</p>
            </div>
          ))}
        </div>

        {/* El ciclo */}
        <div className="text-[11px] font-black tracking-[2px] uppercase text-gray-400 mb-4">
          El ciclo, de punta a punta
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {CYCLE.map((step, i) => (
            <span key={step} className="flex items-center gap-2">
              <span className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-[13px] text-gray-700">
                {step}
              </span>
              {i < CYCLE.length - 1 && <span className="text-gray-300 font-black">›</span>}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
