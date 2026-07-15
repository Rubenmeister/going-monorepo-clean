'use client';

/**
 * Ilustraciones SVG por curso de la Academia — pequeñas escenas que muestran de
 * qué trata cada curso (mapa/ruta, paquete, tarjeta, etc.) en vez de un ícono
 * genérico. Inline (sin archivos de imagen): livianas, nítidas y theme-friendly.
 *
 * Se elige por courseId; si no hay motivo específico, cae al motivo de la
 * escuela. Todas dibujan dentro de un viewBox 120x86 pensado para la "banda"
 * de la tarjeta.
 */
import { ReactNode } from 'react';

type Motif = (a: string) => ReactNode; // a = color de acento de la escuela

const routeMap: Motif = (a) => (
  <>
    <rect x="38" y="14" width="44" height="62" rx="9" fill="#fff" stroke={a} strokeWidth="1.6" opacity="0.95" />
    <path d="M47 32 q13 -8 26 0" fill="none" stroke="#7FB6FF" strokeWidth="2.2" strokeDasharray="3 3" strokeLinecap="round" />
    <circle cx="73" cy="32" r="4.5" fill={a} />
    <circle cx="73" cy="32" r="8" fill="none" stroke={a} strokeWidth="1.4" opacity="0.4" />
    <path d="M45 50 h30 M45 57 h20" stroke="#E7C8C1" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M30 70 l7 -3 7 3 7 -3 7 3 7 -3 7 3" fill="none" stroke={a} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </>
);

const parcel: Motif = (a) => (
  <>
    <path d="M40 34 l20 -11 20 11 v24 l-20 11 -20 -11 z" fill="#fff" stroke={a} strokeWidth="1.6" />
    <path d="M40 34 l20 11 20 -11 M60 45 v24" fill="none" stroke={a} strokeWidth="1.4" opacity="0.55" />
    <circle cx="60" cy="18" r="7" fill={a} />
    <path d="M60 15 v3 l2 1.5" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
  </>
);

const payment: Motif = (a) => (
  <>
    <rect x="30" y="30" width="46" height="30" rx="6" fill="#fff" stroke={a} strokeWidth="1.6" />
    <rect x="30" y="37" width="46" height="7" fill={a} opacity="0.85" />
    <rect x="36" y="50" width="14" height="3.5" rx="1.75" fill={a} opacity="0.5" />
    <circle cx="74" cy="50" r="12" fill="#fff" stroke={a} strokeWidth="1.6" />
    <path d="M74 43 v14 M70 47 h6 a2.2 2.2 0 010 4.4 h-4.5 a2.2 2.2 0 000 4.4 h6" fill="none" stroke={a} strokeWidth="1.8" strokeLinecap="round" />
  </>
);

const heartHands: Motif = (a) => (
  <>
    <path d="M60 30 c2 -6 -5 -8 -7 -3 c-1 3 2 6 7 10 c5 -4 8 -7 7 -10 c-2 -5 -9 -3 -7 3z" fill={a} />
    <path d="M34 66 c4 -10 12 -12 18 -8 M86 66 c-4 -10 -12 -12 -18 -8" fill="none" stroke={a} strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
    <circle cx="30" cy="58" r="5" fill="#fff" stroke={a} strokeWidth="1.6" />
    <circle cx="90" cy="58" r="5" fill="#fff" stroke={a} strokeWidth="1.6" />
  </>
);

const appPhone: Motif = (a) => (
  <>
    <rect x="44" y="14" width="32" height="60" rx="7" fill="#fff" stroke={a} strokeWidth="1.6" />
    <rect x="49" y="21" width="22" height="14" rx="3" fill={a} opacity="0.85" />
    <circle cx="55" cy="45" r="3" fill={a} /><rect x="61" y="43" width="12" height="3.5" rx="1.75" fill="#E7C8C1" />
    <circle cx="55" cy="55" r="3" fill={a} opacity="0.6" /><rect x="61" y="53" width="10" height="3.5" rx="1.75" fill="#E7C8C1" />
    <circle cx="60" cy="68" r="2.4" fill={a} />
  </>
);

const leaf: Motif = (a) => (
  <>
    <path d="M40 66 c0 -22 18 -34 40 -34 c0 22 -18 34 -40 34z" fill={a} opacity="0.9" />
    <path d="M46 60 q16 -14 30 -24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M36 70 q4 -6 10 -10" fill="none" stroke={a} strokeWidth="2.2" strokeLinecap="round" />
  </>
);

const steeringGreeting: Motif = (a) => (
  <>
    <circle cx="60" cy="44" r="22" fill="#fff" stroke={a} strokeWidth="2" />
    <circle cx="60" cy="44" r="7" fill={a} />
    <path d="M60 44 L60 22 M60 44 L41 55 M60 44 L79 55" stroke={a} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M28 30 q4 -8 12 -6" fill="none" stroke={a} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
  </>
);

const roadShield: Motif = (a) => (
  <>
    <path d="M40 74 l20 -46 20 46z" fill="#fff" stroke={a} strokeWidth="1.6" />
    <path d="M60 40 v26" stroke={a} strokeWidth="2.6" strokeDasharray="4 5" strokeLinecap="round" />
    <path d="M74 26 c8 2 8 2 8 10 c0 8 -6 11 -8 12 c-2 -1 -8 -4 -8 -12 c0 -8 0 -8 8 -10z" fill={a} />
    <path d="M71 35 l2.5 2.5 4 -4.5" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </>
);

const wrench: Motif = (a) => (
  <>
    <path d="M44 68 l22 -22 M40 72 a4 4 0 006 0 l18 -18 a10 10 0 10-6 -6 l-18 18 a4 4 0 000 6z" fill={a} />
    <circle cx="76" cy="38" r="3.5" fill="#fff" />
    <circle cx="60" cy="44" r="26" fill="none" stroke={a} strokeWidth="1.4" strokeDasharray="2 4" opacity="0.4" />
  </>
);

const chatBilingual: Motif = (a) => (
  <>
    <rect x="30" y="28" width="34" height="24" rx="7" fill="#fff" stroke={a} strokeWidth="1.6" />
    <path d="M40 52 l-4 8 12 -6z" fill="#fff" stroke={a} strokeWidth="1.6" />
    <text x="47" y="44" textAnchor="middle" fontSize="11" fontWeight="800" fill={a}>ES</text>
    <rect x="58" y="42" width="34" height="24" rx="7" fill={a} />
    <path d="M82 66 l4 8 -12 -6z" fill={a} />
    <text x="75" y="58" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">EN</text>
  </>
);

const firstAid: Motif = (a) => (
  <>
    <rect x="34" y="30" width="52" height="38" rx="8" fill="#fff" stroke={a} strokeWidth="1.6" />
    <path d="M50 26 h20 v6 h-20z" fill={a} />
    <path d="M60 40 v18 M51 49 h18" stroke={a} strokeWidth="4" strokeLinecap="round" />
  </>
);

const camera: Motif = (a) => (
  <>
    <rect x="32" y="34" width="56" height="36" rx="8" fill="#fff" stroke={a} strokeWidth="1.6" />
    <path d="M46 34 l4 -6 h20 l4 6" fill="#fff" stroke={a} strokeWidth="1.6" />
    <circle cx="60" cy="52" r="11" fill="none" stroke={a} strokeWidth="2" />
    <circle cx="60" cy="52" r="5" fill={a} />
    <circle cx="80" cy="42" r="2.4" fill={a} />
  </>
);

const sparkleClean: Motif = (a) => (
  <>
    <path d="M60 24 l4 12 12 4 -12 4 -4 12 -4 -12 -12 -4 12 -4z" fill={a} />
    <path d="M84 54 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z" fill={a} opacity="0.7" />
    <path d="M36 58 l1.6 5 5 1.6 -5 1.6 -1.6 5 -1.6 -5 -5 -1.6 5 -1.6z" fill={a} opacity="0.55" />
  </>
);

const palette: Motif = (a) => (
  <>
    <path d="M60 26 c18 0 28 12 28 24 c0 8 -8 10 -14 10 c-6 0 -8 6 -2 10 c-4 4 -12 4 -18 0 c-12 -8 -14 -20 -8 -30 c4 -8 12 -14 24 -14 z" fill="#fff" stroke={a} strokeWidth="1.6" />
    <circle cx="52" cy="40" r="3.5" fill={a} /><circle cx="66" cy="36" r="3.5" fill={a} opacity="0.7" /><circle cx="74" cy="46" r="3.5" fill={a} opacity="0.5" />
  </>
);

const reviewStar: Motif = (a) => (
  <>
    <rect x="32" y="30" width="56" height="34" rx="9" fill="#fff" stroke={a} strokeWidth="1.6" />
    <path d="M46 64 l-4 9 12 -6z" fill="#fff" stroke={a} strokeWidth="1.6" />
    <path d="M60 38 l3.2 6.6 7.2 1 -5.2 5.1 1.2 7.2 -6.4 -3.4 -6.4 3.4 1.2 -7.2 -5.2 -5.1 7.2 -1z" fill={a} />
  </>
);

const storyBook: Motif = (a) => (
  <>
    <path d="M60 30 c-8 -5 -18 -5 -24 0 v34 c6 -5 16 -5 24 0 c8 -5 18 -5 24 0 v-34 c-6 -5 -16 -5 -24 0z" fill="#fff" stroke={a} strokeWidth="1.6" />
    <path d="M60 30 v34" stroke={a} strokeWidth="1.4" opacity="0.5" />
    <path d="M42 40 h12 M42 47 h12 M66 40 h12 M66 47 h12" stroke="#E7C8C1" strokeWidth="1.8" strokeLinecap="round" />
  </>
);

const groupPeople: Motif = (a) => (
  <>
    <circle cx="45" cy="40" r="7" fill={a} opacity="0.7" /><path d="M33 66 c0 -9 6 -14 12 -14 c6 0 12 5 12 14z" fill={a} opacity="0.7" />
    <circle cx="75" cy="40" r="7" fill={a} opacity="0.85" /><path d="M63 66 c0 -9 6 -14 12 -14 c6 0 12 5 12 14z" fill={a} opacity="0.85" />
    <circle cx="60" cy="34" r="8.5" fill={a} /><path d="M45 68 c0 -11 7 -17 15 -17 c8 0 15 6 15 17z" fill={a} />
  </>
);

const mountain: Motif = (a) => (
  <>
    <circle cx="80" cy="30" r="7" fill={a} opacity="0.6" />
    <path d="M28 70 l20 -34 12 18 8 -12 24 28z" fill={a} opacity="0.9" />
    <path d="M42 47 l6 -11 5 8" fill="#fff" opacity="0.8" />
  </>
);

const clipboard: Motif = (a) => (
  <>
    <rect x="40" y="24" width="40" height="52" rx="7" fill="#fff" stroke={a} strokeWidth="1.6" />
    <rect x="50" y="20" width="20" height="10" rx="3" fill={a} />
    <path d="M48 42 l3 3 5 -6 M48 54 l3 3 5 -6 M48 66 l3 3 5 -6" stroke={a} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M60 42 h12 M60 54 h12 M60 66 h10" stroke="#E7C8C1" strokeWidth="2" strokeLinecap="round" />
  </>
);

const document: Motif = (a) => (
  <>
    <path d="M42 22 h26 l12 12 v40 a4 4 0 01-4 4 h-34 a4 4 0 01-4 -4 v-48 a4 4 0 014 -4z" fill="#fff" stroke={a} strokeWidth="1.6" />
    <path d="M68 22 v12 h12" fill="none" stroke={a} strokeWidth="1.6" />
    <path d="M48 48 h24 M48 56 h24 M48 64 h16" stroke="#E7C8C1" strokeWidth="2" strokeLinecap="round" />
    <circle cx="70" cy="66" r="9" fill={a} opacity="0.9" /><path d="M66 66 l3 3 5 -5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </>
);

const SCHOOL_MOTIF: Record<string, Motif> = {
  tronco: heartHands,
  conductores: steeringGreeting,
  anfitriones: camera,
  guias: storyBook,
  operadores: clipboard,
  viajeros: routeMap,
};

const COURSE_MOTIF: Record<string, Motif> = {
  // Tronco
  tc1: heartHands, tc2: appPhone, tc3: leaf,
  // Conductores
  c1: steeringGreeting, c2: roadShield, c3: wrench, c4: chatBilingual, c5: firstAid,
  // Anfitriones
  a1: camera, a2: sparkleClean, a3: palette, a4: reviewStar,
  // Guías
  g1: storyBook, g2: groupPeople, g3: mountain,
  // Operadores
  o1: clipboard, o2: document, o3: appPhone,
  // Viajeros
  v1: routeMap, v2: parcel, v3: payment,
};

export function CourseArt({
  courseId,
  school,
  accent,
  className,
}: {
  courseId: string;
  school: string;
  accent: string;
  className?: string;
}) {
  const motif = COURSE_MOTIF[courseId] || SCHOOL_MOTIF[school] || routeMap;
  return (
    <svg viewBox="0 0 120 86" width="112" height="80" className={className} aria-hidden="true">
      {motif(accent)}
    </svg>
  );
}
