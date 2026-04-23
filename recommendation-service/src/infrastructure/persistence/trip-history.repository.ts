import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TripHistorySchema } from '../schemas/trip-history.schema';

@Injectable()
export class TripHistoryRepository {
  private readonly logger = new Logger(TripHistoryRepository.name);

  constructor(
    @InjectModel(TripHistorySchema.name)
    private readonly model: Model<TripHistorySchema>,
  ) {}

  async recordTrip(userId: string, from: string, to: string, fromLat?: number, fromLng?: number, toLat?: number, toLng?: number, rideId?: string): Promise<void> {
    try {
      await this.model.findOneAndUpdate(
        { userId, toAddress: to },
        {
          $inc: { count: 1 },
          $set: { fromAddress: from, fromLat, fromLng, toLat, toLng, lastTripAt: new Date(), ...(rideId && { rideId }) },
          $setOnInsert: { userId, toAddress: to },
        },
        { upsert: true },
      ).exec();
    } catch (e) {
      this.logger.error(`recordTrip error: ${e}`);
    }
  }

  async getFrequentDestinations(userId: string, limit = 5): Promise<any[]> {
    try {
      return await this.model
        .find({ userId })
        .sort({ count: -1 })
        .limit(limit)
        .lean()
        .exec();
    } catch (e) {
      this.logger.error(`getFrequentDestinations error: ${e}`);
      return [];
    }
  }

  async getFrequentRoutes(userId: string, limit = 3): Promise<any[]> {
    try {
      return await this.model
        .find({ userId, count: { $gte: 2 } })
        .sort({ count: -1 })
        .limit(limit)
        .lean()
        .exec();
    } catch (e) {
      return [];
    }
  }
}
