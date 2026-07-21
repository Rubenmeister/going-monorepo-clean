'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, ComponentType } from 'react';
import Link from 'next/link';
import { COLORS } from '../components/design-tokens';
import { useIsAuthenticated } from '../../lib/providers/auth-client';
import { getAcademyProgress, ProgressView } from '../../lib/academy/api';
import { CourseArt } from './CourseArt';
import {
  IconGlobe, IconMobile, IconLeaf, IconCar, IconUser, IconShield, IconTool,
  IconChat, IconHotel, IconCamera, IconCheck, IconPalette, IconStar,
  IconCompass, IconBook, IconUsers, IconMap, IconPackage, IconCard,
  IconClipboard, IconHeadphones, IconChart, IconPlay, IconQuiz, IconMedal,
  IconGraduation, IconSearch, IconMoney, IconArrowRight, IconClock, IconLock,
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
        levelColor: 'bg-green-100 text-green-700' },
      { id: 'c2', Icon: IconShield, title: 'Seguridad Vial Ecuador',         subtitle: 'Manejo defensivo por región',
        desc: 'Técnicas de manejo en Costa, Sierra y Amazonía. Curvas de montaña, lluvia tropical y emergencias viales.',
        duration: '25 min', lessons: 5, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700' },
      { id: 'c3', Icon: IconTool,   title: 'Mecánica Preventiva Básica',     subtitle: 'Cuida tu vehículo, cuida tu ingreso',
        desc: 'Revisión diaria, cambio de llantas en ruta, niveles de fluidos y cuándo ir al taller antes de que sea urgente.',
        duration: '20 min', lessons: 4, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700' },
      { id: 'c4', Icon: IconChat,   title: 'Inglés Turístico Básico',        subtitle: 'Atiende turistas internacionales',
        desc: 'Frases esenciales para recibir, guiar y despedirse de turistas que no hablan español. Formato podcast.',
        duration: '30 min', lessons: 6, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Intermedio',
        levelColor: 'bg-yellow-100 text-yellow-700' },
      { id: 'c5', Icon: IconShield, title: 'Primeros Auxilios en Ruta',      subtitle: 'Responde antes de que llegue la ayuda',
        desc: 'Protocolo ante accidentes, mareo, malestar de pasajero. Incluye RCP básico y uso de botiquín.',
        duration: '35 min', lessons: 7, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Avanzado',
        levelColor: 'bg-red-100 text-red-700' },
      { id: 'c6', Icon: IconStar,   title: 'Atención al Cliente',           subtitle: 'El arte de un servicio de cinco estrellas',
        desc: 'De la sonrisa al adiós: comunicación, ambiente, manejo de situaciones difíciles, y seguridad y privacidad.',
        duration: '30 min', lessons: 6, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Intermedio',
        levelColor: 'bg-yellow-100 text-yellow-700' },
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
        duration: '20 min', lessons: 4, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700' },
      { id: 'a2', Icon: IconCheck,   title: 'Limpieza Estándar Going App',             subtitle: 'El protocolo que construye confianza',
        desc: 'Secuencia de limpieza, productos seguros, desinfección post-huésped y lista de verificación.',
        duration: '15 min', lessons: 3, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700' },
      { id: 'a3', Icon: IconPalette, title: 'Diseño con Bajo Presupuesto',         subtitle: 'Haz más con menos',
        desc: 'Ideas de decoración local, plantas, iluminación y detalles que hacen que los huéspedes recomienden tu lugar.',
        duration: '25 min', lessons: 5, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Intermedio',
        levelColor: 'bg-yellow-100 text-yellow-700' },
      { id: 'a4', Icon: IconStar,    title: 'Manejo de Reseñas',                   subtitle: 'Responde bien, crece más',
        desc: 'Cómo responder comentarios negativos, agradecer los positivos y convertir críticas en mejoras reales.',
        duration: '15 min', lessons: 3, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Intermedio',
        levelColor: 'bg-yellow-100 text-yellow-700' },
    ],
  },
  guias: {
    id: 'guias',
    Icon: IconCompass,
    name: 'Escuela de Guías Locales',
    tagline: 'Experiencias y cultura ecuatoriana',
    // verde bosque accesible (#16A34A fallaba ~3.3:1 con texto blanco)
    color: '#166534',
    bg: '#F0FDF4',
    badge: 'Embajador Local Going App',
    badgeIcon: IconMedal,
    courses: [
      { id: 'g1', Icon: IconBook,  title: 'El Arte del Storytelling', subtitle: 'Cuenta tu historia, vende tu experiencia',
        desc: 'Técnicas para estructurar la historia de tu comunidad, artesanía o taller. Cómo crear momentos memorables.',
        duration: '20 min', lessons: 4, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700' },
      { id: 'g2', Icon: IconUsers, title: 'Manejo de Grupos',         subtitle: 'De 2 a 20 personas',
        desc: 'Técnicas para mantener la atención, gestionar tiempos, manejar personas difíciles y garantizar seguridad.',
        duration: '25 min', lessons: 5, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Intermedio',
        levelColor: 'bg-yellow-100 text-yellow-700' },
      { id: 'g3', Icon: IconLeaf,  title: 'Seguridad en Exteriores',  subtitle: 'Turismo de naturaleza seguro',
        desc: 'Evaluación de riesgos, protocolo ante lesiones, comunicación en zonas sin señal y normas del Ministerio de Turismo.',
        duration: '30 min', lessons: 6, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Avanzado',
        levelColor: 'bg-red-100 text-red-700' },
    ],
  },
  operadores: {
    id: 'operadores',
    Icon: IconMap,
    name: 'Escuela de Operadores',
    tagline: 'Tours profesionales y grupos',
    color: '#6D28D9', // violeta accesible (#8B5CF6 fallaba ~3.5:1 con texto blanco)
    bg: '#F5F3FF',
    badge: 'Operador Certificado Going App',
    badgeIcon: IconMedal,
    courses: [
      { id: 'o1', Icon: IconClipboard, title: 'Logística de Grupos Grandes',      subtitle: 'De 20 a 200 personas',
        desc: 'Coordinación de transporte, alojamiento y actividades. Cómo manejar imprevistos en tours de varios días.',
        duration: '35 min', lessons: 7, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Avanzado',
        levelColor: 'bg-red-100 text-red-700' },
      { id: 'o2', Icon: IconBook,      title: 'Normativas del Ministerio de Turismo', subtitle: 'Opera dentro del marco legal',
        desc: 'Requisitos de licencia, permisos de operación, seguros obligatorios y actualizaciones regulatorias.',
        duration: '20 min', lessons: 4, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Intermedio',
        levelColor: 'bg-yellow-100 text-yellow-700' },
      { id: 'o3', Icon: IconMobile,    title: 'Integración con la App Going App',      subtitle: 'Automatiza tu gestión',
        desc: 'Sincronización de reservas, manejo de disponibilidad, sistema de pagos y métricas de rendimiento.',
        duration: '25 min', lessons: 5, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Intermedio',
        levelColor: 'bg-yellow-100 text-yellow-700' },
    ],
  },
  viajeros: {
    id: 'viajeros',
    Icon: IconGlobe,
    name: 'Escuela de Viajeros',
    tagline: 'Saca el máximo de Going App',
    color: '#B45309', // ámbar accesible (yellowDark #E6B43E fallaba WCAG con texto blanco/sobre blanco)
    bg: COLORS.brand.yellowBg,
    badge: 'Viajero Going App Pro',
    badgeIcon: IconMedal,
    courses: [
      { id: 'v1', Icon: IconMap,     title: 'Viaja Inteligente con Going App', subtitle: 'Guía completa del pasajero',
        desc: 'Cómo reservar, rastrear tu viaje, comunicarte con el conductor y usar todas las funciones de la app.',
        duration: '15 min', lessons: 3, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700' },
      { id: 'v2', Icon: IconPackage, title: 'Guía de Envíos',              subtitle: 'Empaques, tarifas y seguimiento',
        desc: 'Cómo preparar tu paquete, elegir el tipo de envío correcto, rastrear en tiempo real y resolver incidencias.',
        duration: '12 min', lessons: 2, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700' },
      { id: 'v3', Icon: IconCard,    title: 'Pagos y Facturación',          subtitle: 'DATAFAST, efectivo y recibos',
        desc: 'Métodos de pago aceptados, cómo descargar facturas, disputas y gestión financiera de tus servicios.',
        duration: '10 min', lessons: 2, formats: ['reading', 'slides', 'podcast', 'quiz'], level: 'Principiante',
        levelColor: 'bg-green-100 text-green-700' },
    ],
  },
};

const SCHOOL_KEYS = Object.keys(SCHOOLS) as (keyof typeof SCHOOLS)[];

/** Índice plano id → {title, color, school} para el banner "continúa donde quedaste". */
const COURSE_INDEX: Record<string, { title: string; color: string; school: string }> = {};
TRONCO_COMUN.forEach(c => { COURSE_INDEX[c.id] = { title: c.title, color: COLORS.brand.red, school: 'tronco' }; });
SCHOOL_KEYS.forEach(k => SCHOOLS[k].courses.forEach(c => { COURSE_INDEX[c.id] = { title: c.title, color: SCHOOLS[k].color, school: String(k) }; }));

const LEVEL_COLORS: Record<string, string> = { none: '#9CA3AF', bronce: '#B45309', plata: '#8E9BB0', oro: '#D9A006' };

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

/** Anillo de progreso pequeño para la banda de la tarjeta. */
function ProgressRing({ pct, done, color }: { pct: number; done: boolean; color: string }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  const ring = done ? '#15803D' : color;
  return (
    <svg width="34" height="34" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r={r} fill="rgba(255,255,255,0.7)" />
      <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3.5" />
      <circle cx="18" cy="18" r={r} fill="none" stroke={ring} strokeWidth="3.5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 18 18)" />
      {done ? (
        <path d="M12 18 l4 4 8 -8" fill="none" stroke="#15803D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        // "En curso": punto central (sin % engañoso; el arco indica avance por formatos vistos)
        <circle cx="18" cy="18" r="2.6" fill={color} />
      )}
    </svg>
  );
}

export default function AcademyPage() {
  const [activeSchool, setActiveSchool] = useState<string>('conductores');
  const [activeTab, setActiveTab] = useState<'cursos' | 'niveles' | 'tronco'>('cursos');

  // Deep-link: /academy?tab=niveles abre directo esa pestaña (lo usa el botón
  // "Ver mis insignias" al terminar un curso).
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    if (t === 'niveles' || t === 'tronco' || t === 'cursos') setActiveTab(t);
  }, []);

  const isAuthed = useIsAuthenticated();
  const [progress, setProgress] = useState<ProgressView | null>(null);
  useEffect(() => {
    if (!isAuthed) { setProgress(null); return; }
    let active = true;
    getAcademyProgress().then(p => { if (active) setProgress(p); });
    return () => { active = false; };
  }, [isAuthed]);

  // Set de courseIds completados para pintar ✓ en las tarjetas.
  const completedIds = new Set(progress?.courses.filter(c => c.completed).map(c => c.id) ?? []);
  // Estado por curso (para anillo de progreso + "continuar").
  const courseById = new Map((progress?.courses ?? []).map(c => [c.id, c]));
  // Insignias ya ganadas (para la vitrina ganadas/bloqueadas).
  const earnedBadgeCodes = new Set((progress?.badges ?? []).map(b => b.code));
  // Curso a medias (para el banner "continúa donde quedaste").
  const resumeCourse = (progress?.courses ?? [])
    .filter(c => !c.completed && ((c.lessonsCompleted > 0) || (c.quizBestScore > 0)) && COURSE_INDEX[c.id])
    .sort((a, b) => b.lessonsCompleted - a.lessonsCompleted)[0] ?? null;

  const school = SCHOOLS[activeSchool];

  const totalCourses = TRONCO_COMUN.length + Object.values(SCHOOLS).flatMap(s => s.courses).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        .academy-lights{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
        .academy-lights .al{position:absolute;border-radius:9999px;filter:blur(28px);opacity:.5;
          background:radial-gradient(circle at 30% 30%, #FF7A5A, #FF4C41 60%, transparent 72%);
          animation:academyFloat 14s ease-in-out infinite}
        .al1{width:120px;height:120px;left:6%;top:18%;animation-delay:0s}
        .al2{width:80px;height:80px;left:24%;top:62%;animation-delay:-3s;background:radial-gradient(circle at 30% 30%,#FFD27A,#F2A93C 60%,transparent 72%);opacity:.35}
        .al3{width:150px;height:150px;right:10%;top:10%;animation-delay:-6s;opacity:.4}
        .al4{width:60px;height:60px;right:26%;bottom:14%;animation-delay:-9s;background:radial-gradient(circle at 30% 30%,#8FD0FF,#4C93FF 60%,transparent 72%);opacity:.3}
        .al5{width:90px;height:90px;left:48%;top:38%;animation-delay:-4.5s;opacity:.25}
        @keyframes academyFloat{
          0%,100%{transform:translate(0,0) scale(1)}
          33%{transform:translate(14px,-20px) scale(1.08)}
          66%{transform:translate(-12px,10px) scale(.95)}
        }
        @media (prefers-reduced-motion:reduce){.academy-lights .al{animation:none}}
      `}</style>

      {/* ── Hero ── */}
      <div className="relative text-white py-16 px-6 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${COLORS.brand.black} 0%, #1e293b 60%, ${COLORS.brand.red}30 100%)` }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5 bg-white -translate-y-1/2 translate-x-1/3" />
        {/* Luces flotantes ambientales */}
        <div className="academy-lights" aria-hidden="true">
          <span className="al al1" /><span className="al al2" /><span className="al al3" />
          <span className="al al4" /><span className="al al5" />
        </div>
        {/* Logo Going App + bajada — centrado arriba del hero */}
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/going-logo-h-trans.png"
            alt="Going App"
            className="h-14 md:h-16 w-auto object-contain"
          />
          <p className="mt-3 text-xs md:text-sm font-semibold uppercase tracking-[0.18em] text-gray-300 text-center max-w-xl">
            La primera superapp latinoamericana del turismo colaborativo
          </p>
        </div>

        {/* Banner grande ACADEMIA GOING */}
        <div className="max-w-6xl mx-auto relative z-10 mb-10 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl border border-white/10"
            style={{ background: `linear-gradient(100deg, ${COLORS.brand.red}, #E23B30)` }}>
            <IconGraduation size={30} />
            <span className="text-3xl md:text-5xl font-black tracking-tight" style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}>
              ACADEMIA GOING
            </span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-10">
          {/* Texto */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight" style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}>
              Capacítate. Crece. Gana más.
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mb-6">
              La plataforma de aprendizaje de Going App, para toda la comunidad: quienes conducen, hospedan,
              guían, operan y viajan. Cursos gratuitos en formato microlearning: texto, podcast, video y quizzes.
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
                { value: '5 escuelas',                                 label: 'Para cada rol' },
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

        {/* ── Tira de bienvenida (con sesión): continuar + riel de nivel ── */}
        {isAuthed && progress && (progress.completedCount > 0 || resumeCourse) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {/* Continúa donde quedaste */}
            {resumeCourse && (
              <Link href={`/academy/${resumeCourse.id}`}
                className="relative overflow-hidden rounded-2xl p-4 flex items-center gap-3 text-white shadow-sm hover:shadow-md transition-shadow"
                style={{ background: `linear-gradient(115deg, ${COLORS.brand.black} 0%, #3A241F 55%, ${COLORS.brand.red} 135%)` }}>
                <span className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                  <IconPlay size={20} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Continúa donde quedaste</p>
                  <p className="font-bold text-sm truncate">{COURSE_INDEX[resumeCourse.id].title}</p>
                  <div className="h-1.5 rounded-full bg-white/20 mt-1.5 overflow-hidden">
                    <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(90, Math.round((resumeCourse.lessonsCompleted / 5) * 100))}%` }} />
                  </div>
                </div>
                <span className="flex-shrink-0 bg-white text-sm font-bold px-3.5 py-2 rounded-xl" style={{ color: COLORS.brand.red }}>Seguir</span>
              </Link>
            )}
            {/* Riel de nivel Aliado */}
            <button onClick={() => setActiveTab('niveles')}
              className="text-left rounded-2xl p-4 border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 font-bold text-sm text-gray-900">
                  <IconMedal size={15} style={{ color: LEVEL_COLORS[progress.level.level] }} />
                  {progress.level.label}
                </span>
                <span className="text-xs font-semibold text-gray-400">{progress.completedCount}/{progress.totalCourses} cursos</span>
              </div>
              <div className="relative h-2 rounded-full bg-gray-100">
                <div className="absolute left-0 top-0 bottom-0 rounded-full"
                  style={{ width: `${Math.round((progress.completedCount / Math.max(1, progress.totalCourses)) * 100)}%`, background: `linear-gradient(90deg, ${LEVEL_COLORS.bronce}, ${COLORS.brand.red})` }} />
                {['bronce', 'plata', 'oro'].map((lv, i) => (
                  <span key={lv} className="absolute -top-1 w-4 h-4 rounded-full border-2 border-white"
                    style={{ left: `${i * 50}%`, transform: 'translateX(-50%)', backgroundColor: LEVEL_COLORS[lv] }} />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400">
                <span>Bronce</span><span>Plata</span><span>Oro</span>
              </div>
              {progress.level.next && (
                <p className="text-xs text-gray-500 mt-2">Siguiente: <strong className="text-gray-700">{progress.level.next.label}</strong></p>
              )}
            </button>
          </div>
        )}

        {/* ── ESCUELAS ── */}
        {activeTab === 'cursos' && (
          <div>
            {/* Nudge: el Tronco Común es la base — muéstralo mientras no esté completo */}
            {!['tc1', 'tc2', 'tc3'].every(id => completedIds.has(id)) && (
              <button onClick={() => setActiveTab('tronco')}
                className="w-full flex items-center gap-3 mb-6 rounded-2xl px-4 py-3 border text-left hover:shadow-sm transition-shadow"
                style={{ borderColor: `${COLORS.brand.red}33`, backgroundColor: COLORS.brand.redBg }}>
                <span className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: COLORS.brand.red }}>
                  <IconCheck size={18} />
                </span>
                <span className="flex-1 text-sm text-gray-700">
                  <strong className="text-gray-900">¿Recién empiezas?</strong> Completa primero el <strong>Tronco Común</strong> — es la base para todas las escuelas.
                </span>
                <IconArrowRight size={16} className="text-gray-400 flex-shrink-0" />
              </button>
            )}
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
                    <span>{s.name.replace('Escuela de ', '')}</span>
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
              {school.courses.map(course => {
                const st = courseById.get(course.id);
                const done = st?.completed ?? false;
                const started = !done && (((st?.lessonsCompleted ?? 0) > 0) || ((st?.quizBestScore ?? 0) > 0));
                const pct = done ? 100 : Math.min(90, Math.round(((st?.lessonsCompleted ?? 0) / 5) * 100));
                return (
                <div key={course.id}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col">
                  {/* Banda ilustrada */}
                  <div className="relative h-24 flex items-center justify-center overflow-hidden"
                    style={{ background: `radial-gradient(120% 120% at 80% -10%, ${school.color}2E, ${school.bg} 68%)` }}>
                    <span className={`absolute top-2.5 left-2.5 z-10 text-xs font-bold px-2 py-0.5 rounded-full ${done ? 'bg-green-100 text-green-700' : course.levelColor}`}>
                      {done ? 'Completado' : course.level}
                    </span>
                    {(done || started) && (
                      <span className="absolute top-2 right-2 z-10">
                        <ProgressRing pct={pct} done={done} color={school.color} />
                      </span>
                    )}
                    <CourseArt courseId={course.id} school={activeSchool} accent={school.color}
                      className="transition-transform duration-200 group-hover:scale-105 drop-shadow-sm" />
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-gray-900 text-sm leading-snug">{course.title}</h3>
                    <p className="text-xs font-medium mt-0.5 mb-2" style={{ color: school.color }}>{course.subtitle}</p>
                    <p className="text-gray-500 text-sm flex-1 mb-4 leading-relaxed">{course.desc}</p>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-3">
                      <span className="inline-flex items-center gap-1"><IconBook size={12} />{course.lessons} lecciones</span>
                      <span className="inline-flex items-center gap-1"><IconClock size={12} />{course.duration}</span>
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
                      style={done
                        ? { backgroundColor: '#DCFCE7', color: '#15803D' }
                        : { backgroundColor: school.color, color: COLORS.brand.white }}>
                      {done ? 'Repasar curso' : started ? 'Continuar' : 'Comenzar curso'}
                      <IconArrowRight size={16} />
                    </Link>
                  </div>
                </div>
                );
              })}
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
            {/* Progreso personalizado del usuario autenticado */}
            {isAuthed && progress && (
              <div className="rounded-2xl p-6 mb-6 text-white" style={{ background: `linear-gradient(135deg, ${COLORS.brand.black}, #1e293b)` }}>
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.brand.redLight }}>Tu progreso</p>
                    <h2 className="text-2xl font-black">{progress.level.label}</h2>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black" style={{ color: COLORS.brand.redLight }}>
                      {progress.completedCount}<span className="text-lg text-gray-400">/{progress.totalCourses}</span>
                    </div>
                    <div className="text-xs text-gray-400">cursos completados</div>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/15 overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.round((progress.completedCount / Math.max(1, progress.totalCourses)) * 100)}%`, backgroundColor: COLORS.brand.redLight }} />
                </div>
                {progress.level.next && (
                  <p className="text-sm text-gray-300">
                    Siguiente: <strong className="text-white">{progress.level.next.label}</strong> — {progress.level.next.requirement}
                  </p>
                )}
                {progress.badges.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Tus insignias ({progress.badges.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {progress.badges.map(b => (
                        <span key={b.code} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 border border-white/15">
                          🏅 {b.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Invitación a iniciar sesión (sin cuenta no hay progreso) */}
            {!isAuthed && (
              <div className="rounded-2xl p-6 mb-6 border border-gray-100 bg-white shadow-sm flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Sigue tu progreso y gana insignias</h2>
                  <p className="text-gray-500 text-sm">Inicia sesión para completar cursos, subir de nivel y ver tus insignias aquí.</p>
                </div>
                <Link href="/auth/login?from=/academy"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm hover:opacity-90"
                  style={{ backgroundColor: COLORS.brand.red }}>
                  Iniciar sesión
                </Link>
              </div>
            )}
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{isAuthed && progress ? 'Insignias por ganar' : 'Insignias por escuela'}</h3>
                {isAuthed && progress && (
                  <span className="text-xs font-semibold text-gray-400">
                    {[...SCHOOL_KEYS.map(k => `school:${k}`), 'course:c5', 'course:c4'].filter(c => earnedBadgeCodes.has(c)).length} de {SCHOOL_KEYS.length + 2}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  ...SCHOOL_KEYS.map(key => ({
                    Icon:   SCHOOLS[key].badgeIcon,
                    badge:  SCHOOLS[key].badge,
                    school: SCHOOLS[key].name,
                    color:  SCHOOLS[key].color,
                    code:   `school:${key}`,
                  })),
                  { Icon: IconShield, badge: 'Primeros Auxilios', school: 'Seguridad Certificada', color: COLORS.state.danger,  code: 'course:c5' },
                  { Icon: IconGlobe,  badge: 'Bilingüe Going App',    school: 'Inglés Turístico',   color: COLORS.state.success, code: 'course:c4' },
                ].map(b => {
                  const earned = earnedBadgeCodes.has(b.code);
                  const showLock = isAuthed && !!progress && !earned;
                  return (
                  <div key={b.badge}
                    className={`relative rounded-xl p-4 text-center border transition-all ${earned ? 'border-transparent' : 'border-gray-100 bg-gray-50'} ${showLock ? 'opacity-55 grayscale' : ''}`}
                    style={earned ? { background: `${b.color}12`, borderColor: `${b.color}40` } : undefined}>
                    {earned && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: b.color }}>
                        <IconCheck size={11} />
                      </span>
                    )}
                    {showLock && (
                      <span className="absolute top-2 right-2 text-gray-400"><IconLock size={13} /></span>
                    )}
                    <div className="flex justify-center mb-2" style={{ color: b.color }}>
                      <b.Icon size={28} />
                    </div>
                    <div className="text-xs font-bold text-gray-800">{b.badge}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{b.school}</div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Pre-lanzamiento (solo para quien no ha iniciado sesión) ── */}
        {!isAuthed && (
        <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="flex justify-center mb-4" style={{ color: COLORS.brand.red }}>
            <IconGraduation size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            La Academia abre con nosotros
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-2xl mx-auto mb-6">
            Going App está por arrancar en Ecuador. Todos los cursos son gratuitos y los vas a poder completar
            desde el primer día. Sé de las primeras personas en capacitarte y ganar tus insignias.
          </p>
          <Link href="/auth/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: COLORS.brand.red, color: COLORS.brand.white }}>
            Crear mi cuenta gratis
            <IconArrowRight size={16} />
          </Link>
        </div>
        )}
      </div>
    </div>
  );
}
