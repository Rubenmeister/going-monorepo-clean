import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import {
  Parcel,
  IParcelRepository,
} from '@going-monorepo-clean/domains-parcel-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import {
  ParcelDocument,
  ParcelModelSchema,
} from './schemas/parcel.schema';

@Injectable()
export class MongooseParcelRepository implements IParcelRepository {
  constructor(
    @InjectModel(ParcelModelSchema.name)
    private readonly model: Model<ParcelDocument>,
  ) {}

  async save(parcel: Parcel): Promise<Result<void, Error>> {
    try {
      const primitives = parcel.toPrimitives();
      const newDoc = new this.model(primitives);
      await newDoc.save();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async update(parcel: Parcel): Promise<Result<void, Error>> {
    try {
      const primitives = parcel.toPrimitives();
      await this.model.updateOne({ id: parcel.id }, { $set: primitives }).exec();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findById(id: UUID): Promise<Result<Parcel | null, Error>> {
    try {
      const doc = await this.model.findOne({ id }).exec();
      return ok(doc ? this.toDomain(doc) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByUserId(userId: UUID): Promise<Result<Parcel[], Error>> {
    try {
      const docs = await this.model.find({ userId }).exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByDriverId(driverId: UUID): Promise<Result<Parcel[], Error>> {
    try {
      const docs = await this.model.find({ driverId }).exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  private toDomain(doc: ParcelDocument): Parcel {
    return Parcel.fromPrimitives(doc.toObject() as any);
  }
}