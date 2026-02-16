import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import {
  Course,
  ICourseRepository,
  CourseSearchFilters,
} from '@going-monorepo-clean/domains-academy-core';
import {
  CourseDocument,
  CourseModelSchema,
} from './course.schema';

@Injectable()
export class MongooseCourseRepository implements ICourseRepository {
  constructor(
    @InjectModel(CourseModelSchema.name)
    private readonly model: Model<CourseDocument>,
  ) {}

  async save(course: Course): Promise<Result<void, Error>> {
    try {
      const primitives = course.toPrimitives();
      const newDoc = new this.model(primitives);
      await newDoc.save();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async update(course: Course): Promise<Result<void, Error>> {
    try {
      const primitives = course.toPrimitives();
      await this.model.updateOne({ id: course.id }, { $set: primitives }).exec();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findById(id: string): Promise<Result<Course | null, Error>> {
    try {
      const doc = await this.model.findOne({ id }).exec();
      return ok(doc ? this.toDomain(doc) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByInstructorId(instructorId: string): Promise<Result<Course[], Error>> {
    try {
      const docs = await this.model.find({ instructorId }).exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async searchPublished(filters: CourseSearchFilters): Promise<Result<Course[], Error>> {
    try {
      const query: any = { status: 'published' };
      if (filters.category) query.category = filters.category;
      if (filters.level) query.level = filters.level;
      if (filters.maxPrice) query['price.amount'] = { $lte: filters.maxPrice };
      if (filters.title) query.title = { $regex: filters.title, $options: 'i' };

      const docs = await this.model.find(query).exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  private toDomain(doc: CourseDocument): Course {
    return Course.fromPrimitives(doc.toObject() as any);
  }
}
