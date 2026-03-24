import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ride, RideDocument } from '../schemas/ride.schema';
import { IRideRepository, RideStatus } from '../../../domain/ports';
import {
  PaginationDto,
  PaginatedResult,
  getPaginationOptions,
  createPaginatedResponse,
} from '@going-monorepo-clean/shared-database';

/**
 * MongoDB Ride Repository
 * Persists ride data with GeoJSON support
 */
@Injectable()
export class MongoRideRepository implements IRideRepository {
  constructor(@InjectModel('Ride') private rideModel: Model<RideDocument>) {}

  async create(ride: any): Promise<any> {
    const created = await this.rideModel.create({
      rideId: ride.id,
      userId: ride.userId,
      driverId: ride.driverId,
      pickupLocation: {
        type: 'Point',
        coordinates: [
          ride.pickupLocation.coordinates.longitude,
          ride.pickupLocation.coordinates.latitude,
        ],
      },
      dropoffLocation: {
        type: 'Point',
        coordinates: [
          ride.dropoffLocation.longitude,
          ride.dropoffLocation.latitude,
        ],
      },
      fare: {
        baseFare: ride.fare.baseFare.amount,
        perKmFare: ride.fare.perKmFare.amount,
        perMinuteFare: ride.fare.perMinuteFare.amount,
        surgeMultiplier: ride.fare.surgeMultiplier,
        estimatedTotal: ride.fare.estimatedTotal.amount,
      },
      status: ride.status,
      requestedAt: ride.requestedAt,
    });

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<any> {
    const doc = await this.rideModel.findOne({ rideId: id });
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByUserId(userId: string, limit?: number): Promise<any[]> {
    const query = this.rideModel.find({ userId }).sort({ requestedAt: -1 });

    if (limit) {
      query.limit(limit);
    }

    const docs = await query;
    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findByUserIdPaginated(
    userId: string,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<any>> {
    const { skip, limit } = getPaginationOptions(pagination);
    const [docs, total] = await Promise.all([
      this.rideModel
        .find({ userId })
        .sort({ requestedAt: -1 })
        .skip(skip)
        .limit(limit),
      this.rideModel.countDocuments({ userId }),
    ]);

    return createPaginatedResponse(
      docs.map((doc) => this.mapToEntity(doc)),
      total,
      skip,
      limit
    );
  }

  async findByDriverId(driverId: string, limit?: number): Promise<any[]> {
    const query = this.rideModel.find({ driverId }).sort({ requestedAt: -1 });

    if (limit) {
      query.limit(limit);
    }

    const docs = await query;
    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findByDriverIdPaginated(
    driverId: string,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<any>> {
    const { skip, limit } = getPaginationOptions(pagination);
    const [docs, total] = await Promise.all([
      this.rideModel
        .find({ driverId })
        .sort({ requestedAt: -1 })
        .skip(skip)
        .limit(limit),
      this.rideModel.countDocuments({ driverId }),
    ]);

    return createPaginatedResponse(
      docs.map((doc) => this.mapToEntity(doc)),
      total,
      skip,
      limit
    );
  }

  async findActiveByDriverId(driverId: string): Promise<any[]> {
    const docs = await this.rideModel.find({
      driverId,
      status: { $in: ['accepted', 'arriving', 'started'] },
    });

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async update(id: string, updates: any): Promise<any> {
    const doc = await this.rideModel.findOneAndUpdate({ rideId: id }, updates, {
      new: true,
    });

    if (!doc) {
      throw new Error(`Ride ${id} not found`);
    }

    return this.mapToEntity(doc);
  }

  async findRecent(limit: number): Promise<any[]> {
    const docs = await this.rideModel
      .find({ status: 'requested' })
      .sort({ requestedAt: -1 })
      .limit(limit);

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findByStatus(status: string, limit?: number): Promise<any[]> {
    const query = this.rideModel.find({ status }).sort({ requestedAt: -1 });

    if (limit) {
      query.limit(limit);
    }

    const docs = await query;
    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findByStatusPaginated(
    status: string,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<any>> {
    const { skip, limit } = getPaginationOptions(pagination);
    const [docs, total] = await Promise.all([
      this.rideModel
        .find({ status })
        .sort({ requestedAt: -1 })
        .skip(skip)
        .limit(limit),
      this.rideModel.countDocuments({ status }),
    ]);

    return createPaginatedResponse(
      docs.map((doc) => this.mapToEntity(doc)),
      total,
      skip,
      limit
    );
  }

  async delete(id: string): Promise<void> {
    await this.rideModel.deleteOne({ rideId: id });
  }

  private mapToEntity(doc: any): any {
    return {
      id: doc.rideId,
      userId: doc.userId,
      driverId: doc.driverId,
      pickupLocation: {
        latitude: doc.pickupLocation.coordinates[1],
        longitude: doc.pickupLocation.coordinates[0],
      },
      dropoffLocation: {
        latitude: doc.dropoffLocation.coordinates[1],
        longitude: doc.dropoffLocation.coordinates[0],
      },
      fare: doc.fare,
      finalFare: doc.finalFare,
      status: doc.status,
      requestedAt: doc.requestedAt,
      acceptedAt: doc.acceptedAt,
      startedAt: doc.startedAt,
      completedAt: doc.completedAt,
      durationSeconds: doc.durationSeconds,
      distanceKm: doc.distanceKm,
      paymentRef: doc.paymentRef,
      paymentTxnId: doc.paymentTxnId,
      paymentEstimated: doc.paymentEstimated,
    };
  }
}
