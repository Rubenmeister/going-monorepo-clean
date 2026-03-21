import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DriverAnalytics,
  DriverAnalyticsDocument,
} from '../schemas/driver-analytics.schema';
import { IDriverAnalyticsRepository } from '../../../domain/ports';

/**
 * MongoDB Driver Analytics Repository
 */
@Injectable()
export class MongoDriverAnalyticsRepository
  implements IDriverAnalyticsRepository
{
  constructor(
    @InjectModel(DriverAnalytics.name)
    private analyticsModel: Model<DriverAnalyticsDocument>
  ) {}

  async create(analytics: any): Promise<any> {
    const created = await this.analyticsModel.create({
      driverId: analytics.driverId,
      period: analytics.period,
      date: analytics.date,
      ridesCompleted: analytics.ridesCompleted || 0,
      ridesCancelled: analytics.ridesCancelled || 0,
      hoursOnline: analytics.hoursOnline || 0,
      averageRideDistance: analytics.averageRideDistance || 0,
      averageRideDuration: analytics.averageRideDuration || 0,
      totalEarnings: analytics.totalEarnings || 0,
      averageEarningsPerRide: analytics.averageEarningsPerRide || 0,
      averageEarningsPerHour: analytics.averageEarningsPerHour || 0,
      averageRating: analytics.averageRating || 5.0,
      totalRatings: analytics.totalRatings || 0,
      acceptanceRate: analytics.acceptanceRate || 100,
      cancellationRate: analytics.cancellationRate || 0,
      onTimeDeliveryRate: analytics.onTimeDeliveryRate || 100,
      badges: analytics.badges || [],
    });

    return this.mapToEntity(created);
  }

  async findByDriverAndPeriod(
    driverId: string,
    period: string,
    date: Date
  ): Promise<any> {
    const doc = await this.analyticsModel.findOne({
      driverId,
      period,
      date: this.getDateRange(date, period),
    });

    return doc ? this.mapToEntity(doc) : null;
  }

  async findByDriver(driverId: string, limit = 20): Promise<any[]> {
    const docs = await this.analyticsModel
      .find({ driverId })
      .sort({ date: -1 })
      .limit(limit);

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async update(
    driverId: string,
    period: string,
    date: Date,
    updates: any
  ): Promise<any> {
    const doc = await this.analyticsModel.findOneAndUpdate(
      {
        driverId,
        period,
        date: this.getDateRange(date, period),
      },
      { ...updates },
      { new: true }
    );

    if (!doc) {
      throw new Error(`Analytics for driver ${driverId} not found`);
    }

    return this.mapToEntity(doc);
  }

  async delete(driverId: string, period: string, date: Date): Promise<void> {
    await this.analyticsModel.deleteOne({
      driverId,
      period,
      date: this.getDateRange(date, period),
    });
  }

  async findTopDrivers(period: string, limit = 10): Promise<any[]> {
    const docs = await this.analyticsModel
      .find({ period })
      .sort({ totalEarnings: -1 })
      .limit(limit);

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findDriversByMetric(
    metric: string,
    sortOrder: 'asc' | 'desc' = 'desc',
    limit = 20
  ): Promise<any[]> {
    const sortObj: Record<string, number> = {};
    sortObj[metric] = sortOrder === 'desc' ? -1 : 1;

    const docs = await this.analyticsModel.find().sort(sortObj).limit(limit);

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findLatestByDriver(driverId: string, days = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const docs = await this.analyticsModel
      .find({
        driverId,
        date: { $gte: startDate },
      })
      .sort({ date: -1 });

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findMonthlyStats(
    driverId: string,
    year: number,
    month: number
  ): Promise<any[]> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const docs = await this.analyticsModel
      .find({
        driverId,
        period: 'daily',
        date: { $gte: startDate, $lte: endDate },
      })
      .sort({ date: -1 });

    return docs.map((doc) => this.mapToEntity(doc));
  }

  private getDateRange(date: Date, period: string): { $gte: Date; $lte: Date } {
    const start = new Date(date);
    const end = new Date(date);

    switch (period) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        start.setDate(date.getDate() - date.getDay());
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(date.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yearly':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { $gte: start, $lte: end };
  }

  private mapToEntity(doc: any): any {
    return {
      driverId: doc.driverId,
      period: doc.period,
      date: doc.date,
      ridesCompleted: doc.ridesCompleted,
      ridesCancelled: doc.ridesCancelled,
      hoursOnline: doc.hoursOnline,
      averageRideDistance: doc.averageRideDistance,
      averageRideDuration: doc.averageRideDuration,
      totalEarnings: doc.totalEarnings,
      averageEarningsPerRide: doc.averageEarningsPerRide,
      averageEarningsPerHour: doc.averageEarningsPerHour,
      averageRating: doc.averageRating,
      totalRatings: doc.totalRatings,
      acceptanceRate: doc.acceptanceRate,
      cancellationRate: doc.cancellationRate,
      onTimeDeliveryRate: doc.onTimeDeliveryRate,
      badges: doc.badges,
      createdAt: doc.createdAt,
    };
  }
}
