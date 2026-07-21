/**
 * Catálogo canónico de cursos de la Academia (frontend) — FUENTE ÚNICA de la
 * lista de cursos, su orden y a qué escuela pertenecen.
 *
 * Antes esta lista estaba duplicada en course-nav.ts, en page.tsx (SCHOOLS) y en
 * CourseArt/multiformat. Aquí vive una sola vez; los consumidores derivan de acá.
 * (El backend academy-service/src/catalog.ts es un servicio aparte — debe
 * mantenerse en sync manualmente, es la frontera de otro deploy.)
 */

export type SchoolKey = 'tronco' | 'conductores' | 'anfitriones' | 'guias' | 'operadores' | 'viajeros';

export interface CatalogCourse {
  id: string;
  school: SchoolKey;
  title: string;
}

/** Cursos en orden de progresión, agrupados por escuela. */
export const CATALOG: CatalogCourse[] = [
  { id: 'tc1', school: 'tronco', title: 'El ADN de Going App' },
  { id: 'tc2', school: 'tronco', title: 'Uso de la Plataforma' },
  { id: 'tc3', school: 'tronco', title: 'Sostenibilidad y Respeto' },

  { id: 'c1', school: 'conductores', title: 'La Primera Impresión' },
  { id: 'c2', school: 'conductores', title: 'Seguridad Vial Ecuador' },
  { id: 'c3', school: 'conductores', title: 'Mecánica Preventiva Básica' },
  { id: 'c4', school: 'conductores', title: 'Inglés Turístico Básico' },
  { id: 'c5', school: 'conductores', title: 'Primeros Auxilios en Ruta' },
  { id: 'c6', school: 'conductores', title: 'Atención al Cliente' },

  { id: 'a1', school: 'anfitriones', title: 'Fotografía con el Celular' },
  { id: 'a2', school: 'anfitriones', title: 'Limpieza Estándar Going App' },
  { id: 'a3', school: 'anfitriones', title: 'Diseño con Bajo Presupuesto' },
  { id: 'a4', school: 'anfitriones', title: 'Manejo de Reseñas' },

  { id: 'g1', school: 'guias', title: 'El Arte del Storytelling' },
  { id: 'g2', school: 'guias', title: 'Manejo de Grupos' },
  { id: 'g3', school: 'guias', title: 'Seguridad en Exteriores' },

  { id: 'o1', school: 'operadores', title: 'Logística de Grupos Grandes' },
  { id: 'o2', school: 'operadores', title: 'Normativas del Ministerio de Turismo' },
  { id: 'o3', school: 'operadores', title: 'Integración con la App Going App' },

  { id: 'v1', school: 'viajeros', title: 'Viaja Inteligente con Going App' },
  { id: 'v2', school: 'viajeros', title: 'Guía de Envíos' },
  { id: 'v3', school: 'viajeros', title: 'Pagos y Facturación' },
];

const SCHOOL_BY_PREFIX: Record<string, SchoolKey> = { c: 'conductores', a: 'anfitriones', g: 'guias', o: 'operadores', v: 'viajeros' };

/** Deriva la escuela de un courseId por su prefijo (tc* = tronco). */
export function schoolKeyOf(courseId: string): SchoolKey {
  if (courseId.startsWith('tc')) return 'tronco';
  return SCHOOL_BY_PREFIX[courseId[0]] || 'viajeros';
}

/** El siguiente curso de la MISMA escuela, o null si es el último. */
export function nextCourse(courseId: string): CatalogCourse | null {
  const meta = CATALOG.find((c) => c.id === courseId);
  if (!meta) return null;
  const list = CATALOG.filter((c) => c.school === meta.school);
  const idx = list.findIndex((c) => c.id === courseId);
  if (idx < 0 || idx >= list.length - 1) return null;
  return list[idx + 1];
}
