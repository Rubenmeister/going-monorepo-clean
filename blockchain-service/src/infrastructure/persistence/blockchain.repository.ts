import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlockSchema } from '../schemas/block.schema';
import { TripRecordSchema } from '../schemas/trip-record.schema';

@Injectable()
export class BlockchainRepository {
  private readonly logger = new Logger(BlockchainRepository.name);

  constructor(
    @InjectModel(BlockSchema.name) private readonly blockModel: Model<BlockSchema>,
    @InjectModel(TripRecordSchema.name) private readonly tripModel: Model<TripRecordSchema>,
  ) {}

  async getLatestBlock(): Promise<any | null> {
    return this.blockModel.findOne().sort({ blockIndex: -1 }).lean().exec();
  }

  async createBlock(data: Partial<any>): Promise<any> {
    const block = new this.blockModel(data);
    return block.save();
  }

  async saveTripRecord(data: Partial<any>): Promise<any> {
    const record = new this.tripModel(data);
    return record.save();
  }

  async findTripByRideId(rideId: string): Promise<any | null> {
    return this.tripModel.findOne({ rideId }).lean().exec();
  }

  async findBlockByHash(hash: string): Promise<any | null> {
    return this.blockModel.findOne({ hash }).lean().exec();
  }

  async getRecentBlocks(limit = 10): Promise<any[]> {
    return this.blockModel.find().sort({ blockIndex: -1 }).limit(limit).lean().exec();
  }

  async getPendingTrips(): Promise<any[]> {
    return this.tripModel.find({ status: 'pending' }).limit(10).lean().exec();
  }

  async confirmTrips(rideIds: string[], blockHash: string): Promise<void> {
    await this.tripModel.updateMany(
      { rideId: { $in: rideIds }, status: 'pending' },
      { $set: { status: 'confirmed', blockHash } },
    ).exec();
  }

  async countBlocks(): Promise<number> {
    return this.blockModel.countDocuments();
  }
}
