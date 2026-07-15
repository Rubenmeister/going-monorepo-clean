/**
 * Orden y navegación de cursos de la Academia — compartido por ambas vistas de
 * curso (MultiFormatCourse y LegacyCourseView) para ofrecer "Siguiente curso"
 * al terminar. Los IDs y su agrupación por escuela coinciden con el catálogo
 * del backend (academy-service/src/catalog.ts) y con academy/page.tsx.
 */

export interface CourseNavMeta {
  id: string;
  title: string;
  school: string;
}

/** Cursos por escuela, en orden de progresión. */
export const SCHOOL_COURSE_ORDER: Record<string, CourseNavMeta[]> = {
  tronco: [
    { id: 'tc1', title: 'El ADN de Going App', school: 'tronco' },
    { id: 'tc2', title: 'Uso de la Plataforma', school: 'tronco' },
    { id: 'tc3', title: 'Sostenibilidad y Respeto', school: 'tronco' },
  ],
  conductores: [
    { id: 'c1', title: 'La Primera Impresión', school: 'conductores' },
    { id: 'c2', title: 'Seguridad Vial Ecuador', school: 'conductores' },
    { id: 'c3', title: 'Mecánica Preventiva Básica', school: 'conductores' },
    { id: 'c4', title: 'Inglés Turístico Básico', school: 'conductores' },
    { id: 'c5', title: 'Primeros Auxilios en Ruta', school: 'conductores' },
  ],
  anfitriones: [
    { id: 'a1', title: 'Fotografía con el Celular', school: 'anfitriones' },
    { id: 'a2', title: 'Limpieza Estándar Going App', school: 'anfitriones' },
    { id: 'a3', title: 'Diseño con Bajo Presupuesto', school: 'anfitriones' },
    { id: 'a4', title: 'Manejo de Reseñas', school: 'anfitriones' },
  ],
  guias: [
    { id: 'g1', title: 'El Arte del Storytelling', school: 'guias' },
    { id: 'g2', title: 'Manejo de Grupos', school: 'guias' },
    { id: 'g3', title: 'Seguridad en Exteriores', school: 'guias' },
  ],
  operadores: [
    { id: 'o1', title: 'Logística de Grupos Grandes', school: 'operadores' },
    { id: 'o2', title: 'Normativas del Ministerio de Turismo', school: 'operadores' },
    { id: 'o3', title: 'Integración con la App Going App', school: 'operadores' },
  ],
  viajeros: [
    { id: 'v1', title: 'Viaja Inteligente con Going App', school: 'viajeros' },
    { id: 'v2', title: 'Guía de Envíos', school: 'viajeros' },
    { id: 'v3', title: 'Pagos y Facturación', school: 'viajeros' },
  ],
};

const FLAT: CourseNavMeta[] = Object.values(SCHOOL_COURSE_ORDER).flat();

/** El siguiente curso de la MISMA escuela, o null si es el último. */
export function nextCourse(courseId: string): CourseNavMeta | null {
  const meta = FLAT.find((c) => c.id === courseId);
  if (!meta) return null;
  const list = SCHOOL_COURSE_ORDER[meta.school] ?? [];
  const idx = list.findIndex((c) => c.id === courseId);
  if (idx < 0 || idx >= list.length - 1) return null;
  return list[idx + 1];
}
