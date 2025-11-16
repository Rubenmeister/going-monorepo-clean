import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import {
  Experience,
  IExperienceRepository,
  ExperienceSearchFilters,
} from '@going-monorepo-clean/domains-experience-core';
import {
  ExperienceDocument,
  ExperienceModelSchema,
} from './schemas/experience.schema';

@Injectable()
export class MongooseExperienceRepository implements IExperienceRepository {
  constructor(
    @InjectModel(ExperienceModelSchema.name)
    private readonly model: Model<ExperienceDocument>,
  ) {}

  async save(experience: Experience): Promise<Result<void, Error>> {
    try {
      const primitives = experience.toPrimitives();
      const newDoc = new this.model(primitives);
      await newDoc.save();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async update(experience: Experience): Promise<Result<void, Error>> {
    try {
      const primitives = experience.toPrimitives();
      await this.model.updateOne({ id: experience.id }, { $set: primitives }).exec();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findById(id: string): Promise<Result<Experience | null, Error>> {
    try {
      const doc = await this.model.findOne({ id }).exec();
      return ok(doc ? this.toDomain(doc) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByHostId(hostId: string): Promise<Result<Experience[], Error>> {
    try {
      const docs = await this.model.find({ hostId }).exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async searchPublished(filters: ExperienceSearchFilters): Promise<Result<Experience[], Error>> {
    try {
      const query: any = { status: 'published' };
      if (filters.locationCity) query['location.city'] = filters.locationCity;
      if (filters.maxPrice) query['price.amount'] = { $lte: filters.maxPrice };

      const docs = await this.model.find(query).exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  private toDomain(doc: ExperienceDocument): Experience {
    return Experience.fromPrimitives(doc.toObject() as any);
  }
}
