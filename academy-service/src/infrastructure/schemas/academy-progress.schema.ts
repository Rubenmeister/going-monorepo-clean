import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/** Estado de un curso para un usuario. */
export interface CourseProgress {
  lessonsCompleted: string[];
  quizPassed: boolean;
  quizBestScore: number;
  quizTotal: number;
  completedAt?: Date;
}

@Schema({ timestamps: true, collection: 'academy_progress' })
export class AcademyProgressSchema extends Document {
  @Prop({ required: true, unique: true, index: true })
  userId: string;

  /**
   * Mapa courseId → CourseProgress. Se usa Object (Mixed) — igual que
   * gamification.achievements — porque las claves son dinámicas (los courseIds
   * del catálogo). Mongoose no rastrea mutaciones profundas en Mixed, por eso
   * el repositorio siempre reescribe el objeto completo con markModified.
   */
  @Prop({ type: Object, default: {} })
  courses: Record<string, CourseProgress>;

  /** Convenience derivado: ids de cursos con quiz aprobado. */
  @Prop({ type: [String], default: [] })
  completedCourseIds: string[];

  /** Insignias otorgadas (course:* y school:*). */
  @Prop({ type: [String], default: [] })
  badges: string[];

  /** Nivel Aliado derivado: none | bronce | plata | oro. */
  @Prop({ default: 'none' })
  level: string;
}

export const AcademyProgressSchemaDefinition =
  SchemaFactory.createForClass(AcademyProgressSchema);
