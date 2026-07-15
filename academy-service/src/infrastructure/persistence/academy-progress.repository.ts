import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AcademyProgressSchema,
  CourseProgress,
} from '../schemas/academy-progress.schema';

export interface AcademyProgressDoc {
  userId: string;
  courses: Record<string, CourseProgress>;
  completedCourseIds: string[];
  badges: string[];
  level: string;
  updatedAt?: Date;
}

@Injectable()
export class AcademyProgressRepository {
  private readonly logger = new Logger(AcademyProgressRepository.name);

  constructor(
    @InjectModel(AcademyProgressSchema.name)
    private readonly model: Model<AcademyProgressSchema>,
  ) {}

  async findByUserId(userId: string): Promise<AcademyProgressDoc | null> {
    try {
      const doc = await this.model.findOne({ userId }).lean().exec();
      return doc ? this.toDoc(doc) : null;
    } catch (e) {
      this.logger.error(`findByUserId error: ${e}`);
      return null;
    }
  }

  /**
   * Reescribe el estado completo del usuario. Con campos Mixed (courses) es
   * más seguro un $set del objeto entero que mutaciones parciales.
   */
  async save(userId: string, state: Partial<AcademyProgressDoc>): Promise<AcademyProgressDoc> {
    try {
      const doc = await this.model
        .findOneAndUpdate(
          { userId },
          { $set: { ...state, userId } },
          { new: true, upsert: true, setDefaultsOnInsert: true },
        )
        .lean()
        .exec();
      return this.toDoc(doc);
    } catch (e) {
      this.logger.error(`save error: ${e}`);
      throw e;
    }
  }

  private toDoc(doc: any): AcademyProgressDoc {
    return {
      userId: doc.userId,
      courses: doc.courses ?? {},
      completedCourseIds: doc.completedCourseIds ?? [],
      badges: doc.badges ?? [],
      level: doc.level ?? 'none',
      updatedAt: doc.updatedAt,
    };
  }
}
