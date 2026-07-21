'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { COLORS } from '../../components/design-tokens';
import { MULTIFORMAT_COURSES, MultiFormatCourse } from '../multiformat-course';
import { IconBook, IconArrowLeft } from '../../components/icons';

/* ─────────────────────────────────────────────
   DISPATCHER
   Los 21 cursos usan MultiFormatCourse (Leer / Manual / Escuchar / Ver /
   Evaluación). Un courseId desconocido cae a un estado "curso no encontrado".
   (La antigua vista de lecciones LegacyCourseView + COURSES_DB se eliminó: era
   código muerto — ningún curso la renderizaba.)
   ───────────────────────────────────────────── */
export default function CoursePage() {
  const params = useParams();
  const courseId = params?.courseId as string;

  if (courseId && MULTIFORMAT_COURSES[courseId]) {
    return <MultiFormatCourse courseId={courseId} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 text-white" style={{ backgroundColor: COLORS.brand.red }}>
          <IconBook size={36} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Curso en construcción</h1>
        <p className="text-gray-500 mb-6">Este curso estará disponible muy pronto. Mientras tanto, prueba otro.</p>
        <Link href="/academy"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: COLORS.brand.red }}>
          <IconArrowLeft size={16} />
          Ver todos los cursos
        </Link>
      </div>
    </div>
  );
}
