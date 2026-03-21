import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import {
  Accommodation,
  IAccommodationRepository,
  SearchFilters,
} from '@going-monorepo-clean/domains-accommodation-core';
import {
  AccommodationDocument,
  AccommodationModelSchema,
} from './schemas/accommodation.schema';
import {
  PaginationDto,
  PaginatedResult,
  getPaginationOptions,
  createPaginatedResponse,
} from '@going-monorepo-clean/shared-database';

@Injectable()
export class MongooseAccommodationRepository
  implements IAccommodationRepository
{
  constructor(
    @InjectModel(AccommodationModelSchema.name)
    private readonly model: Model<AccommodationDocument>
  ) {}

  async save(accommodation: Accommodation): Promise<Result<void, Error>> {
    try {
      const primitives = accommodation.toPrimitives();
      const newDoc = new this.model(primitives);
      await newDoc.save();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async update(accommodation: Accommodation): Promise<Result<void, Error>> {
    try {
      const primitives = accommodation.toPrimitives();
      await this.model
        .updateOne({ id: accommodation.id }, { $set: primitives })
        .exec();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findById(id: string): Promise<Result<Accommodation | null, Error>> {
    try {
      const doc = await this.model.findOne({ id }).exec();
      return ok(doc ? this.toDomain(doc) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByHostId(hostId: string): Promise<Result<Accommodation[], Error>> {
    try {
      const docs = await this.model.find({ hostId }).exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByHostIdPaginated(
    hostId: string,
    pagination?: PaginationDto
  ): Promise<Result<PaginatedResult<Accommodation>, Error>> {
    try {
      const { skip, limit } = getPaginationOptions(pagination);
      const [docs, total] = await Promise.all([
        this.model.find({ hostId }).skip(skip).limit(limit).exec(),
        this.model.countDocuments({ hostId }),
      ]);
      return ok(
        createPaginatedResponse(docs.map(this.toDomain), total, skip, limit)
      );
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async search(
    filters: SearchFilters
  ): Promise<Result<Accommodation[], Error>> {
    try {
      const query: any = { status: 'published' };
      if (filters.city) query['location.city'] = filters.city;
      if (filters.country) query['location.country'] = filters.country;
      if (filters.capacity) query.capacity = { $gte: filters.capacity };

      const docs = await this.model.find(query).exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async searchPaginated(
    filters: SearchFilters,
    pagination?: PaginationDto
  ): Promise<Result<PaginatedResult<Accommodation>, Error>> {
    try {
      const { skip, limit } = getPaginationOptions(pagination);
      const query: any = { status: 'published' };
      if (filters.city) query['location.city'] = filters.city;
      if (filters.country) query['location.country'] = filters.country;
      if (filters.capacity) query.capacity = { $gte: filters.capacity };

      const [docs, total] = await Promise.all([
        this.model.find(query).skip(skip).limit(limit).exec(),
        this.model.countDocuments(query),
      ]);
      return ok(
        createPaginatedResponse(docs.map(this.toDomain), total, skip, limit)
      );
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  private toDomain(doc: AccommodationDocument): Accommodation {
    return Accommodation.fromPrimitives(doc.toObject() as any);
  }
}
