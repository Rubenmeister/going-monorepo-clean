import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import {
  Trip,
  ITripRepository,
} from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import {
  TripDocument,
  TripModelSchema,
} from './schemas/trip.schema';

@Injectable()
export class MongooseTripRepository implements ITripRepository {
  constructor(
    @InjectModel(TripModelSchema.name)
    private readonly model: Model<TripDocument>,
  ) {}

  async save(trip: Trip): Promise<Result<void, Error>> {
    try {
      const primitives = trip.toPrimitives();
      const newDoc = new this.model(primitives);
      await newDoc.save();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async update(trip: Trip): Promise<Result<void, Error>> {
    try {
      const primitives = trip.toPrimitives();
      await this.model
        .updateOne({ id: trip.id }, { $set: primitives })
        .exec();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findById(id: UUID): Promise<Result<Trip | null, Error>> {
    try {
      const doc = await this.model.findOne({ id }).exec();
      return ok(doc ? this.toDomain(doc) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findActiveTripsByDriver(driverId: UUID): Promise<Result<Trip[], Error>> {
    try {
      const docs = await this.model.find({ 
        driverId, 
        status: { $in: ['driver_assigned', 'in_progress'] } 
      }).exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findTripsByUser(userId: UUID): Promise<Result<Trip[], Error>> {
    try {
      const docs = await this.model.find({ userId }).sort({ createdAt: -1 }).exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findPendingTrips(): Promise<Result<Trip[], Error>> {
    try {
      const docs = await this.model.find({ status: 'pending' }).exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  private toDomain(doc: TripDocument): Trip {
    return Trip.fromPrimitives(doc.toObject() as any);
  }
}