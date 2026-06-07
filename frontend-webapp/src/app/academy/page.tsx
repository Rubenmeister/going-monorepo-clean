'use client';
export const dynamic = 'force-dynamic';

import { useState, ComponentType } from 'react';
import Link from 'next/link';
import { COLORS } from '../components/design-tokens';
import {
  IconGlobe, IconMobile, IconLeaf, IconCar, IconUser, IconShield, IconTool,
  IconChat, IconHotel, IconCamera, IconCheck, IconPalette, IconStar,
  IconCompass, IconBook, IconUsers, IconMap, IconPackage, IconCard,
  IconClipboard, IconHeadphones, IconChart, IconPlay, IconQuiz, IconMedal,
  IconGraduation, IconSearch, IconMoney, IconArrowRight, IconClock,
} from '../components/icons';

type IconComponent = ComponentType<{ size?: number; className?: string }>;

/* ─────────────────────────────────────────────
   FORMATOS DE LECCIÓN — icono + label
   ───────────────────────────────────────────── */
type FormatKey = 'reading' | 'podcast' | 'video' | 'slides' | 'quiz';

const FORMATS: Record<FormatKey, { Icon: IconComponent; label: string }> = {
  reading: { Icon: IconBook,       label: 'Lectura'      },
  podcast: { Icon: IconHeadphones, label: 'Podcast'      },
  video:   { Icon: IconPlay,       label: 'Video'        },
  slides:  { Icon: IconChart,      label: 'Diapositivas' },
  quiz:    { Icon: IconQuiz,       label: 'Quiz'         },
};

interface Course {
  id: string;
  Icon: IconComponent;
  title: string;
  subtitle: string;
  desc: string;
  duration: string;
  lessons: number;
  formats: FormatKey[];
  level: string;
  levelColor: string;
  students?: number;
  rating?: number;
  required?: boolean;
}

/* ─────────────────────────────────────────────
   TRONCO COMÚN — obligatorio para todos los roles
   ───────────────────────────────────────────── */
const TRONCO_COMUN: Course[] = [
  {
    id: 'tc1',
    Icon: IconGlobe,
    title: 'El ADN de Going App',
    subtitle: 'Filosofía y hospitalidad ecuatoriana',
    desc: 'La misión de Going App, hospitalidad ecuatoriana, empatía, resolución pacífica de problemas y por qué somos embajadores del país.',
    duration: '15 min',
    lessons: 3,
    formats: ['reading', 'slides', 'podcast', 'quiz'],
    level: 'Obligatorio',
    levelColor: 'bg-red-100 text-red-700',
    required: true,
  },
  {
    id: 'tc2',
    Icon: IconMobile,
    title: 'Uso de la Plataforma',
    subtitle: 'Reservas, cobros y emergencias',
    desc: 'Cómo aceptar reservas, usar el chat con traducción automática, entender los cobros y reportar emergencias.',
    duration: '20 min',
    lessons: 4,
    formats: ['reading', 'slides', 'podcast', 'quiz'],
    level: 'Obligatorio',
    levelColor: 'bg-red-100 text-red-700',
    required: true,
  },
  {
    id: 'tc3',
    Icon: IconLeaf,
    title: 'Sostenibilidad y Respeto',
    subtitle: 'Turismo responsable',
    desc: 'Reglas de no dejar rastro, respeto a comunidades locales y trato inclusivo con toda la comunidad usuaria.',
    duration: '12 min',
    lessons: 2,
    formats: ['reading', 'slides', 'podcast', 'quiz'],
    level: 'Obligatorio',
    levelColor: 'bg-red-100 text-red-700',
    required: true,
  },
];

/* ─────────────────────────────────────────────
   ESCUELAS DE ESPECIALIZACIÓN
   ───────────────────────────────────────────── */
interface School {
  id: string;
  Icon: IconComponent;
  name: string;
  tagline: string;
  color: string;
  bg: string;
  badge: string;
  badgeIcon: IconComponent;
  courses: Course[];
}

const SCHOOLS: Record<string, School> = {
  conductores: {
    id: 'conductores',
    Icon: IconCar,
    name: 'Escuela de Conductores',
    tagline: 'Transporte privado y compartido',
    color: COLORS.brand.red,
    bg: COLORS.brand.redBg,
    badge: 'Aliado del Volante',
    badgeIcon: IconMedal,
    courses: [
      { id: 'c1', Icon: IconUser,   title: 'La Primera Impresión',          subtitle: 'Módulo 1 — Ruta del Volante',
        desc: 'El arte de recibir. Checklist del vehículo, saludo Going App, uso del lanyard y manejo de equipaje.',
        duration: '15 min', lessons: 3, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700', students: 5234, rating: 4.9 },
      { id: 'c2', Icon: IconShield, title: 'Seguridad Vial Ecuador',         subtitle: 'Manejo defensivo por región',
        desc: 'Técnicas de manejo en Costa, Sierra y Amazonía. Curvas de montaña, lluvia tropical y emergencias viales.',
        duration: '25 min', lessons: 5, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700', students: 4812, rating: 4.8 },
      { id: 'c3', Icon: IconTool,   title: 'Mecánica Preventiva Básica',     subtitle: 'Cuida tu vehículo, cuida tu ingreso',
        desc: 'Revisión diaria, cambio de llantas en ruta, niveles de fluidos y cuándo ir al taller antes de que sea urgente.',
        duration: '20 min', lessons: 4, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700', students: 3290, rating: 4.7 },
      { id: 'c4', Icon: IconChat,   title: 'Inglés Turístico Básico',        subtitle: 'Atiende turistas internacionales',
        desc: 'Frases esenciales para recibir, guiar y despedirse de turistas que no hablan español. Formato podcast.',
        duration: '30 min', lessons: 6, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Intermedio',
        levelColor: 'bg-yellow-100 text-yellow-700', students: 2100, rating: 4.8 },
      { id: 'c5', Icon: IconShield, title: 'Primeros Auxilios en Ruta',      subtitle: 'Responde antes de que llegue la ayuda',
        desc: 'Protocolo ante accidentes, mareo, malestar de pasajero. Incluye RCP básico y uso de botiquín.',
        duration: '35 min', lessons: 7, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Avanzado',
        levelColor: 'bg-red-100 text-red-700', students: 1820, rating: 5.0 },
    ],
  },
  anfitriones: {
    id: 'anfitriones',
    Icon: IconHotel,
    name: 'Escuela de Anfitriones',
    tagline: 'Alojamientos y hospedaje',
    color: COLORS.system.blue,
    bg: COLORS.system.blueBg,
    badge: 'Superanfitrión Going App',
    badgeIcon: IconMedal,
    courses: [
      { id: 'a1', Icon: IconCamera,  title: 'Fotografía con el Celular',           subtitle: 'Fotos que venden el vibe',
        desc: 'Luz natural, ángulos, composición y edición gratis. Convierte tu teléfono en una cámara profesional.',
        duration: '20 min', lessons: 4, formats: ['video', 'reading'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700', students: 3421, rating: 4.9 },
      { id: 'a2', Icon: IconCheck,   title: 'Limpieza Estándar Going App',             subtitle: 'El protocolo que construye confianza',
        desc: 'Secuencia de limpieza, productos seguros, desinfección post-huésped y lista de verificación.',
        duration: '15 min', lessons: 3, formats: ['reading', 'quiz'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700', students: 2800, rating: 4.7 },
      { id: 'a3', Icon: IconPalette, title: 'Diseño con Bajo Presupuesto',         subtitle: 'Haz más con menos',
        desc: 'Ideas de decoración local, plantas, iluminación y detalles que hacen que los huéspedes recomienden tu lugar.',
        duration: '25 min', lessons: 5, formats: ['reading', 'slides'], level: 'Intermedio',
        levelColor: 'bg-yellow-100 text-yellow-700', students: 1930, rating: 4.8 },
      { id: 'a4', Icon: IconStar,    title: 'Manejo de Reseñas',                   subtitle: 'Responde bien, crece más',
        desc: 'Cómo responder comentarios negativos, agradecer los positivos y convertir críticas en mejoras reales.',
        duration: '15 min', lessons: 3, formats: ['reading'], level: 'Intermedio',
        levelColor: 'bg-yellow-100 text-yellow-700', students: 2150, rating: 4.9 },
    ],
  },
  guias: {
    id: 'guias',
    Icon: IconCompass,
    name: 'Escuela de Guías Locales',
    tagline: 'Experiencias y cultura ecuatoriana',
    color: COLORS.state.success,
    bg: '#F0FDF4',
    badge: 'Embajador Local Going App',
    badgeIcon: IconMedal,
    courses: [
      { id: 'g1', Icon: IconBook,  title: 'El Arte del Storytelling', subtitle: 'Cuenta tu historia, vende tu experiencia',
        desc: 'Técnicas para estructurar la historia de tu comunidad, artesanía o taller. Cómo crear momentos memorables.',
        duration: '20 min', lessons: 4, formats: ['podcast', 'reading'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700', students: 1823, rating: 4.7 },
      { id: 'g2', Icon: IconUsers, title: 'Manejo de Grupos',         subtitle: 'De 2 a 20 personas',
        desc: 'Técnicas para mantener la atención, gestionar tiempos, manejar personas difíciles y garantizar seguridad.',
        duration: '25 min', lessons: 5, formats: ['video', 'reading'], level: 'Intermedio',
        levelColor: 'bg-yellow-100 text-yellow-700', students: 1350, rating: 4.8 },
      { id: 'g3', Icon: IconLeaf,  title: 'Seguridad en Exteriores',  subtitle: 'Turismo de naturaleza seguro',
        desc: 'Evaluación de riesgos, protocolo ante lesiones, comunicación en zonas sin señal y normas del Ministerio de Turismo.',
        duration: '30 min', lessons: 6, formats: ['video', 'slides'], level: 'Avanzado',
        levelColor: 'bg-red-100 text-red-700', students: 980, rating: 5.0 },
    ],
  },
  operadores: {
    id: 'operadores',
    Icon: IconMap,
    name: 'Escuela de Operadores',
    tagline: 'Tours profesionales y grupos',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    badge: 'Operador Certificado Going App',
    badgeIcon: IconMedal,
    courses: [
      { id: 'o1', Icon: IconClipboard, title: 'Logística de Grupos Grandes',      subtitle: 'De 20 a 200 personas',
        desc: 'Coordinación de transporte, alojamiento y actividades. Cómo manejar imprevistos en tours de varios días.',
        duration: '35 min', lessons: 7, formats: ['video', 'reading'], level: 'Avanzado',
        levelColor: 'bg-red-100 text-red-700', students: 640, rating: 4.9 },
      { id: 'o2', Icon: IconBook,      title: 'Normativas del Ministerio de Turismo', subtitle: 'Opera dentro del marco legal',
        desc: 'Requisitos de licencia, permisos de operación, seguros obligatorios y actualizaciones regulatorias.',
        duration: '20 min', lessons: 4, formats: ['reading', 'quiz'], level: 'Intermedio',
        levelColor: 'bg-yellow-100 text-yellow-700', students: 750, rating: 4.8 },
      { id: 'o3', Icon: IconMobile,    title: 'Integración con la App Going App',      subtitle: 'Automatiza tu gestión',
        desc: 'Sincronización de reservas, manejo de disponibilidad, sistema de pagos y métricas de rendimiento.',
        duration: '25 min', lessons: 5, formats: ['video', 'reading'], level: 'Intermedio',
        levelColor: 'bg-yellow-100 text-yellow-700', students: 520, rating: 4.7 },
    ],
  },
  viajeros: {
    id: 'viajeros',
    Icon: IconGlobe,
    name: 'Escuela de Viajeros',
    tagline: 'Saca el máximo de Going App',
    color: COLORS.brand.yellowDark,
    bg: COLORS.brand.yellowBg,
    badge: 'Viajero Going App Pro',
    badgeIcon: IconMedal,
    courses: [
      { id: 'v1', Icon: IconMap,     title: 'Viaja Inteligente con Going App', subtitle: 'Guía completa del pasajero',
        desc: 'Cómo reservar, rastrear tu viaje, comunicarte con el conductor y usar todas las funciones de la app.',
        duration: '15 min', lessons: 3, formats: ['reading', 'video'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700', students: 8934, rating: 4.9 },
      { id: 'v2', Icon: IconPackage, title: 'Guía de Envíos',              subtitle: 'Empaques, tarifas y seguimiento',
        desc: 'Cómo preparar tu paquete, elegir el tipo de envío correcto, rastrear en tiempo real y resolver incidencias.',
        duration: '12 min', lessons: 2, formats: ['reading'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700', students: 5200, rating: 4.8 },
      { id: 'v3', Icon: IconCard,    title: 'Pagos y Facturación',          subtitle: 'DATAFAST, efectivo y recibos',
        desc: 'Métodos de pago aceptados, cómo descargar facturas, disputas y gestión financiera de tus servicios.',
        duration: '10 min', lessons: 2, formats: ['reading', 'quiz'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700', students: 6102, rating: 4.9 },
    ],
  },
};

const SCHOOL_KEYS = Object.keys(SCHOOLS) as (keyof typeof SCHOOLS)[];

interface LevelDef {
  id: string;
  label: string;
  desc: string;
  req: string;
  color: string;
  Icon: IconComponent;
}

const LEVELS: LevelDef[] = [
  { id: 'bronce', label: 'Aliado Bronce', desc: 'Tronco Común completado',                req: 'Mínimo 3 cursos obligatorios',    color: '#B45309', Icon: IconMedal },
  { id: 'plata',  label: 'Aliado Plata',  desc: 'Tronco + 3 cursos de especialización',   req: '4.5★ o más de calificación',      color: '#6B7280', Icon: IconMedal },
  { id: 'oro',    label: 'Aliado Oro',    desc: 'Todas las rutas completadas',            req: '4.8★ y 50+ viajes/reservas',      color: '#D97706', Icon: IconMedal },
];

interface Testimony {
  name: string;
  role: string;
  text: string;
  Icon: IconComponent;
}

const TESTIMONIES: Testimony[] = [
  { name: 'Carlos M.', role: 'Conductor — Aliado Oro',     text: 'Después de terminar la Ruta del Volante y conseguir el badge de Primeros Auxilios, mis ingresos subieron un 40% en 3 meses.', Icon: IconCar },
  { name: 'María L.',  role: 'Anfitriona — Aliado Plata',  text: 'Aprendí a tomar fotos con el celular y a manejar reseñas. Ahora tengo 98% de ocupación y 4.9 estrellas.',                       Icon: IconHotel },
  { name: 'Pedro R.',  role: 'Guía Local — Aliado Oro',    text: 'El módulo de Storytelling cambió mis tours. Ahora mis fechas se llenan con semanas de anticipación.',                            Icon: IconCompass },
];

export default function AcademyPage() {
  const [activeSchool, setActiveSchool] = useState<string>('conductores');
  const [activeTab, setActiveTab] = useState<'cursos' | 'niveles' | 'tronco'>('cursos');

  const school = SCHOOLS[activeSchool];

  const totalStudents = Object.values(SCHOOLS)
    .flatMap(s => s.courses)
    .reduce((acc, c) => acc + (c.students ?? 0), 0);

  const totalCourses = TRONCO_COMUN.length + Object.values(SCHOOLS).flatMap(s => s.courses).length;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="relative text-white py-16 px-6 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${COLORS.brand.black} 0%, #1e293b 60%, ${COLORS.brand.red}30 100%)` }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5 bg-white -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-10">
          {/* Texto */}
          <div className="flex-1 text-center md:text-left">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: `${COLORS.brand.red}22`, color: COLORS.brand.redLight }}>
              <IconGraduation size={14} />
              Academia Going App
            </span>
            <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight" style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}>
              Capacítate. Crece. Gana más.
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mb-6">
              La plataforma de aprendizaje de Going App. Para conductores, anfitriones, guías, operadores y viajeros.
              Cursos gratuitos en formato microlearning: texto, podcast, video y quizzes.
            </p>
            <div className="flex flex-wrap gap-3 mb-8 justify-center md:justify-start">
              {SCHOOL_KEYS.map(key => {
                const s = SCHOOLS[key];
                return (
                  <span key={key}
                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-gray-600 text-gray-300">
                    <s.Icon size={14} />
                    {s.name.replace('Escuela de ', '')}
                  </span>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-8 justify-center md:justify-start">
              {[
                { value: `${totalCourses}`,                            label: 'Cursos disponibles' },
                { value: `${Math.round(totalStudents / 1000)}K+`,      label: 'Estudiantes activos' },
                { value: 'Gratis',                                     label: 'Siempre gratuito' },
                { value: '3–35 min',                                   label: 'Por lección' },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-black" style={{ color: COLORS.brand.redLight }}>{stat.value}</div>
                  <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Imagen */}
          <div className="flex-1 w-full md:max-w-md">
            <img
              src="/images/Academia%20Going.jpg"
              alt="Academia Going App — formación para conductores y anfitriones"
              className="w-full rounded-3xl shadow-2xl object-cover"
              style={{ maxHeight: '440px' }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1 mb-8">
          {[
            { id: 'cursos' as const, label: 'Escuelas',         Icon: IconGraduation },
            { id: 'tronco' as const, label: 'Tronco Común',     Icon: IconCheck },
            { id: 'niveles' as const, label: 'Niveles y Badges', Icon: IconMedal },
          ].map(t => {
            const active = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  backgroundColor: active ? COLORS.brand.red : 'transparent',
                  color:           active ? COLORS.brand.white : COLORS.text.muted,
                }}>
                <t.Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── ESCUELAS ── */}
        {activeTab === 'cursos' && (
          <div>
            {/* School selector */}
            <div className="flex gap-2 flex-wrap mb-6">
              {SCHOOL_KEYS.map(key => {
                const s = SCHOOLS[key];
                const active = activeSchool === key;
                return (
                  <button key={key} onClick={() => setActiveSchool(key)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border-2"
                    style={active
                      ? { backgroundColor: s.color, borderColor: s.color, color: COLORS.brand.white }
                      : { backgroundColor: COLORS.bg.card, borderColor: COLORS.border.default, color: COLORS.text.muted }
                    }>
                    <s.Icon size={16} />
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
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl" style={{ backgroundColor: school.color, color: COLORS.brand.white }}>
                      <school.Icon size={28} />
                    </span>
                    <h2 className="text-xl font-bold text-gray-900">{school.name}</h2>
                  </div>
                  <p className="text-gray-500 text-sm">{school.tagline} · {school.courses.length} cursos</p>
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: school.color, color: COLORS.brand.white }}>
                  <school.badgeIcon size={14} />
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
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: school.bg, color: school.color }}>
                        <course.Icon size={24} />
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
                      <span className="inline-flex items-center gap-1"><IconBook size={12} />{course.lessons} lecciones</span>
                      <span className="inline-flex items-center gap-1"><IconClock size={12} />{course.duration}</span>
                      {course.rating != null && (
                        <span className="inline-flex items-center gap-1"><IconStar size={12} />{course.rating} ({(course.students ?? 0).toLocaleString()})</span>
                      )}
                    </div>

                    {/* Formats */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {course.formats.map(f => {
                        const F = FORMATS[f];
                        return (
                          <span key={f} className="inline-flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-100 px-2 py-1 rounded-full text-gray-600">
                            <F.Icon size={12} />
                            {F.label}
                          </span>
                        );
                      })}
                    </div>

                    <Link href={`/academy/${course.id}`}
                      className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: school.color, color: COLORS.brand.white }}>
                      Comenzar curso
                      <IconArrowRight size={16} />
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
            <div className="rounded-2xl p-6 text-white mb-6" style={{ background: 'linear-gradient(to right, #111827, #1F2937)' }}>
              <h2 className="text-xl font-bold mb-2 inline-flex items-center gap-2">
                <IconCheck size={20} />
                Tronco Común — Obligatorio para todos
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                Antes de activar tu perfil como proveedor o acceder a las escuelas de especialización,
                debes completar estos 3 módulos. También disponibles para viajeros que quieren conocer
                la filosofía Going App.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {TRONCO_COMUN.map(course => (
                <div key={course.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex gap-5 hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: COLORS.brand.redBg, color: COLORS.brand.red }}>
                      <course.Icon size={26} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${course.levelColor}`}>
                        {course.level}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <IconClock size={12} />
                        {course.duration} · {course.lessons} lecciones
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-0.5">{course.title}</h3>
                    <p className="text-sm font-medium mb-2" style={{ color: COLORS.brand.red }}>{course.subtitle}</p>
                    <p className="text-gray-500 text-sm leading-relaxed mb-3">{course.desc}</p>
                    <div className="flex gap-2 flex-wrap">
                      {course.formats.map(f => {
                        const F = FORMATS[f];
                        return (
                          <span key={f} className="inline-flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-100 px-2 py-1 rounded-full text-gray-600">
                            <F.Icon size={12} />
                            {F.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex-shrink-0 self-center">
                    <Link href={`/academy/${course.id}`}
                      className="w-10 h-10 rounded-xl font-bold flex items-center justify-center hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: COLORS.brand.red, color: COLORS.brand.white }}>
                      <IconPlay size={16} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Después del Tronco Común…</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {SCHOOL_KEYS.map(key => {
                  const s = SCHOOLS[key];
                  return (
                    <button key={key}
                      onClick={() => { setActiveSchool(key); setActiveTab('cursos'); }}
                      className="rounded-xl p-4 text-center hover:shadow-md transition-shadow border border-gray-100"
                      style={{ backgroundColor: s.bg }}>
                      <div className="flex justify-center mb-2" style={{ color: s.color }}>
                        <s.Icon size={28} />
                      </div>
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
              <h2 className="text-xl font-bold text-gray-900 mb-2">Sistema de Niveles Going App</h2>
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
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-3" style={{ backgroundColor: `${lvl.color}15`, color: lvl.color }}>
                    <lvl.Icon size={44} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{lvl.label}</h3>
                  <p className="text-sm text-gray-500 mb-3">{lvl.desc}</p>
                  <div className="inline-flex items-center gap-1.5 text-xs bg-gray-50 rounded-lg px-3 py-2 text-gray-600">
                    <IconCheck size={12} />
                    {lvl.req}
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
                  { Icon: IconSearch, title: 'Mejor posicionamiento',          desc: 'Apareces más arriba cuando alguien busca servicios en tu cantón.' },
                  { Icon: IconMedal,  title: 'Insignias en tu perfil',         desc: 'Badges visibles que generan confianza y aumentan tu tasa de conversión.' },
                  { Icon: IconChart,  title: 'Estadísticas avanzadas',         desc: 'Métricas detalladas de rendimiento, ocupación y satisfacción de clientes.' },
                  { Icon: IconMoney,  title: 'Bonos de desempeño',             desc: 'Los aliados Oro reciben bonificaciones mensuales por su calidad de servicio.' },
                ].map(b => (
                  <div key={b.title} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                    <span className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.brand.redBg, color: COLORS.brand.red }}>
                      <b.Icon size={20} />
                    </span>
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
                    Icon:   SCHOOLS[key].badgeIcon,
                    badge:  SCHOOLS[key].badge,
                    school: SCHOOLS[key].name,
                    color:  SCHOOLS[key].color,
                  })),
                  { Icon: IconShield, badge: 'Primeros Auxilios', school: 'Seguridad Certificada', color: COLORS.state.danger },
                  { Icon: IconGlobe,  badge: 'Bilingüe Going App',    school: 'Inglés Turístico',      color: COLORS.state.success },
                ].map(b => (
                  <div key={b.badge} className="rounded-xl p-4 text-center border border-gray-100 bg-gray-50">
                    <div className="flex justify-center mb-2" style={{ color: b.color }}>
                      <b.Icon size={28} />
                    </div>
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
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center inline-flex items-center justify-center gap-2 w-full">
            <IconChat size={20} className="text-gray-500" />
            Resultados reales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIES.map(story => (
              <div key={story.name} className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.brand.redBg, color: COLORS.brand.red }}>
                    <story.Icon size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{story.name}</p>
                    <p className="text-xs" style={{ color: COLORS.brand.red }}>{story.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm italic leading-relaxed">&ldquo;{story.text}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
