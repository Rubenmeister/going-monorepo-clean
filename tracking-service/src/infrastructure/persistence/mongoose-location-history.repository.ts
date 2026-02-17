import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';
import {
  ILocationHistoryRepository,
  LocationHistory,
} from '@going-monorepo-clean/domains-tracking-core';
import {
  LocationHistoryModelSchema,
  LocationHistoryDocument,
} from './schemas/location-history.schema';

@Injectable()
export class MongooseLocationHistoryRepository implements ILocationHistoryRepository {
  private readonly logger = new Logger(MongooseLocationHistoryRepository.name);

  constructor(
    @InjectModel(LocationHistoryModelSchema.name)
    private readonly model: Model<LocationHistoryDocument>,
  ) {}

  async save(record: LocationHistory): Promise<Result<void, Error>> {
    try {
      const primitives = record.toPrimitives();
      await this.model.create(primitives);
      return ok(undefined);
    } catch (error) {
      this.logger.error(`Error saving location history: ${error}`);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async saveBatch(records: LocationHistory[]): Promise<Result<void, Error>> {
    try {
      const docs = records.map((r) => r.toPrimitives());
      await this.model.insertMany(docs, { ordered: false });
      return ok(undefined);
    } catch (error) {
      this.logger.error(`Error batch-saving location history: ${error}`);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async findByDriverId(
    driverId: UUID,
    from: Date,
    to: Date,
  ): Promise<Result<LocationHistory[], Error>> {
    try {
      const docs = await this.model
        .find({
          driverId,
          recordedAt: { $gte: from, $lte: to },
        })
        .sort({ recordedAt: -1 })
        .lean()
        .exec();

      const records = docs.map((doc) => LocationHistory.fromPrimitives(doc));
      return ok(records);
    } catch (error) {
      this.logger.error(`Error finding location history by driver: ${error}`);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async findByTripId(tripId: UUID): Promise<Result<LocationHistory[], Error>> {
    try {
      const docs = await this.model
        .find({ tripId })
        .sort({ recordedAt: 1 })
        .lean()
        .exec();

      const records = docs.map((doc) => LocationHistory.fromPrimitives(doc));
      return ok(records);
    } catch (error) {
      this.logger.error(`Error finding location history by trip: ${error}`);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async findLastByDriverId(driverId: UUID): Promise<Result<LocationHistory | null, Error>> {
    try {
      const doc = await this.model
        .findOne({ driverId })
        .sort({ recordedAt: -1 })
        .lean()
        .exec();

      if (!doc) return ok(null);
      return ok(LocationHistory.fromPrimitives(doc));
    } catch (error) {
      this.logger.error(`Error finding last location for driver: ${error}`);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
