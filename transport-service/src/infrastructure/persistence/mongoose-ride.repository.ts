import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RideModelSchema, RideDocument } from './schemas/ride.schema';
import { IRideRepository } from '../../domain/ports';

@Injectable()
export class MongooseRideRepository implements IRideRepository {
  constructor(
    @InjectModel(RideModelSchema.name)
    private readonly model: Model<RideDocument>
  ) {}

  async create(ride: any): Promise<any> {
    const doc = await this.model.create({
      userId: ride.userId,
      driverId: ride.driverId,
      pickupLocation: ride.pickupLocation?.toObject?.() ?? ride.pickupLocation,
      dropoffLocation:
        ride.dropoffLocation?.toObject?.() ?? ride.dropoffLocation,
      fare: ride.fare?.toObject?.() ?? ride.fare,
      status: ride.status,
      requestedAt: ride.requestedAt,
    });
    return this._toRideData(doc);
  }

  async findById(id: string): Promise<any | null> {
    const doc = await this.model.findById(id).lean();
    if (!doc) return null;
    return this._toRideData(doc);
  }

  async findByUserId(userId: string, limit = 20): Promise<any[]> {
    const docs = await this.model
      .find({ userId })
      .limit(limit)
      .sort({ requestedAt: -1 })
      .lean();
    return docs.map((d) => this._toRideData(d));
  }

  async findByDriverId(driverId: string, limit = 20): Promise<any[]> {
    const docs = await this.model
      .find({ driverId })
      .limit(limit)
      .sort({ requestedAt: -1 })
      .lean();
    return docs.map((d) => this._toRideData(d));
  }

  async findActiveByDriverId(driverId: string): Promise<any[]> {
    const docs = await this.model
      .find({
        driverId,
        status: { $in: ['requested', 'accepted', 'arriving', 'started'] },
      })
      .lean();
    return docs.map((d) => this._toRideData(d));
  }

  async update(id: string, data: any): Promise<any> {
    const doc = await this.model
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean();
    if (!doc) throw new Error(`Ride ${id} not found`);
    return this._toRideData(doc);
  }

  async findRecent(limit: number): Promise<any[]> {
    const docs = await this.model
      .find()
      .limit(limit)
      .sort({ requestedAt: -1 })
      .lean();
    return docs.map((d) => this._toRideData(d));
  }

  async findByStatus(status: string, limit = 20): Promise<any[]> {
    const docs = await this.model.find({ status }).limit(limit).lean();
    return docs.map((d) => this._toRideData(d));
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }

  private _toRideData(doc: any): any {
    return {
      id: doc._id?.toString() ?? doc.id,
      userId: doc.userId,
      driverId: doc.driverId,
      pickupLocation: doc.pickupLocation,
      dropoffLocation: doc.dropoffLocation,
      fare: doc.fare,
      finalFare: doc.finalFare,
      status: doc.status,
      requestedAt: doc.requestedAt,
      acceptedAt: doc.acceptedAt,
      startedAt: doc.startedAt,
      completedAt: doc.completedAt,
      durationSeconds: doc.durationSeconds,
      distanceKm: doc.distanceKm,
      cancellationReason: doc.cancellationReason,
    };
  }
}
