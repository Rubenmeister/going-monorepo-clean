import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DriverProfile,
  DriverProfileDocument,
} from '../schemas/driver-profile.schema';
import { IDriverProfileRepository } from '../../domain/ports';

/**
 * MongoDB Driver Profile Repository
 */
@Injectable()
export class MongoDriverProfileRepository implements IDriverProfileRepository {
  constructor(
    @InjectModel('DriverProfile')
    private profileModel: Model<DriverProfileDocument>
  ) {}

  async create(profile: any): Promise<any> {
    const created = await this.profileModel.create({
      driverId: profile.driverId,
      averageRating: profile.averageRating || 5.0,
      totalRatings: profile.totalRatings || 0,
      completedTrips: profile.completedTrips || 0,
      cancelledTrips: profile.cancelledTrips || 0,
      acceptanceRate: profile.acceptanceRate || 100,
      cancellationRate: profile.cancellationRate || 0,
      onTimeDeliveryRate: profile.onTimeDeliveryRate || 100,
      totalEarnings: profile.totalEarnings || 0,
      averageEarningsPerTrip: profile.averageEarningsPerTrip || 0,
      badges: profile.badges || [],
    });

    return this.mapToEntity(created);
  }

  async findByDriver(driverId: string): Promise<any> {
    let doc = await this.profileModel.findOne({ driverId });

    // Auto-create profile if it doesn't exist
    if (!doc) {
      doc = await this.profileModel.create({
        driverId,
        averageRating: 5.0,
        totalRatings: 0,
        completedTrips: 0,
        cancelledTrips: 0,
        acceptanceRate: 100,
        cancellationRate: 0,
        onTimeDeliveryRate: 100,
        totalEarnings: 0,
        averageEarningsPerTrip: 0,
        badges: [],
      });
    }

    return this.mapToEntity(doc);
  }

  async update(driverId: string, updates: any): Promise<any> {
    const doc = await this.profileModel.findOneAndUpdate(
      { driverId },
      {
        ...updates,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!doc) {
      throw new Error(`Driver profile ${driverId} not found`);
    }

    return this.mapToEntity(doc);
  }

  async delete(driverId: string): Promise<void> {
    await this.profileModel.deleteOne({ driverId });
  }

  async findTopRatedDrivers(limit = 10): Promise<any[]> {
    const docs = await this.profileModel
      .find()
      .sort({ averageRating: -1, totalRatings: -1 })
      .limit(limit);

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findByBadge(badge: string, limit = 20): Promise<any[]> {
    const docs = await this.profileModel
      .find({ badges: { $in: [badge] } })
      .sort({ totalRatings: -1 })
      .limit(limit);

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findSuperDrivers(): Promise<any[]> {
    const docs = await this.profileModel
      .find({ badges: { $in: ['super_driver'] } })
      .sort({ totalRatings: -1 });

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async updateAggregateStats(
    driverId: string,
    stats: {
      averageRating: number;
      totalRatings: number;
      completedTrips?: number;
      cancelledTrips?: number;
      acceptanceRate?: number;
      cancellationRate?: number;
      onTimeDeliveryRate?: number;
      totalEarnings?: number;
      averageEarningsPerTrip?: number;
      badges?: string[];
      lastRated?: Date;
    }
  ): Promise<any> {
    const doc = await this.profileModel.findOneAndUpdate(
      { driverId },
      {
        ...stats,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!doc) {
      throw new Error(`Driver profile ${driverId} not found`);
    }

    return this.mapToEntity(doc);
  }

  private mapToEntity(doc: any): any {
    return {
      driverId: doc.driverId,
      averageRating: doc.averageRating,
      totalRatings: doc.totalRatings,
      completedTrips: doc.completedTrips,
      cancelledTrips: doc.cancelledTrips,
      acceptanceRate: doc.acceptanceRate,
      cancellationRate: doc.cancellationRate,
      onTimeDeliveryRate: doc.onTimeDeliveryRate,
      totalEarnings: doc.totalEarnings,
      averageEarningsPerTrip: doc.averageEarningsPerTrip,
      badges: doc.badges,
      lastRated: doc.lastRated,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
