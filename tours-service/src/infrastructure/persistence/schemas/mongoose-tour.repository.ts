import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import {
  Tour,
  ITourRepository,
  TourSearchFilters,
} from '@going-monorepo-clean/domains-tour-core';
import {
  TourDocument,
  TourModelSchema,
} from './schemas/tour.schema';

@Injectable()
export class MongooseTourRepository implements ITourRepository {
  constructor(
    @InjectModel(TourModelSchema.name)
    private readonly model: Model<TourDocument>,
  ) {}

  async save(tour: Tour): Promise<Result<void, Error>> {
    try {
      const primitives = tour.toPrimitives();
      const newDoc = new this.model(primitives);
      await newDoc.save();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async update(tour: Tour): Promise<Result<void, Error>> {
    try {
      const primitives = tour.toPrimitives();
      await this.model.updateOne({ id: tour.id }, { $set: primitives }).exec();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findById(id: string): Promise<Result<Tour | null, Error>> {
    try {
      const doc = await this.model.findOne({ id }).exec();
      return ok(doc ? this.toDomain(doc) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByHostId(hostId: string): Promise<Result<Tour[], Error>> {
    try {
      const docs = await this.model.find({ hostId }).exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async searchPublished(filters: TourSearchFilters): Promise<Result<Tour[], Error>> {
    try {
      const query: any = { status: 'published' };
      if (filters.locationCity) query['location.city'] = filters.locationCity;
      if (filters.category) query.category = filters.category;
      if (filters.maxPrice) query['price.amount'] = { $lte: filters.maxPrice };

      const docs = await this.model.find(query).exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  private toDomain(doc: TourDocument): Tour {
    return Tour.fromPrimitives(doc.toObject() as any);
  }
}