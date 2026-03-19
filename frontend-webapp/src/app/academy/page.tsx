'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';

/* ─────────────────────────────────────────────
   TRONCO COMÚN — obligatorio para todos los roles
   ───────────────────────────────────────────── */
const TRONCO_COMUN = [
  {
    id: 'tc1',
    icon: '🌍',
    title: 'El ADN de Going',
    subtitle: 'Filosofía y hospitalidad ecuatoriana',
    desc: 'La misión de Going, hospitalidad ecuatoriana, empatía, resolución pacífica de problemas y por qué somos embajadores del país.',
    duration: '15 min',
    lessons: 3,
    formats: ['📖', '🎧'],
    level: 'Obligatorio',
    levelColor: 'bg-red-100 text-red-700',
    required: true,
  },
  {
    id: 'tc2',
    icon: '📱',
    title: 'Uso de la Plataforma',
    subtitle: 'Reservas, cobros y emergencias',
    desc: 'Cómo aceptar reservas, usar el chat con traducción automática, entender los cobros y reportar emergencias.',
    duration: '20 min',
    lessons: 4,
    formats: ['📺', '📖'],
    level: 'Obligatorio',
    levelColor: 'bg-red-100 text-red-700',
    required: true,
  },
  {
    id: 'tc3',
    icon: '🌱',
    title: 'Sostenibilidad y Respeto',
    subtitle: 'Turismo responsable',
    desc: 'Reglas de no dejar rastro, respeto a comunidades locales y trato inclusivo con todos los usuarios.',
    duration: '12 min',
    lessons: 2,
    formats: ['📖', '✅'],
    level: 'Obligatorio',
    levelColor: 'bg-red-100 text-red-700',
    required: true,
  },
];

/* ─────────────────────────────────────────────
   ESCUELAS DE ESPECIALIZACIÓN
   ───────────────────────────────────────────── */
const SCHOOLS: Record<string, {
  id: string;
  icon: string;
  name: string;
  tagline: string;
  color: string;
  bg: string;
  badge: string;
  courses: {
    id: string; icon: string; title: string; subtitle: string; desc: string;
    duration: string; lessons: number; formats: string[]; level: string;
    levelColor: string; students: number; rating: number;
  }[];
}> = {
  conductores: {
    id: 'conductores',
    icon: '🚗',
    name: 'Escuela de Conductores',
    tagline: 'Transporte privado y compartido',
    color: '#ff4c41',
    bg: '#fff2f2',
    badge: '🏅 Aliado del Volante',
    courses: [
      {
        id: 'c1', icon: '👋', title: 'La Primera Impresión', subtitle: 'Módulo 1 — Ruta del Volante',
        desc: 'El arte de recibir. Checklist del vehículo, saludo Going, uso del lanyard y manejo de equipaje.',
        duration: '15 min', lessons: 3, formats: ['📖', '🎧', '📊'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700', students: 5234, rating: 4.9,
      },
      {
        id: 'c2', icon: '🛡️', title: 'Seguridad Vial Ecuador', subtitle: 'Manejo defensivo por región',
        desc: 'Técnicas de manejo en Costa, Sierra y Amazonía. Curvas de montaña, lluvia tropical y emergencias viales.',
        duration: '25 min', lessons: 5, formats: ['📺', '🎧'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700', students: 4812, rating: 4.8,
      },
      {
        id: 'c3', icon: '🔧', title: 'Mecánica Preventiva Básica', subtitle: 'Cuida tu vehículo, cuida tu ingreso',
        desc: 'Revisión diaria, cambio de llantas en ruta, niveles de fluidos y cuándo ir al taller antes de que sea urgente.',
        duration: '20 min', lessons: 4, formats: ['📺', '📖'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700', students: 3290, rating: 4.7,
      },
      {
        id: 'c4', icon: '🗣️', title: 'Inglés Turístico Básico', subtitle: 'Atiende turistas internacionales',
        desc: 'Frases esenciales para recibir, guiar y despedirse de turistas que no hablan español. Formato podcast.',
        duration: '30 min', lessons: 6, formats: ['🎧'], level: 'Intermedio',
        levelColor: 'bg-yellow-100 text-yellow-700', students: 2100, rating: 4.8,
      },
      {
        id: 'c5', icon: '🚑', title: 'Primeros Auxilios en Ruta', subtitle: 'Responde antes de que llegue la ayuda',
        desc: 'Protocolo ante accidentes, mareo, malestar de pasajero. Incluye RCP básico y uso de botiquín.',
        duration: '35 min', lessons: 7, formats: ['📺', '📊'], level: 'Avanzado',
        levelColor: 'bg-red-100 text-red-700', students: 1820, rating: 5.0,
      },
    ],
  },
  anfitriones: {
    id: 'anfitriones',
    icon: '🏡',
    name: 'Escuela de Anfitriones',
    tagline: 'Alojamientos y hospedaje',
    color: '#3B82F6',
    bg: '#eff6ff',
    badge: '🏅 Superanfitrión Going',
    courses: [
      {
        id: 'a1', icon: '📸', title: 'Fotografía con el Celular', subtitle: 'Fotos que venden el vibe',
        desc: 'Luz natural, ángulos, composición y edición gratis. Convierte tu teléfono en una cámara profesional.',
        duration: '20 min', lessons: 4, formats: ['📺', '📖'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700', students: 3421, rating: 4.9,
      },
      {
        id: 'a2', icon: '🧹', title: 'Limpieza Estándar Going', subtitle: 'El protocolo que construye confianza',
        desc: 'Secuencia de limpieza, productos seguros, desinfección post-huésped y lista de verificación.',
        duration: '15 min', lessons: 3, formats: ['📖', '✅'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700', students: 2800, rating: 4.7,
      },
      {
        id: 'a3', icon: '🎨', title: 'Diseño de Espacios con Bajo Presupuesto', subtitle: 'Haz más con menos',
        desc: 'Ideas de decoración local, plantas, iluminación y detalles que hacen que los huéspedes recomienden tu lugar.',
        duration: '25 min', lessons: 5, formats: ['📖', '📊'], level: 'Intermedio',
        levelColor: 'bg-yellow-100 text-yellow-700', students: 1930, rating: 4.8,
      },
      {
        id: 'a4', icon: '⭐', title: 'Manejo de Reseñas', subtitle: 'Responde bien, crece más',
        desc: 'Cómo responder comentarios negativos, agradecer los positivos y convertir críticas en mejoras reales.',
        duration: '15 min', lessons: 3, formats: ['📖'], level: 'Intermedio',
        levelColor: 'bg-yellow-100 text-yellow-700', students: 2150, rating: 4.9,
      },
    ],
  },
  guias: {
    id: 'guias',
    icon: '🏺',
    name: 'Escuela de Guías Locales',
    tagline: 'Experiencias y cultura ecuatoriana',
    color: '#10B981',
    bg: '#f0fdf4',
    badge: '🏅 Embajador Local Going',
    courses: [
      {
        id: 'g1', icon: '📖', title: 'El Arte del Storytelling', subtitle: 'Cuenta tu historia, vende tu experiencia',
        desc: 'Técnicas para estructurar la historia de tu comunidad, artesanía o taller. Cómo crear momentos memorables.',
        duration: '20 min', lessons: 4, formats: ['🎧', '📖'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700', students: 1823, rating: 4.7,
      },
      {
        id: 'g2', icon: '👥', title: 'Manejo de Grupos', subtitle: 'De 2 a 20 personas',
        desc: 'Técnicas para mantener la atención, gestionar tiempos, manejar personas difíciles y garantizar seguridad.',
        duration: '25 min', lessons: 5, formats: ['📺', '📖'], level: 'Intermedio',
        levelColor: 'bg-yellow-100 text-yellow-700', students: 1350, rating: 4.8,
      },
      {
        id: 'g3', icon: '🌿', title: 'Seguridad en Exteriores', subtitle: 'Turismo de naturaleza seguro',
        desc: 'Evaluación de riesgos, protocolo ante lesiones, comunicación en zonas sin señal y normas del Ministerio de Turismo.',
        duration: '30 min', lessons: 6, formats: ['📺', '📊'], level: 'Avanzado',
        levelColor: 'bg-red-100 text-red-700', students: 980, rating: 5.0,
      },
    ],
  },
  operadores: {
    id: 'operadores',
    icon: '🧗',
    name: 'Escuela de Operadores',
    tagline: 'Tours profesionales y grupos',
    color: '#8B5CF6',
    bg: '#f5f3ff',
    badge: '🏅 Operador Certificado Going',
    courses: [
      {
        id: 'o1', icon: '📋', title: 'Logística de Grupos Grandes', subtitle: 'De 20 a 200 personas',
        desc: 'Coordinación de transporte, alojamiento y actividades. Cómo manejar imprevistos en tours de varios días.',
        duration: '35 min', lessons: 7, formats: ['📺', '📖'], level: 'Avanzado',
        levelColor: 'bg-red-100 text-red-700', students: 640, rating: 4.9,
      },
      {
        id: 'o2', icon: '📜', title: 'Normativas del Ministerio de Turismo', subtitle: 'Opera dentro del marco legal',
        desc: 'Requisitos de licencia, permisos de operación, seguros obligatorios y actualizaciones regulatorias.',
        duration: '20 min', lessons: 4, formats: ['📖', '✅'], level: 'Intermedio',
        levelColor: 'bg-yellow-100 text-yellow-700', students: 750, rating: 4.8,
      },
      {
        id: 'o3', icon: '💻', title: 'Integración con la App Going', subtitle: 'Automatiza tu gestión',
        desc: 'Sincronización de reservas, manejo de disponibilidad, sistema de pagos y métricas de rendimiento.',
        duration: '25 min', lessons: 5, formats: ['📺', '📖'], level: 'Intermedio',
        levelColor: 'bg-yellow-100 text-yellow-700', students: 520, rating: 4.7,
      },
    ],
  },
  viajeros: {
    id: 'viajeros',
    icon: '🌍',
    name: 'Escuela de Viajeros',
    tagline: 'Saca el máximo de Going',
    color: '#F59E0B',
    bg: '#fffbeb',
    badge: '🏅 Viajero Going Pro',
    courses: [
      {
        id: 'v1', icon: '🗺️', title: 'Viaja Inteligente con Going', subtitle: 'Guía completa del pasajero',
        desc: 'Cómo reservar, rastrear tu viaje, comunicarte con el conductor y usar todas las funciones de la app.',
        duration: '15 min', lessons: 3, formats: ['📖', '📺'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700', students: 8934, rating: 4.9,
      },
      {
        id: 'v2', icon: '📦', title: 'Guía de Envíos', subtitle: 'Empaques, tarifas y seguimiento',
        desc: 'Cómo preparar tu paquete, elegir el tipo de envío correcto, rastrear en tiempo real y resolver incidencias.',
        duration: '12 min', lessons: 2, formats: ['📖'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700', students: 5200, rating: 4.8,
      },
      {
        id: 'v3', icon: '💳', title: 'Pagos y Facturación', subtitle: 'DATAFAST, efectivo y recibos',
        desc: 'Métodos de pago aceptados, cómo descargar facturas, disputas y gestión financiera de tus servicios.',
        duration: '10 min', lessons: 2, formats: ['📖', '✅'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700', students: 6102, rating: 4.9,
      },
    ],
  },
};

const SCHOOL_KEYS = Object.keys(SCHOOLS) as (keyof typeof SCHOOLS)[];

const LEVELS = [
  { id: 'bronce', icon: '🥉', label: 'Aliado Bronce', desc: 'Tronco Común completado', req: 'Mínimo 3 cursos obligatorios', color: '#B45309' },
  { id: 'plata', icon: '🥈', label: 'Aliado Plata', desc: 'Tronco + 3 cursos de especialización', req: '4.5★ o más de calificación', color: '#6B7280' },
  { id: 'oro', icon: '🥇', label: 'Aliado Oro', desc: 'Todas las rutas completadas', req: '4.8★ y 50+ viajes/reservas', color: '#D97706' },
];

const FORMAT_LABELS: Record<string, string> = {
  '📖': 'Lectura',
  '🎧': 'Podcast',
  '📺': 'Video',
  '📊': 'Diapositivas',
  '✅': 'Quiz',
};

export default function AcademyPage() {
  const [activeSchool, setActiveSchool] = useState<string>('conductores');
  const [activeTab, setActiveTab] = useState<'cursos' | 'niveles' | 'tronco'>('cursos');

  const school = SCHOOLS[activeSchool];

  const totalStudents = Object.values(SCHOOLS)
    .flatMap(s => s.courses)
    .reduce((acc, c) => acc + c.students, 0);

  const totalCourses = TRONCO_COMUN.length + Object.values(SCHOOLS).flatMap(s => s.courses).length;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="relative text-white py-16 px-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #ff4c4130 100%)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5 bg-white -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-5xl mx-auto relative z-10">
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: '#ff4c4122', color: '#ff6b60' }}>
            📚 Academia Going
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Capacítate. Crece. Gana más.
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mb-6">
            La plataforma de aprendizaje de Going. Para conductores, anfitriones, guías, operadores y viajeros.
            Cursos gratuitos en formato microlearning: texto, podcast, video y quizzes.
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { icon: '🚗', label: 'Conductores' },
              { icon: '🏡', label: 'Anfitriones' },
              { icon: '🏺', label: 'Guías Locales' },
              { icon: '🧗', label: 'Operadores' },
              { icon: '🌍', label: 'Viajeros' },
            ].map(tag => (
              <span key={tag.label}
                className="text-sm px-3 py-1.5 rounded-full border border-gray-600 text-gray-300">
                {tag.icon} {tag.label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-8">
            {[
              { value: `${totalCourses}`, label: 'Cursos disponibles' },
              { value: `${Math.round(totalStudents / 1000)}K+`, label: 'Estudiantes activos' },
              { value: 'Gratis', label: 'Siempre gratuito' },
              { value: '3–35 min', label: 'Por lección' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold" style={{ color: '#ff6b60' }}>{stat.value}</div>
                <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1 mb-8">
          {[
            { id: 'cursos', label: '🎓 Escuelas' },
            { id: 'tronco', label: '🔰 Tronco Común' },
            { id: 'niveles', label: '🏆 Niveles y Badges' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === t.id ? 'bg-[#ff4c41] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ESCUELAS ── */}
        {activeTab === 'cursos' && (
          <div>
            {/* School selector */}
            <div className="flex gap-2 flex-wrap mb-6">
              {SCHOOL_KEYS.map(key => {
                const s = SCHOOLS[key];
                return (
                  <button key={key} onClick={() => setActiveSchool(key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${
                      activeSchool === key
                        ? 'text-white border-transparent shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                    style={activeSchool === key ? { backgroundColor: s.color, borderColor: s.color } : {}}>
                    <span>{s.icon}</span>
                    <span className="hidden sm:inline">{s.name.replace('Escuela de ', '')}</span>
                  </button>
                );
              })}
            </div>

            {/* Active school */}
            <div className="mb-6 rounded-2xl p-6 border border-gray-100 shadow-sm"
              style={{ backgroundColor: school.bg }}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-3xl">{school.icon}</span>
                    <h2 className="text-xl font-bold text-gray-900">{school.name}</h2>
                  </div>
                  <p className="text-gray-500 text-sm">{school.tagline} · {school.courses.length} cursos</p>
                </div>
                <span className="text-sm font-bold px-3 py-1.5 rounded-full text-white"
                  style={{ backgroundColor: school.color }}>
                  {school.badge}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {school.courses.map(course => (
                <div key={course.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                  <div className="h-1" style={{ backgroundColor: school.color }} />
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ backgroundColor: school.bg }}>
                        {course.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${course.levelColor}`}>
                            {course.level}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm leading-snug">{course.title}</h3>
                        <p className="text-xs font-medium mt-0.5" style={{ color: school.color }}>{course.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm flex-1 mb-4 leading-relaxed">{course.desc}</p>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-3">
                      <span>📖 {course.lessons} lecciones</span>
                      <span>⏱️ {course.duration}</span>
                      <span>⭐ {course.rating} ({course.students.toLocaleString()})</span>
                    </div>

                    {/* Formats */}
                    <div className="flex gap-2 mb-4">
                      {course.formats.map(f => (
                        <span key={f} className="text-xs bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                          {f} {FORMAT_LABELS[f]}
                        </span>
                      ))}
                    </div>

                    <Link href={`/academy/${course.id}`}
                      className="block w-full py-2.5 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity text-center"
                      style={{ backgroundColor: school.color }}>
                      Comenzar curso →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TRONCO COMÚN ── */}
        {activeTab === 'tronco' && (
          <div>
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white mb-6">
              <h2 className="text-xl font-bold mb-2">🔰 Tronco Común — Obligatorio para todos</h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                Antes de activar tu perfil como proveedor o acceder a las escuelas de especialización,
                debes completar estos 3 módulos. También disponibles para viajeros que quieren conocer
                la filosofía Going.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {TRONCO_COMUN.map((course, i) => (
                <div key={course.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex gap-5 hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: '#fff2f2' }}>
                      {course.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${course.levelColor}`}>
                        {course.level}
                      </span>
                      <span className="text-xs text-gray-400">⏱️ {course.duration} · {course.lessons} lecciones</span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-0.5">{course.title}</h3>
                    <p className="text-sm text-[#ff4c41] font-medium mb-2">{course.subtitle}</p>
                    <p className="text-gray-500 text-sm leading-relaxed mb-3">{course.desc}</p>
                    <div className="flex gap-2 flex-wrap">
                      {course.formats.map(f => (
                        <span key={f} className="text-xs bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                          {f} {FORMAT_LABELS[f]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0 self-center">
                    <Link href={`/academy/${course.id}`}
                      className="w-10 h-10 rounded-xl text-white font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center"
                      style={{ backgroundColor: '#ff4c41' }}>
                      ▶
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Después del Tronco Común...</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {SCHOOL_KEYS.map(key => {
                  const s = SCHOOLS[key];
                  return (
                    <button key={key}
                      onClick={() => { setActiveSchool(key); setActiveTab('cursos'); }}
                      className="rounded-xl p-4 text-center hover:shadow-md transition-shadow border border-gray-100"
                      style={{ backgroundColor: s.bg }}>
                      <div className="text-2xl mb-2">{s.icon}</div>
                      <div className="text-xs font-bold text-gray-700">{s.name.replace('Escuela de ', '')}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{s.courses.length} cursos</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── NIVELES Y BADGES ── */}
        {activeTab === 'niveles' && (
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Sistema de Niveles Going</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Completa cursos y sube de nivel. Más nivel = mejor posición en los resultados de búsqueda +
                insignias visibles en tu perfil que generan más confianza y más reservas.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
              {LEVELS.map((lvl, i) => (
                <div key={lvl.id}
                  className="bg-white rounded-2xl border shadow-sm p-6 text-center hover:shadow-md transition-shadow"
                  style={{ borderColor: `${lvl.color}40` }}>
                  <div className="text-5xl mb-3">{lvl.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{lvl.label}</h3>
                  <p className="text-sm text-gray-500 mb-3">{lvl.desc}</p>
                  <div className="text-xs bg-gray-50 rounded-lg px-3 py-2 text-gray-600">
                    ✓ {lvl.req}
                  </div>
                  {i > 0 && (
                    <div className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: `${lvl.color}15`, color: lvl.color }}>
                      Nivel {i + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Beneficios de subir de nivel</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: '🔍', title: 'Mejor posicionamiento', desc: 'Apareces más arriba cuando los usuarios buscan servicios en tu cantón.' },
                  { icon: '🏅', title: 'Insignias en tu perfil', desc: 'Badges visibles que generan confianza y aumentan tu tasa de conversión.' },
                  { icon: '📊', title: 'Acceso a estadísticas avanzadas', desc: 'Métricas detalladas de rendimiento, ocupación y satisfacción de clientes.' },
                  { icon: '💰', title: 'Bonos de desempeño', desc: 'Los aliados Oro reciben bonificaciones mensuales por su calidad de servicio.' },
                ].map(b => (
                  <div key={b.title} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                    <span className="text-2xl flex-shrink-0">{b.icon}</span>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm mb-0.5">{b.title}</h4>
                      <p className="text-gray-500 text-xs leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Insignias por escuela</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  ...SCHOOL_KEYS.map(key => ({
                    badge: SCHOOLS[key].badge, school: SCHOOLS[key].name, color: SCHOOLS[key].color,
                  })),
                  { badge: '🛡️ Primeros Auxilios', school: 'Seguridad Certificada', color: '#EF4444' },
                  { badge: '🌎 Bilingüe Going', school: 'Inglés Turístico', color: '#10B981' },
                ].map(b => (
                  <div key={b.badge} className="rounded-xl p-4 text-center border border-gray-100 bg-gray-50">
                    <div className="text-2xl mb-1">{b.badge.split(' ')[0]}</div>
                    <div className="text-xs font-bold text-gray-800">{b.badge}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{b.school}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Testimonios ── */}
        <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">💬 Resultados reales</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: 'Carlos M.', role: 'Conductor — Aliado Oro', text: 'Después de terminar la Ruta del Volante y conseguir el badge de Primeros Auxilios, mis ingresos subieron un 40% en 3 meses.' },
              { name: 'María L.', role: 'Anfitriona — Aliado Plata', text: 'Aprendí a tomar fotos con el celular y a manejar reseñas. Ahora tengo 98% de ocupación y 4.9 estrellas.' },
              { name: 'Pedro R.', role: 'Guía Local — Aliado Oro', text: 'El módulo de Storytelling cambió mis tours. Ahora mis fechas se llenan con semanas de anticipación.' },
            ].map(story => (
              <div key={story.name} className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-lg">👤</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{story.name}</p>
                    <p className="text-xs" style={{ color: '#ff4c41' }}>{story.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm italic leading-relaxed">"{story.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
