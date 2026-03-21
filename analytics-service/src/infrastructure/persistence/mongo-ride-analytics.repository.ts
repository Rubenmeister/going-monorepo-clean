import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RideAnalytics,
  RideAnalyticsDocument,
} from '../schemas/ride-analytics.schema';
import { IRideAnalyticsRepository } from '../../../domain/ports';

/**
 * MongoDB Ride Analytics Repository
 */
@Injectable()
export class MongoRideAnalyticsRepository implements IRideAnalyticsRepository {
  constructor(
    @InjectModel(RideAnalytics.name)
    private analyticsModel: Model<RideAnalyticsDocument>
  ) {}

  async create(analytics: any): Promise<any> {
    const created = await this.analyticsModel.create({
      date: analytics.date,
      totalRides: analytics.totalRides || 0,
      completedRides: analytics.completedRides || 0,
      cancelledRides: analytics.cancelledRides || 0,
      totalDistance: analytics.totalDistance || 0,
      totalDuration: analytics.totalDuration || 0,
      totalRevenue: analytics.totalRevenue || 0,
      platformRevenue: analytics.platformRevenue || 0,
      driverEarnings: analytics.driverEarnings || 0,
      peakHourRides: analytics.peakHourRides || {},
      ridesByStatus: analytics.ridesByStatus || {
        completed: 0,
        cancelled: 0,
        noShow: 0,
      },
      cancellationRateByReason: analytics.cancellationRateByReason || {},
      topRoutes: analytics.topRoutes || [],
    });

    return this.mapToEntity(created);
  }

  async findByDate(date: Date): Promise<any> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const doc = await this.analyticsModel.findOne({
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    return doc ? this.mapToEntity(doc) : null;
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    const docs = await this.analyticsModel
      .find({
        date: { $gte: startDate, $lte: endDate },
      })
      .sort({ date: -1 });

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async update(date: Date, updates: any): Promise<any> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const doc = await this.analyticsModel.findOneAndUpdate(
      { date: { $gte: startOfDay, $lte: endOfDay } },
      { ...updates },
      { new: true }
    );

    if (!doc) {
      throw new Error(`Analytics for ${date} not found`);
    }

    return this.mapToEntity(doc);
  }

  async delete(date: Date): Promise<void> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    await this.analyticsModel.deleteOne({
      date: { $gte: startOfDay, $lte: endOfDay },
    });
  }

  async findLatest(days = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const docs = await this.analyticsModel
      .find({ date: { $gte: startDate } })
      .sort({ date: -1 })
      .limit(days);

    return docs.map((doc) => this.mapToEntity(doc));
  }

  private mapToEntity(doc: any): any {
    return {
      date: doc.date,
      totalRides: doc.totalRides,
      completedRides: doc.completedRides,
      cancelledRides: doc.cancelledRides,
      totalDistance: doc.totalDistance,
      totalDuration: doc.totalDuration,
      totalRevenue: doc.totalRevenue,
      platformRevenue: doc.platformRevenue,
      driverEarnings: doc.driverEarnings,
      peakHourRides: Object.fromEntries(doc.peakHourRides || []),
      ridesByStatus: doc.ridesByStatus,
      cancellationRateByReason: Object.fromEntries(
        doc.cancellationRateByReason || []
      ),
      topRoutes: doc.topRoutes,
    };
  }
}
