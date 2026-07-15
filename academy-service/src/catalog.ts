/**
 * CATÁLOGO DE REGLAS de la Academia Going App — fuente de verdad del BACKEND.
 *
 * El contenido rico (texto, quizzes, diapositivas) vive en el frontend
 * (frontend-webapp/src/app/academy). Aquí solo vive la METADATA que el backend
 * necesita para validar completaciones, otorgar insignias y calcular niveles:
 *   - qué courseIds existen (frontera de confianza: un id fuera de aquí = 400)
 *   - a qué escuela pertenece cada curso y si es del Tronco Común (obligatorio)
 *   - la insignia (badge) que otorga cada curso y cada escuela
 *   - los umbrales de los niveles Aliado (Bronce / Plata / Oro)
 *
 * ⚠️ Los courseIds DEBEN coincidir con SCHOOLS/TRONCO_COMUN del frontend
 * (academy/page.tsx). Si agregas un curso allá, agrégalo aquí.
 */

export type SchoolKey =
  | 'tronco'
  | 'conductores'
  | 'anfitriones'
  | 'guias'
  | 'operadores'
  | 'viajeros';

export interface CourseMeta {
  id: string;
  school: SchoolKey;
  title: string;
  /** Insignia que otorga completar este curso. */
  badgeCode: string;
  badgeLabel: string;
  /** true → parte del Tronco Común obligatorio. */
  required: boolean;
  /** Nº de lecciones (informativo; el gate de completación es el quiz). */
  lessons: number;
}

/** Insignia de MAESTRÍA por escuela — se otorga al completar TODOS sus cursos. */
export const SCHOOL_BADGES: Record<SchoolKey, { code: string; label: string }> = {
  tronco:      { code: 'school:tronco',      label: 'Proveedor Verificado Going App' },
  conductores: { code: 'school:conductores', label: 'Aliado del Volante' },
  anfitriones: { code: 'school:anfitriones', label: 'Superanfitrión Going App' },
  guias:       { code: 'school:guias',       label: 'Embajador Local Going App' },
  operadores:  { code: 'school:operadores',  label: 'Operador Certificado Going App' },
  viajeros:    { code: 'school:viajeros',    label: 'Viajero Going App Pro' },
};

const C = (
  id: string,
  school: SchoolKey,
  title: string,
  badgeLabel: string,
  lessons: number,
  required = false,
): CourseMeta => ({
  id,
  school,
  title,
  badgeCode: `course:${id}`,
  badgeLabel,
  required,
  lessons,
});

export const CATALOG: Record<string, CourseMeta> = {
  // ── Tronco Común (obligatorio para todos los roles) ──
  tc1: C('tc1', 'tronco', 'El ADN de Going App',        'Conoce el ADN Going App',   3, true),
  tc2: C('tc2', 'tronco', 'Uso de la Plataforma',       'Experto en la App',         4, true),
  tc3: C('tc3', 'tronco', 'Sostenibilidad y Respeto',   'Aliado Sostenible',         2, true),

  // ── Escuela de Conductores ──
  c1: C('c1', 'conductores', 'La Primera Impresión',        'Conductor Estrella',        3),
  c2: C('c2', 'conductores', 'Seguridad Vial Ecuador',      'Volante Seguro',            5),
  c3: C('c3', 'conductores', 'Mecánica Preventiva Básica',  'Mecánico Preventivo',       4),
  c4: C('c4', 'conductores', 'Inglés Turístico Básico',     'Bilingüe Going App',        6),
  c5: C('c5', 'conductores', 'Primeros Auxilios en Ruta',   'Primeros Auxilios',         7),

  // ── Escuela de Anfitriones ──
  a1: C('a1', 'anfitriones', 'Fotografía con el Celular',   'Fotógrafo Going App',       4),
  a2: C('a2', 'anfitriones', 'Limpieza Estándar Going App', 'Anfitrión Impecable',       3),
  a3: C('a3', 'anfitriones', 'Diseño con Bajo Presupuesto', 'Diseñador Anfitrión',       5),
  a4: C('a4', 'anfitriones', 'Manejo de Reseñas',           'Maestro de Reseñas',        3),

  // ── Escuela de Guías Locales ──
  g1: C('g1', 'guias', 'El Arte del Storytelling', 'Narrador Going App',        4),
  g2: C('g2', 'guias', 'Manejo de Grupos',         'Líder de Grupos',           5),
  g3: C('g3', 'guias', 'Seguridad en Exteriores',  'Guía de Naturaleza Seguro', 6),

  // ── Escuela de Operadores ──
  o1: C('o1', 'operadores', 'Logística de Grupos Grandes',           'Logístico Experto',      7),
  o2: C('o2', 'operadores', 'Normativas del Ministerio de Turismo',  'Operador en Regla',      4),
  o3: C('o3', 'operadores', 'Integración con la App Going App',      'Operador Integrado',     5),

  // ── Escuela de Viajeros ──
  v1: C('v1', 'viajeros', 'Viaja Inteligente con Going App', 'Viajero Going App Pro',  3),
  v2: C('v2', 'viajeros', 'Guía de Envíos',                  'Experto en Envíos',      2),
  v3: C('v3', 'viajeros', 'Pagos y Facturación',             'Maestro de Pagos',       2),
};

export const ALL_COURSE_IDS = Object.keys(CATALOG);
export const REQUIRED_COURSE_IDS = ALL_COURSE_IDS.filter((id) => CATALOG[id].required);
export const SPECIALIZATION_COURSE_IDS = ALL_COURSE_IDS.filter((id) => !CATALOG[id].required);

export type AcademyLevel = 'none' | 'bronce' | 'plata' | 'oro';

export interface LevelInfo {
  level: AcademyLevel;
  label: string;
  /** Cuánto falta para el SIGUIENTE nivel (null si ya es Oro). */
  next: { level: AcademyLevel; label: string; requirement: string } | null;
}

/**
 * Deriva el nivel Aliado a partir de los cursos completados.
 *   - Bronce: Tronco Común completo (los 3 cursos obligatorios).
 *   - Plata:  Bronce + ≥3 cursos de especialización.
 *   - Oro:    todos los cursos completados.
 *
 * (Los requisitos de estrellas 4.5★/4.8★ del diseño se muestran en la UI pero
 * el nivel por CURSOS es lo que este servicio computa y persiste.)
 */
export function deriveLevel(completedCourseIds: string[]): LevelInfo {
  const done = new Set(completedCourseIds.filter((id) => CATALOG[id]));
  const troncoDone = REQUIRED_COURSE_IDS.every((id) => done.has(id));
  const specCount = SPECIALIZATION_COURSE_IDS.filter((id) => done.has(id)).length;
  const allDone = ALL_COURSE_IDS.every((id) => done.has(id));

  if (allDone) {
    return { level: 'oro', label: 'Aliado Oro', next: null };
  }
  if (troncoDone && specCount >= 3) {
    return {
      level: 'plata',
      label: 'Aliado Plata',
      next: { level: 'oro', label: 'Aliado Oro', requirement: 'Completa todas las rutas de tu escuela' },
    };
  }
  if (troncoDone) {
    const faltan = Math.max(0, 3 - specCount);
    return {
      level: 'bronce',
      label: 'Aliado Bronce',
      next: { level: 'plata', label: 'Aliado Plata', requirement: `Completa ${faltan} curso(s) de especialización` },
    };
  }
  const faltanTronco = REQUIRED_COURSE_IDS.filter((id) => !done.has(id)).length;
  return {
    level: 'none',
    label: 'Sin nivel',
    next: { level: 'bronce', label: 'Aliado Bronce', requirement: `Completa el Tronco Común (${faltanTronco} restante(s))` },
  };
}
