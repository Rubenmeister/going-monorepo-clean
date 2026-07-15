import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  AcademyProgressRepository,
  AcademyProgressDoc,
} from './infrastructure/persistence/academy-progress.repository';
import { CourseProgress } from './infrastructure/schemas/academy-progress.schema';
import {
  CATALOG,
  SCHOOL_BADGES,
  ALL_COURSE_IDS,
  deriveLevel,
  LevelInfo,
  SchoolKey,
} from './catalog';

/** Ratio mínimo de aciertos para aprobar un quiz (2/3). */
const PASS_RATIO = 0.67;

export interface BadgeView {
  code: string;
  label: string;
}

export interface CourseStatusView {
  id: string;
  title: string;
  school: SchoolKey;
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

@Injectable()
export class AcademyService {
  private readonly logger = new Logger(AcademyService.name);

  constructor(private readonly repo: AcademyProgressRepository) {}

  // ── Lecturas ────────────────────────────────────────────────────────
  async getProgress(userId: string): Promise<ProgressView> {
    const doc = (await this.repo.findByUserId(userId)) ?? this.emptyDoc(userId);
    return this.toView(doc);
  }

  /**
   * Niveles de varios usuarios (S2S). Usado por el ranking de conductores del
   * transport-service: mejor nivel de Academia → mejor posición. Devuelve solo
   * los usuarios con algún progreso; el resto se asume nivel 'none' (rank 0).
   */
  async getLevelsForUsers(userIds: string[]): Promise<Record<string, { level: string; rank: number }>> {
    const RANK: Record<string, number> = { none: 0, bronce: 1, plata: 2, oro: 3 };
    const out: Record<string, { level: string; rank: number }> = {};
    const unique = [...new Set((userIds || []).filter(Boolean))].slice(0, 500);
    await Promise.all(
      unique.map(async (uid) => {
        const doc = await this.repo.findByUserId(uid);
        const level = doc?.level ?? 'none';
        out[uid] = { level, rank: RANK[level] ?? 0 };
      }),
    );
    return out;
  }

  // ── Escritura: completar una lección (progreso parcial) ─────────────
  async completeLesson(userId: string, courseId: string, lessonId: string): Promise<ProgressView> {
    this.assertCourse(courseId);
    if (!lessonId || typeof lessonId !== 'string') {
      throw new BadRequestException('lessonId requerido');
    }
    const doc = (await this.repo.findByUserId(userId)) ?? this.emptyDoc(userId);
    const cp = this.courseProgress(doc, courseId);
    if (!cp.lessonsCompleted.includes(lessonId)) {
      cp.lessonsCompleted.push(lessonId);
    }
    doc.courses[courseId] = cp;
    const saved = await this.repo.save(userId, doc);
    return this.toView(saved);
  }

  // ── Escritura: aprobar el curso (quiz) → insignias + nivel ──────────
  async completeCourse(
    userId: string,
    courseId: string,
    quizScore: number,
    quizTotal: number,
  ): Promise<CompleteCourseResult> {
    this.assertCourse(courseId);
    const score = Number.isFinite(quizScore) ? Math.max(0, Math.floor(quizScore)) : 0;
    const total = Number.isFinite(quizTotal) && quizTotal > 0 ? Math.floor(quizTotal) : 0;
    if (total <= 0) throw new BadRequestException('quizTotal debe ser > 0');
    const passed = score / total >= PASS_RATIO;

    const doc = (await this.repo.findByUserId(userId)) ?? this.emptyDoc(userId);
    const levelBefore = doc.level;
    const cp = this.courseProgress(doc, courseId);

    // Guardar mejor score siempre; marcar aprobado (idempotente).
    cp.quizTotal = total;
    if (score > cp.quizBestScore) cp.quizBestScore = score;

    const newlyAwarded: BadgeView[] = [];

    if (passed && !cp.quizPassed) {
      cp.quizPassed = true;
      cp.completedAt = new Date();
      if (!doc.completedCourseIds.includes(courseId)) {
        doc.completedCourseIds.push(courseId);
      }
      // Insignia del curso.
      const meta = CATALOG[courseId];
      newlyAwarded.push(...this.grant(doc, meta.badgeCode, meta.badgeLabel));
      // ¿Escuela completa? → insignia de maestría.
      newlyAwarded.push(...this.maybeAwardSchoolBadge(doc, meta.school));
    }
    doc.courses[courseId] = cp;

    // Recalcular nivel.
    const levelInfo = deriveLevel(doc.completedCourseIds);
    doc.level = levelInfo.level;

    const saved = await this.repo.save(userId, doc);
    return {
      progress: this.toView(saved),
      newlyAwardedBadges: passed ? newlyAwarded : [],
      leveledUp: levelInfo.level !== levelBefore,
      levelBefore,
      levelAfter: levelInfo.level,
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  private assertCourse(courseId: string): void {
    if (!courseId || !CATALOG[courseId]) {
      throw new BadRequestException(`Curso desconocido: ${courseId}`);
    }
  }

  private courseProgress(doc: AcademyProgressDoc, courseId: string): CourseProgress {
    const existing = doc.courses[courseId];
    return {
      lessonsCompleted: existing?.lessonsCompleted ? [...existing.lessonsCompleted] : [],
      quizPassed: existing?.quizPassed ?? false,
      quizBestScore: existing?.quizBestScore ?? 0,
      quizTotal: existing?.quizTotal ?? 0,
      completedAt: existing?.completedAt,
    };
  }

  private grant(doc: AcademyProgressDoc, code: string, label: string): BadgeView[] {
    if (doc.badges.includes(code)) return [];
    doc.badges.push(code);
    return [{ code, label }];
  }

  private maybeAwardSchoolBadge(doc: AcademyProgressDoc, school: SchoolKey): BadgeView[] {
    const schoolCourses = ALL_COURSE_IDS.filter((id) => CATALOG[id].school === school);
    const allDone = schoolCourses.every((id) => doc.completedCourseIds.includes(id));
    if (!allDone) return [];
    const badge = SCHOOL_BADGES[school];
    return this.grant(doc, badge.code, badge.label);
  }

  private emptyDoc(userId: string): AcademyProgressDoc {
    return { userId, courses: {}, completedCourseIds: [], badges: [], level: 'none' };
  }

  private badgeLabel(code: string): string {
    // course:* → del catálogo; school:* → de SCHOOL_BADGES.
    if (code.startsWith('course:')) {
      const id = code.slice('course:'.length);
      return CATALOG[id]?.badgeLabel ?? code;
    }
    if (code.startsWith('school:')) {
      const key = code.slice('school:'.length) as SchoolKey;
      return SCHOOL_BADGES[key]?.label ?? code;
    }
    return code;
  }

  private toView(doc: AcademyProgressDoc): ProgressView {
    const courses: CourseStatusView[] = ALL_COURSE_IDS.map((id) => {
      const meta = CATALOG[id];
      const cp = doc.courses[id];
      return {
        id,
        title: meta.title,
        school: meta.school,
        required: meta.required,
        lessons: meta.lessons,
        lessonsCompleted: cp?.lessonsCompleted?.length ?? 0,
        quizPassed: cp?.quizPassed ?? false,
        quizBestScore: cp?.quizBestScore ?? 0,
        completed: cp?.quizPassed ?? false,
      };
    });
    return {
      userId: doc.userId,
      level: deriveLevel(doc.completedCourseIds),
      badges: doc.badges.map((code) => ({ code, label: this.badgeLabel(code) })),
      completedCount: doc.completedCourseIds.length,
      totalCourses: ALL_COURSE_IDS.length,
      courses,
    };
  }
}
