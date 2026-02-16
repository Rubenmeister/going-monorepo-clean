import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import { DriverProfile, IDriverProfileRepository } from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { DriverProfileDocument, DriverProfileModelSchema } from './schemas/driver-profile.schema';

@Injectable()
export class MongooseDriverProfileRepository implements IDriverProfileRepository {
  constructor(
    @InjectModel(DriverProfileModelSchema.name)
    private readonly model: Model<DriverProfileDocument>,
  ) {}

  async save(profile: DriverProfile): Promise<Result<void, Error>> {
    try {
      const newDoc = new this.model(profile.toPrimitives());
      await newDoc.save();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async update(profile: DriverProfile): Promise<Result<void, Error>> {
    try {
      await this.model.updateOne({ id: profile.id }, { $set: profile.toPrimitives() }).exec();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findById(id: UUID): Promise<Result<DriverProfile | null, Error>> {
    try {
      const doc = await this.model.findOne({ id }).exec();
      return ok(doc ? DriverProfile.fromPrimitives(doc.toObject() as any) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByUserId(userId: UUID): Promise<Result<DriverProfile | null, Error>> {
    try {
      const doc = await this.model.findOne({ userId }).exec();
      return ok(doc ? DriverProfile.fromPrimitives(doc.toObject() as any) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findActiveDrivers(): Promise<Result<DriverProfile[], Error>> {
    try {
      const docs = await this.model.find({ status: 'active' }).exec();
      return ok(docs.map(d => DriverProfile.fromPrimitives(d.toObject() as any)));
    } catch (error) {
      return err(new Error(error.message));
    }
  }
}
