import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ITrackingSessionRepository,
  TrackingSession,
  GeoLocation,
} from '../../../domain/ports';
import { TrackingSessionSchema } from '../schemas/tracking-session.schema';

/**
 * MongoDB Tracking Repository
 * Persists tracking sessions and historical data
 */
@Injectable()
export class MongoTrackingRepository implements ITrackingSessionRepository {
  constructor(
    @InjectModel('TrackingSession')
    private trackingSessionModel: Model<TrackingSessionSchema>
  ) {}

  async create(session: TrackingSession): Promise<TrackingSession> {
    const created = await this.trackingSessionModel.create({
      _id: session.id,
      tripId: session.tripId,
      driverId: session.driverId,
      userId: session.userId,
      startLocation: {
        type: 'Point',
        coordinates: [
          session.startLocation.coordinates.longitude,
          session.startLocation.coordinates.latitude,
        ],
      },
      route: session.route.map((loc) => ({
        type: 'Point',
        coordinates: [loc.coordinates.longitude, loc.coordinates.latitude],
        accuracy: loc.accuracy,
        timestamp: loc.timestamp,
      })),
      status: session.status,
      createdAt: session.createdAt,
    });

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<TrackingSession | null> {
    const doc = await this.trackingSessionModel.findById(id);
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByTripId(tripId: string): Promise<TrackingSession | null> {
    const doc = await this.trackingSessionModel.findOne({ tripId });
    return doc ? this.mapToEntity(doc) : null;
  }

  async findActiveByDriverId(driverId: string): Promise<TrackingSession[]> {
    const docs = await this.trackingSessionModel.find({
      driverId,
      status: 'active',
    });
    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findByUserId(
    userId: string,
    limit?: number
  ): Promise<TrackingSession[]> {
    const query = this.trackingSessionModel.find({ userId }).sort({
      createdAt: -1,
    });

    if (limit) {
      query.limit(limit);
    }

    const docs = await query;
    return docs.map((doc) => this.mapToEntity(doc));
  }

  async update(
    id: string,
    updates: Partial<TrackingSession>
  ): Promise<TrackingSession> {
    const doc = await this.trackingSessionModel.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!doc) {
      throw new Error(`TrackingSession with id ${id} not found`);
    }

    return this.mapToEntity(doc);
  }

  async complete(id: string, endLocation: any): Promise<TrackingSession> {
    const doc = await this.trackingSessionModel.findByIdAndUpdate(
      id,
      {
        status: 'completed',
        endLocation: {
          type: 'Point',
          coordinates: [endLocation.longitude, endLocation.latitude],
        },
        completedAt: new Date(),
      },
      { new: true }
    );

    if (!doc) {
      throw new Error(`TrackingSession with id ${id} not found`);
    }

    return this.mapToEntity(doc);
  }

  async delete(id: string): Promise<void> {
    await this.trackingSessionModel.findByIdAndDelete(id);
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    driverId?: string
  ): Promise<TrackingSession[]> {
    const query: any = {
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (driverId) {
      query.driverId = driverId;
    }

    const docs = await this.trackingSessionModel.find(query).sort({
      createdAt: -1,
    });

    return docs.map((doc) => this.mapToEntity(doc));
  }

  private mapToEntity(doc: any): TrackingSession {
    const route: GeoLocation[] = (doc.route || []).map(
      (routePoint: any) =>
        new GeoLocation({
          driverId: doc.driverId,
          coordinates: {
            latitude: routePoint.coordinates[1],
            longitude: routePoint.coordinates[0],
          } as any,
          accuracy: routePoint.accuracy || 0,
          timestamp: routePoint.timestamp || new Date(),
        })
    );

    const endLocation = doc.endLocation
      ? new GeoLocation({
          driverId: doc.driverId,
          coordinates: {
            latitude: doc.endLocation.coordinates[1],
            longitude: doc.endLocation.coordinates[0],
          } as any,
          accuracy: 0,
          timestamp: doc.completedAt || new Date(),
        })
      : undefined;

    return new TrackingSession({
      id: doc._id,
      tripId: doc.tripId,
      driverId: doc.driverId,
      userId: doc.userId,
      startLocation: new GeoLocation({
        driverId: doc.driverId,
        coordinates: {
          latitude: doc.startLocation.coordinates[1],
          longitude: doc.startLocation.coordinates[0],
        } as any,
        accuracy: 0,
        timestamp: doc.createdAt,
      }),
      endLocation,
      route,
      status: doc.status,
      createdAt: doc.createdAt,
      completedAt: doc.completedAt,
    });
  }
}
