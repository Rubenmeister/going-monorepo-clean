'use client';

/**
 * Cliente de la Academia Going App → academy-service (vía api-gateway).
 *
 * Todos los endpoints requieren sesión: authFetch añade el Bearer token y
 * maneja el refresh/401. El progreso es una MEJORA de la experiencia — si el
 * backend falla, las funciones devuelven null y la UI del curso sigue
 * funcionando (el contenido nunca depende del backend de progreso).
 */
import { authFetch } from '../providers/auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com';

export type AcademyLevel = 'none' | 'bronce' | 'plata' | 'oro';

export interface LevelInfo {
  level: AcademyLevel;
  label: string;
  next: { level: AcademyLevel; label: string; requirement: string } | null;
}

export interface BadgeView {
  code: string;
  label: string;
}

export interface CourseStatusView {
  id: string;
  title: string;
  school: string;
  required: boolean;
  lessons: number;
  lessonsCompleted: number;
  quizPassed: boolean;
  quizBestScore: number;
  completed: boolean;
}

export interface ProgressView {
  userId: string;
  level: LevelInfo;
  badges: BadgeView[];
  completedCount: number;
  totalCourses: number;
  courses: CourseStatusView[];
}

export interface CompleteCourseResult {
  progress: ProgressView;
  newlyAwardedBadges: BadgeView[];
  leveledUp: boolean;
  levelBefore: string;
  levelAfter: string;
}

/** Progreso del usuario autenticado. null si no hay sesión o el backend falla. */
export async function getAcademyProgress(): Promise<ProgressView | null> {
  try {
    const res = await authFetch(`${API_URL}/academy/progress`);
    if (!res.ok) return null;
    return (await res.json()) as ProgressView;
  } catch {
    return null;
  }
}

/** Marca una lección como vista (progreso parcial). */
export async function completeAcademyLesson(
  courseId: string,
  lessonId: string,
): Promise<ProgressView | null> {
  try {
    const res = await authFetch(`${API_URL}/academy/lessons/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, lessonId }),
    });
    if (!res.ok) return null;
    return (await res.json()) as ProgressView;
  } catch {
    return null;
  }
}

/**
 * Registra el resultado del quiz de un curso. Si aprueba, el backend otorga la
 * insignia y recalcula el nivel Aliado. Devuelve las insignias recién ganadas y
 * si subió de nivel (para la celebración).
 */
export async function completeAcademyCourse(
  courseId: string,
  quizScore: number,
  quizTotal: number,
): Promise<CompleteCourseResult | null> {
  try {
    const res = await authFetch(`${API_URL}/academy/courses/${encodeURIComponent(courseId)}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizScore, quizTotal }),
    });
    if (!res.ok) return null;
    return (await res.json()) as CompleteCourseResult;
  } catch {
    return null;
  }
}
