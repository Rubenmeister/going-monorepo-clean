import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import { RideRequest, IRideRequestRepository } from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { RideRequestDocument, RideRequestModelSchema } from './schemas/ride-request.schema';

@Injectable()
export class MongooseRideRequestRepository implements IRideRequestRepository {
  constructor(
    @InjectModel(RideRequestModelSchema.name)
    private readonly model: Model<RideRequestDocument>,
  ) {}

  async save(request: RideRequest): Promise<Result<void, Error>> {
    try {
      const newDoc = new this.model(request.toPrimitives());
      await newDoc.save();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async update(request: RideRequest): Promise<Result<void, Error>> {
    try {
      await this.model.updateOne({ id: request.id }, { $set: request.toPrimitives() }).exec();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findById(id: UUID): Promise<Result<RideRequest | null, Error>> {
    try {
      const doc = await this.model.findOne({ id }).exec();
      return ok(doc ? RideRequest.fromPrimitives(doc.toObject() as any) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByPassengerId(passengerId: UUID): Promise<Result<RideRequest[], Error>> {
    try {
      const docs = await this.model.find({ passengerId }).sort({ requestedAt: -1 }).exec();
      return ok(docs.map(d => RideRequest.fromPrimitives(d.toObject() as any)));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findPendingByPriority(): Promise<Result<RideRequest[], Error>> {
    try {
      const docs = await this.model
        .find({ status: { $in: ['pending', 'searching'] } })
        .sort({ priority: 1 })
        .exec();
      return ok(docs.map(d => RideRequest.fromPrimitives(d.toObject() as any)));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findActiveByPassenger(passengerId: UUID): Promise<Result<RideRequest | null, Error>> {
    try {
      const doc = await this.model.findOne({
        passengerId,
        status: { $in: ['pending', 'searching', 'assigned', 'driver_en_route', 'passenger_picked_up', 'in_progress'] },
      }).exec();
      return ok(doc ? RideRequest.fromPrimitives(doc.toObject() as any) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }
}
